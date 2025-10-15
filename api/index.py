from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import anthropic
import os
import sys
import json
import logging
import re
from typing import List, Optional
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Security: Setup logging to track API usage
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Import from the knowledge directory relative to this file
current_dir = os.path.dirname(__file__)
sys.path.insert(0, current_dir)
from knowledge.alteryx_mapping import get_alteryx_knowledge

app = FastAPI(
    title="Alter-thon API",
    description="Convert Alteryx workflows to Python code using AI",
    version="1.0.0"
)

# Security: Restrict CORS origins in production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: Restrict in production
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)

# Security: Input validation and sanitization
def validate_requirement(requirement: str) -> str:
    """Validate and sanitize user requirement input."""
    if not requirement or not requirement.strip():
        raise HTTPException(status_code=400, detail="Requirement cannot be empty")
    
    # Security: Limit input length to prevent DoS
    if len(requirement) > 5000:
        raise HTTPException(status_code=400, detail="Requirement too long (max 5000 characters)")
    
    # Security: Remove potential script injection attempts
    cleaned = re.sub(r'<script.*?</script>', '', requirement, flags=re.IGNORECASE | re.DOTALL)
    cleaned = re.sub(r'javascript:', '', cleaned, flags=re.IGNORECASE)
    
    return cleaned.strip()

def validate_files(files: List[UploadFile]) -> List[dict]:
    """Validate uploaded files for security."""
    if not files:
        return []
    
    validated_files = []
    
    for file in files:
        if not file.filename:
            continue
            
        # Security: Validate file extensions
        allowed_extensions = {'.csv', '.xlsx', '.xls'}
        file_ext = Path(file.filename).suffix.lower()
        
        if file_ext not in allowed_extensions:
            raise HTTPException(
                status_code=400, 
                detail=f"File '{file.filename}' has unsupported extension. Only CSV and Excel files allowed."
            )
        
        # Security: Validate file size (10MB limit)
        if hasattr(file, 'size') and file.size > 10 * 1024 * 1024:
            raise HTTPException(
                status_code=400,
                detail=f"File '{file.filename}' too large (max 10MB)"
            )
        
        # Security: Sanitize filename
        safe_filename = re.sub(r'[^a-zA-Z0-9._-]', '_', file.filename)
        
        validated_files.append({
            "name": safe_filename,
            "original_name": file.filename,
            "size": getattr(file, 'size', 0)
        })
    
    return validated_files

def clean_json_response(text: str) -> str:
    """Extract JSON from Claude's response."""
    text = text.strip()
    if "```json" in text:
        text = text.split("```json")[1].split("```")[0].strip()
    elif "```" in text:
        text = text.split("```")[1].split("```")[0].strip()
    return text

def validate_generated_script(script: str) -> None:
    """Validate generated Python script for security."""
    # Security: Check for dangerous operations
    dangerous_patterns = [
        r'os\.system\(',
        r'subprocess\.',
        r'eval\(',
        r'exec\(',
        r'__import__\(',
        r'open\([^)]*["\'][wax]',  # File writing in dangerous modes
        r'rmtree\(',
        r'remove\(',
        r'unlink\(',
    ]
    
    for pattern in dangerous_patterns:
        if re.search(pattern, script, re.IGNORECASE):
            logger.warning(f"Potentially dangerous pattern detected: {pattern}")
            raise HTTPException(
                status_code=400,
                detail="Generated script contains potentially unsafe operations"
            )

@app.post("/api/generate")
async def generate_script(
    requirement: str = Form(...),
    files: List[UploadFile] = File(None),
    x_api_key: str = Header(None, alias="X-API-Key")
):
    """Generate Python script and workflow diagram from natural language."""

    # Security: Validate API key from header (user-provided) or environment (fallback)
    api_key = x_api_key or os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        logger.error("No API key provided")
        raise HTTPException(
            status_code=401,
            detail="API key required. Please provide your Anthropic API key."
        )

    # Validate API key format
    if not api_key.startswith("sk-ant-"):
        logger.error("Invalid API key format")
        raise HTTPException(
            status_code=401,
            detail="Invalid API key format"
        )
    
    # Security: Validate and sanitize inputs
    try:
        cleaned_requirement = validate_requirement(requirement)
        validated_files = validate_files(files or [])
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Input validation error: {str(e)}")
        raise HTTPException(status_code=400, detail="Invalid input data")
    
    # Security: Log request for monitoring
    logger.info(f"Generate request: {len(cleaned_requirement)} chars, {len(validated_files)} files")
    
    alteryx_knowledge = get_alteryx_knowledge()
    
    # Security: Construct secure prompt
    prompt = f"""{alteryx_knowledge}

## USER REQUEST

Files uploaded: {[f['name'] for f in validated_files] if validated_files else "None"}
User requirement: {cleaned_requirement}

## SECURITY REQUIREMENTS

Generated Python code MUST:
- Only use pandas, numpy, and standard library functions
- NOT include any system commands or file operations outside of data processing
- NOT include eval(), exec(), or dynamic code execution
- Use safe file I/O operations only
- Include proper error handling

## YOUR TASK

Generate complete solution with:
1. Executable Python script using pandas
2. Mermaid diagram showing workflow

## REQUIREMENTS

Python Script MUST:
- Use exact uploaded file names
- Include all imports at top
- Have configuration section for file paths
- **ALWAYS normalize column names to lowercase after loading each CSV/Excel file**
- **Use lowercase column names in all operations (filtering, grouping, etc.)**
- Include try-except error handling
- Add print statements for progress
- Create output directories if needed
- Be fully executable as-is
- Have helpful comments
- Follow security best practices

Mermaid Diagram MUST:
- Show complete data flow
- Use appropriate icons (📂, 🔍, 🔗, etc.)
- Include operation details (e.g., "Filter: Amount > 1000")
- Use "graph TB" format
- Keep labels concise but informative

## OUTPUT FORMAT

Respond with ONLY valid JSON in this exact structure:

{{
  "script": "complete Python script here",
  "diagram": "complete Mermaid diagram here",
  "explanation": "brief step-by-step explanation of what the script does",
  "input_files": ["list", "of", "expected", "input", "files"],
  "output_files": ["list", "of", "files", "that", "will", "be", "created"]
}}

CRITICAL:
- DO NOT include any text outside the JSON structure
- DO NOT use markdown code blocks in JSON values
- Ensure all JSON is valid and properly escaped
- Only generate safe, data-processing Python code
"""

    try:
        client = anthropic.Anthropic(api_key=api_key)
        
        # Security: Use specific model and limit tokens
        response = client.messages.create(
            model="claude-sonnet-4-5",
            max_tokens=4000,
            temperature=0.3,
            messages=[{"role": "user", "content": prompt}]
        )
        
        response_text = response.content[0].text
        clean_text = clean_json_response(response_text)
        result = json.loads(clean_text)
        
        # Security: Validate response structure
        required_keys = ["script", "diagram", "explanation", "input_files", "output_files"]
        for key in required_keys:
            if key not in result:
                raise ValueError(f"Missing required key: {key}")
        
        # Security: Validate generated script
        validate_generated_script(result["script"])
        
        # Security: Log successful generation
        logger.info("Script generated successfully")
        
        return JSONResponse(content=result)
        
    except json.JSONDecodeError as e:
        logger.error(f"JSON parsing error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to parse AI response")
    except anthropic.APIError as e:
        logger.error(f"Anthropic API error: {str(e)}")
        raise HTTPException(status_code=500, detail="AI service error")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.post("/api/execute")
async def execute_script(
    script: str = Form(...),
    files: List[UploadFile] = File(None)
):
    """Execute generated Python script with uploaded data files."""
    
    import tempfile
    import subprocess
    import shutil
    
    # Security: Validate script doesn't contain dangerous operations
    try:
        validate_generated_script(script)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Script validation error: {str(e)}")
        raise HTTPException(status_code=400, detail="Script validation failed")
    
    # Create temporary directory for execution
    with tempfile.TemporaryDirectory() as temp_dir:
        try:
            # Save uploaded files to temp directory
            if files:
                for file in files:
                    if file.filename:
                        file_path = Path(temp_dir) / file.filename
                        with open(file_path, 'wb') as f:
                            shutil.copyfileobj(file.file, f)
                        logger.info(f"Saved file: {file.filename}")
            
            # Save script to temp directory
            script_path = Path(temp_dir) / "script.py"
            with open(script_path, 'w') as f:
                f.write(script)
            
            # Execute script with timeout
            result = subprocess.run(
                ['python', str(script_path)],
                cwd=temp_dir,
                capture_output=True,
                text=True,
                timeout=30  # 30 second timeout
            )
            
            # Check for output files
            output_files = []
            output_dir = Path(temp_dir) / "output"
            if output_dir.exists():
                for file in output_dir.iterdir():
                    if file.is_file():
                        output_files.append({
                            "name": file.name,
                            "size": file.stat().st_size
                        })
            
            return JSONResponse(content={
                "stdout": result.stdout,
                "stderr": result.stderr,
                "return_code": result.returncode,
                "output_files": output_files,
                "success": result.returncode == 0
            })
            
        except subprocess.TimeoutExpired:
            logger.error("Script execution timeout")
            raise HTTPException(status_code=408, detail="Script execution timed out")
        except Exception as e:
            logger.error(f"Execution error: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Execution error: {str(e)}")

@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "Alter-thon API",
        "version": "1.0.0",
        "security": "enabled"
    }

# Security: Rate limiting would be added here in production
# Security: Authentication middleware would be added here if needed

handler = app
import { useState, useEffect } from 'react';
import Anthropic from '@anthropic-ai/sdk';
import mermaid from 'mermaid';
import { getAlteryxKnowledge } from './alteryxKnowledge';
import './App.css';

mermaid.initialize({ startOnLoad: false, theme: 'default', securityLevel: 'loose' });

function App() {
  const [files, setFiles] = useState([]);
  const [requirement, setRequirement] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [apiKeySet, setApiKeySet] = useState(false);

  // Load API key from localStorage on mount
  useEffect(() => {
    const savedKey = localStorage.getItem('anthropic_api_key');
    if (savedKey) {
      setApiKey(savedKey);
      setApiKeySet(true);
    }
  }, []);

  // Save API key to localStorage
  const handleApiKeySubmit = (e) => {
    e.preventDefault();
    if (apiKey.trim()) {
      localStorage.setItem('anthropic_api_key', apiKey.trim());
      setApiKeySet(true);
      setError(null);
    } else {
      setError('Please enter a valid API key');
    }
  };

  // Clear API key
  const handleClearApiKey = () => {
    localStorage.removeItem('anthropic_api_key');
    setApiKey('');
    setApiKeySet(false);
    setResult(null);
  };

  // Validate file types and sizes
  const validateFile = (file) => {
    const allowedExtensions = ['.csv', '.xls', '.xlsx'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    const fileName = file.name.toLowerCase();
    const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));

    if (!hasValidExtension) {
      throw new Error(`Invalid file type: ${file.name}. Only CSV and Excel files are allowed.`);
    }

    if (file.size > maxSize) {
      throw new Error(`File too large: ${file.name}. Maximum size is 10MB.`);
    }

    return true;
  };

  // Sanitize user input
  const sanitizeInput = (input) => {
    return input
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim();
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files?.length > 0) {
      try {
        const newFiles = Array.from(e.dataTransfer.files);
        newFiles.forEach(validateFile);
        setFiles([...files, ...newFiles]);
        setError(null);
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files?.length > 0) {
      try {
        const newFiles = Array.from(e.target.files);
        newFiles.forEach(validateFile);
        setFiles([...files, ...newFiles]);
        setError(null);
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleGenerate = async () => {
    if (!apiKeySet) {
      setError('Please enter your Anthropic API key first');
      return;
    }

    if (!requirement.trim()) {
      setError('Please enter a description of what you want to do');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Sanitize input
      const cleanedRequirement = sanitizeInput(requirement);

      // Create Anthropic client
      const anthropic = new Anthropic({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true // Required for browser usage
      });

      // Build prompt
      const alteryxKnowledge = getAlteryxKnowledge();
      const fileNames = files.map(f => f.name).join(', ') || 'None';

      const prompt = `${alteryxKnowledge}

## USER REQUEST

Files uploaded: ${fileNames}
User requirement: ${cleanedRequirement}

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

Mermaid Diagram MUST:
- Show complete data flow
- Use appropriate icons (📂, 🔍, 🔗, etc.)
- Include operation details
- Use "graph TB" format

## OUTPUT FORMAT

Respond with ONLY valid JSON in this exact structure:

{
  "script": "complete Python script here",
  "diagram": "complete Mermaid diagram here",
  "explanation": "brief step-by-step explanation",
  "input_files": ["list", "of", "files"],
  "output_files": ["list", "of", "files"]
}

CRITICAL:
- DO NOT include any text outside the JSON structure
- DO NOT use markdown code blocks in JSON values
- Ensure all JSON is valid and properly escaped`;

      // Call Anthropic API
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-5',
        max_tokens: 4000,
        temperature: 0.3,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      // Parse response
      const responseText = response.content[0].text;
      let cleanText = responseText.trim();

      // Remove markdown code blocks if present
      if (cleanText.includes('```json')) {
        cleanText = cleanText.split('```json')[1].split('```')[0].trim();
      } else if (cleanText.includes('```')) {
        cleanText = cleanText.split('```')[1].split('```')[0].trim();
      }

      const parsed = JSON.parse(cleanText);

      // Validate response structure
      const requiredKeys = ['script', 'diagram', 'explanation', 'input_files', 'output_files'];
      for (const key of requiredKeys) {
        if (!(key in parsed)) {
          throw new Error(`Missing required key: ${key}`);
        }
      }

      setResult(parsed);

      // Render Mermaid diagram
      setTimeout(async () => {
        const diagramElement = document.getElementById('mermaid-diagram');
        if (diagramElement && parsed.diagram) {
          try {
            diagramElement.innerHTML = parsed.diagram;
            await mermaid.run({
              nodes: [diagramElement]
            });
          } catch (err) {
            console.error('Mermaid rendering error:', err);
          }
        }
      }, 100);

    } catch (err) {
      console.error('Generation error:', err);
      if (err.status === 401) {
        setError('Invalid API key. Please check your Anthropic API key.');
        handleClearApiKey();
      } else if (err.message?.includes('JSON')) {
        setError('Failed to parse AI response. Please try again.');
      } else {
        setError(err.message || 'Failed to generate script. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const downloadScript = () => {
    if (!result?.script) return;

    const blob = new Blob([result.script], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'alteryx_to_python.py';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // API Key Setup Screen
  if (!apiKeySet) {
    return (
      <div className="app">
        <header className="header">
          <h1>⚡ Alter-thon</h1>
          <p className="subtitle">Convert Alteryx workflows to Python code</p>
        </header>

        <div className="api-key-setup">
          <div className="api-key-card">
            <h2>🔑 API Key Required</h2>
            <p className="api-key-info">
              Alter-thon uses your Anthropic API key to generate Python scripts.
              Your key is stored securely in your browser and never sent to any server except Anthropic.
            </p>

            <form onSubmit={handleApiKeySubmit} className="api-key-form">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-ant-api03-..."
                className="api-key-input"
                autoComplete="off"
              />
              <button type="submit" className="button button-primary">
                Save API Key
              </button>
            </form>

            {error && (
              <div className="error-message">
                <p>{error}</p>
              </div>
            )}

            <div className="api-key-help">
              <h3>How to get your API key:</h3>
              <ol>
                <li>Visit <a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer">console.anthropic.com</a></li>
                <li>Sign in or create an account</li>
                <li>Go to "API Keys" section</li>
                <li>Create a new API key</li>
                <li>Copy and paste it above</li>
              </ol>
              <p className="api-key-note">
                💡 Your API key is stored locally in your browser and is never shared with us.
              </p>
            </div>
          </div>
        </div>

        <footer className="footer">
          <p>Powered by Claude AI • Client-side only • No backend required</p>
        </footer>
      </div>
    );
  }

  // Main App Screen
  return (
    <div className="app">
      <header className="header">
        <h1>⚡ Alter-thon</h1>
        <p className="subtitle">Convert Alteryx workflows to Python code</p>
        <button onClick={handleClearApiKey} className="button button-secondary button-small">
          Change API Key
        </button>
      </header>

      <div className="container">
        <div className="upload-section">
          <h2>📂 Upload Data Files</h2>
          <div
            className={`dropzone ${dragActive ? 'drag-active' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              id="file-input"
              multiple
              accept=".csv,.xlsx,.xls"
              onChange={handleFileInput}
              style={{ display: 'none' }}
            />
            <label htmlFor="file-input" className="dropzone-label">
              <p className="dropzone-icon">📁</p>
              <p className="dropzone-text">
                Drag & drop files here or <span className="dropzone-link">browse</span>
              </p>
              <p className="dropzone-hint">Supports CSV and Excel files (max 10MB)</p>
            </label>
          </div>

          {files.length > 0 && (
            <div className="file-list">
              <h3>Uploaded Files:</h3>
              {files.map((file, index) => (
                <div key={index} className="file-item">
                  <span className="file-name">{file.name}</span>
                  <span className="file-size">
                    {(file.size / 1024).toFixed(1)} KB
                  </span>
                  <button
                    onClick={() => removeFile(index)}
                    className="button button-danger button-small"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="requirement-section">
          <h2>✍️ Describe Your Workflow</h2>
          <textarea
            value={requirement}
            onChange={(e) => setRequirement(e.target.value)}
            placeholder="Example: Filter sales > $1000, join with customers on customer_id, calculate total by region, and export to Excel"
            className="requirement-input"
            rows="5"
            maxLength="5000"
          />
          <p className="char-count">{requirement.length} / 5000 characters</p>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="button button-primary button-large"
          >
            {loading ? '⏳ Generating...' : '🚀 Generate Python Script'}
          </button>
        </div>

        {error && (
          <div className="error-message">
            <h3>❌ Error</h3>
            <p>{error}</p>
          </div>
        )}

        {result && (
          <div className="results">
            <div className="result-section">
              <h2>📊 Workflow Diagram</h2>
              <div id="mermaid-diagram" className="diagram-container"></div>
            </div>

            <div className="result-section">
              <h2>📝 Explanation</h2>
              <p className="explanation">{result.explanation}</p>
            </div>

            <div className="result-section">
              <h2>🐍 Python Script</h2>
              <div className="script-header">
                <div className="file-info">
                  <p><strong>Input files:</strong> {result.input_files?.join(', ') || 'None'}</p>
                  <p><strong>Output files:</strong> {result.output_files?.join(', ') || 'None'}</p>
                </div>
                <button onClick={downloadScript} className="button button-primary">
                  ⬇️ Download Script
                </button>
              </div>
              <pre className="script-container">
                <code>{result.script}</code>
              </pre>
            </div>
          </div>
        )}
      </div>

      <footer className="footer">
        <p>Powered by Claude AI • Your API key is stored locally • No backend required</p>
      </footer>
    </div>
  );
}

export default App;

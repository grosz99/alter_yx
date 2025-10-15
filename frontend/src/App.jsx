import { useState } from 'react';
import mermaid from 'mermaid';
import './App.css';

mermaid.initialize({ startOnLoad: false, theme: 'default', securityLevel: 'loose' });

// Alteryx knowledge base embedded in frontend
const ALTERYX_KNOWLEDGE = `# ALTERYX TO PYTHON CONVERSION GUIDE

You are an expert at converting Alteryx workflows to Python pandas code.

## CORE PRINCIPLES
1. Use pandas as primary library
2. Write clean, well-commented code
3. Include error handling
4. Make file paths configurable
5. Add progress print statements
6. **ALWAYS normalize column names after loading: df.columns = df.columns.str.lower().str.strip()**

## COMMON TOOL MAPPINGS

### Input/Output
- Input Data → pd.read_csv() or pd.read_excel()
- Output Data → df.to_csv() or df.to_excel()

### Preparation
- Filter → df[condition]
- Select → df[['col1', 'col2']]
- Sort → df.sort_values()
- Sample → df.head() or df.sample()
- Unique → df.drop_duplicates()

### Join/Union
- Join → pd.merge(df1, df2, on='key')
- Union → pd.concat([df1, df2])

### Transform
- Formula → df['new'] = calculation
- Summarize → df.groupby().agg()
- Cross Tab → pd.pivot_table()

### Data Cleansing
- Data Cleansing → str.strip(), str.upper(), fillna()
- Imputation → fillna(method='ffill') or fillna(mean())

## CODE STRUCTURE

Always include:
1. Imports (pandas, numpy, pathlib)
2. Configuration (file paths as variables)
3. **Column normalization: df.columns = df.columns.str.lower().str.strip()**
4. Error handling (try/except)
5. Progress messages (print statements)
6. Create output directories (Path().mkdir())

## MERMAID DIAGRAM

Generate workflow visualization using:
graph TB
    A[📂 Load: file.csv] --> B[🔍 Filter]
    B --> C[💾 Save: output.xlsx]
`;

function App() {
  const [files, setFiles] = useState([]);
  const [requirement, setRequirement] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  // Validate file types and sizes
  const validateFile = (file) => {
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
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
    // Validate API key
    if (!apiKey || !apiKey.trim()) {
      setError('Please enter your Anthropic API key');
      return;
    }

    if (!apiKey.startsWith('sk-ant-')) {
      setError('Invalid API key format. Should start with sk-ant-');
      return;
    }

    const cleanedRequirement = sanitizeInput(requirement);

    if (!cleanedRequirement.trim()) {
      setError('Please describe what you want to do');
      return;
    }

    if (cleanedRequirement.length > 5000) {
      setError('Description is too long (maximum 5000 characters)');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Get file information
      const fileInfo = files.map(f => ({
        name: f.name,
        size: f.size,
        type: f.type
      }));

      // Build prompt for Claude
      const prompt = `${ALTERYX_KNOWLEDGE}

## USER REQUEST

Files uploaded: ${fileInfo.length > 0 ? fileInfo.map(f => f.name).join(', ') : 'None'}

User requirement: ${cleanedRequirement}

## YOUR TASK

Generate a complete Python script that:
1. Loads the data files mentioned
2. Implements the requested workflow
3. **CRITICAL**: Includes df.columns = df.columns.str.lower().str.strip() after EVERY read_csv/read_excel
4. Saves the output appropriately

Also provide:
- A clear explanation of what the script does
- A Mermaid diagram showing the workflow
- List of input files needed
- List of output files that will be created

Respond ONLY with valid JSON in this exact format:
{
  "script": "complete Python code here",
  "explanation": "what this script does",
  "diagram": "mermaid diagram code",
  "input_files": ["file1.csv", "file2.xlsx"],
  "output_files": ["output.xlsx"]
}`;

      // Call serverless proxy (avoids CORS issues)
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          apiKey: apiKey,
          prompt: prompt
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.content[0].text;

      // Parse JSON response
      let parsedResult;
      try {
        // Extract JSON from response (in case Claude adds explanation text)
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedResult = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in response');
        }
      } catch (parseError) {
        throw new Error('Failed to parse Claude response as JSON');
      }

      // Validate response structure
      const requiredFields = ['script', 'diagram', 'explanation', 'input_files', 'output_files'];
      for (const field of requiredFields) {
        if (!(field in parsedResult)) {
          throw new Error(`Missing required field: ${field}`);
        }
      }

      setResult(parsedResult);

      // Render Mermaid diagram
      setTimeout(() => {
        const diagramElement = document.getElementById('mermaid-diagram');
        if (diagramElement && parsedResult.diagram) {
          try {
            diagramElement.innerHTML = parsedResult.diagram;
            mermaid.run({ nodes: [diagramElement] });
          } catch (err) {
            console.error('Mermaid rendering error:', err);
            diagramElement.innerHTML = '<p>Diagram rendering failed</p>';
          }
        }
      }, 100);

      // Smooth scroll to results
      setTimeout(() => {
        document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' });
      }, 200);

    } catch (err) {
      console.error('Generation error:', err);

      if (err.message.includes('401')) {
        setError('Invalid API key. Please check your Anthropic API key.');
      } else if (err.message.includes('429')) {
        setError('Rate limit exceeded. Please wait a moment and try again.');
      } else if (err.message.includes('400')) {
        setError('Invalid request. Please check your input.');
      } else if (err.message.includes('500') || err.message.includes('503')) {
        setError('Anthropic API error. Please try again later.');
      } else {
        setError(err.message || 'Failed to generate script. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('Copied to clipboard!');
    } catch (err) {
      console.error('Copy failed:', err);
      alert('Copy failed. Please try selecting and copying manually.');
    }
  };

  const downloadScript = () => {
    try {
      if (!result?.script) {
        throw new Error('No script to download');
      }

      const blob = new Blob([result.script], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'alteryx_to_python.py';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
      alert('Download failed. Please try copying the script instead.');
    }
  };

  return (
    <div className="app">
      <div className="container">
        <header className="header">
          <h1>⚡ Alter-YX</h1>
          <p>Transform Alteryx workflows into Python code with AI</p>
        </header>

        <div className="card">
          <h2>🔑 Your Anthropic API Key</h2>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-ant-api03-..."
            style={{ width: '100%', padding: '12px', fontSize: '14px', marginBottom: '10px', borderRadius: '6px', border: '1px solid #ddd' }}
          />
          <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
            🔒 Your API key is sent directly to Anthropic and never stored.{' '}
            <a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer">
              Get your API key here
            </a>
          </p>
        </div>

        <div className="card">
          <h2>📁 Upload Your Data Files (Optional)</h2>
          <div
            className={`upload-area ${dragActive ? 'dragover' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => document.getElementById('fileInput').click()}
          >
            <p className="upload-text">📂 Drop files here or click to browse</p>
            <p className="upload-hint">Supports CSV, Excel (.xlsx, .xls) - Max 10MB per file</p>
            <input
              id="fileInput"
              type="file"
              multiple
              accept=".csv,.xlsx,.xls"
              onChange={handleFileInput}
              style={{ display: 'none' }}
            />
          </div>

          {files.length > 0 && (
            <div className="file-list">
              {files.map((file, index) => (
                <div key={index} className="file-item">
                  <span>📄 {file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
                  <button onClick={() => removeFile(index)} aria-label={`Remove ${file.name}`}>
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h2>💬 Describe Your Alteryx Workflow</h2>
          <textarea
            value={requirement}
            onChange={(e) => setRequirement(e.target.value)}
            placeholder="Example: Load sales.csv, filter for amounts over $1000, join with customers.csv on customer_id, calculate total revenue by region, and save to Excel..."
            rows="5"
            maxLength="5000"
          />
          <div className="char-count">
            {requirement.length}/5000 characters
          </div>

          <div className="examples">
            <p className="examples-label">💡 Try these examples:</p>
            <div className="example-buttons">
              {[
                "Filter sales > $1000, join with customers on ID, group by region",
                "Remove duplicates, fill missing values, export to Excel",
                "Combine all CSVs, sort by date, calculate monthly totals"
              ].map((example, i) => (
                <button
                  key={i}
                  className="example-btn"
                  onClick={() => setRequirement(example)}
                  type="button"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>

          <button
            className="generate-btn"
            onClick={handleGenerate}
            disabled={loading || !requirement.trim() || !apiKey.trim()}
            type="button"
          >
            {loading ? '⏳ Generating...' : '🚀 Generate Python Script'}
          </button>
        </div>

        {error && (
          <div className="card error-card">
            <p>❌ {error}</p>
          </div>
        )}

        {loading && (
          <div className="card loading-card">
            <div className="spinner"></div>
            <p>Generating your Python script with Claude AI...</p>
            <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>This may take 10-30 seconds</p>
          </div>
        )}

        {result && (
          <div id="results" className="results">
            <div className="card success-banner">
              <p>✅ Script generated successfully!</p>
            </div>

            <div className="card">
              <h2>📝 What this script does</h2>
              <p className="explanation">{result.explanation}</p>
            </div>

            <div className="card">
              <h2>📊 Workflow Visualization</h2>
              <div id="mermaid-diagram" className="mermaid-container"></div>
            </div>

            <div className="card">
              <div className="script-header">
                <h2>🐍 Your Python Script</h2>
                <div className="button-group">
                  <button
                    className="btn-secondary"
                    onClick={() => copyToClipboard(result.script)}
                    type="button"
                  >
                    📋 Copy Code
                  </button>
                  <button
                    className="btn-primary"
                    onClick={downloadScript}
                    type="button"
                  >
                    ⬇️ Download .py
                  </button>
                </div>
              </div>
              <pre className="code-block">{result.script}</pre>
            </div>

            <div className="files-grid">
              <div className="card">
                <h3>📥 Input Files Needed</h3>
                <ul>
                  {result.input_files.map((file, i) => (
                    <li key={i}>{file}</li>
                  ))}
                </ul>
              </div>
              <div className="card">
                <h3>📤 Output Files Created</h3>
                <ul>
                  {result.output_files.map((file, i) => (
                    <li key={i}>{file}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="card" style={{ backgroundColor: '#f0f9ff', border: '2px solid #0ea5e9' }}>
              <h3>📝 Next Steps</h3>
              <ol style={{ marginLeft: '20px', lineHeight: '1.8' }}>
                <li>Download the Python script above</li>
                <li>Ensure you have the input files in the same directory</li>
                <li>Install required packages: <code style={{ background: '#e0e7ff', padding: '2px 6px', borderRadius: '3px' }}>pip install pandas numpy openpyxl</code></li>
                <li>Run the script: <code style={{ background: '#e0e7ff', padding: '2px 6px', borderRadius: '3px' }}>python alteryx_to_python.py</code></li>
              </ol>
            </div>
          </div>
        )}

        <footer className="footer">
          <p>Built with ❤️ using Claude AI • Powered by Anthropic API</p>
          <p style={{ fontSize: '11px', color: '#999', marginTop: '5px' }}>
            Client-side application - your data and API key never touch our servers
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;

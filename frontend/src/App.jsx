import { useState } from 'react';
import axios from 'axios';
import mermaid from 'mermaid';
import './App.css';

mermaid.initialize({ startOnLoad: false, theme: 'default', securityLevel: 'loose' });

function App() {
  const [files, setFiles] = useState([]);
  const [requirement, setRequirement] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  // Security: Validate file types and sizes
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

  // Security: Sanitize user input
  const sanitizeInput = (input) => {
    // Remove potential script tags and dangerous content
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
        
        // Security: Validate each file
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
        
        // Security: Validate each file
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
    // Security: Validate input length
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
      const formData = new FormData();
      formData.append('requirement', cleanedRequirement);
      
      // Security: Only append validated files
      files.forEach(file => {
        try {
          validateFile(file);
          formData.append('files', file);
        } catch (err) {
          throw new Error(`File validation failed: ${err.message}`);
        }
      });

      const response = await axios.post(`${API_URL}/api/generate`, formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          // Security: Add request headers
          'X-Requested-With': 'XMLHttpRequest'
        },
        timeout: 30000, // 30 second timeout
      });

      // Security: Validate response structure
      if (!response.data || typeof response.data !== 'object') {
        throw new Error('Invalid response format');
      }

      const requiredFields = ['script', 'diagram', 'explanation', 'input_files', 'output_files'];
      for (const field of requiredFields) {
        if (!(field in response.data)) {
          throw new Error(`Missing required field: ${field}`);
        }
      }

      setResult(response.data);
      
      // Render Mermaid diagram safely
      setTimeout(() => {
        const diagramElement = document.getElementById('mermaid-diagram');
        if (diagramElement && response.data.diagram) {
          try {
            diagramElement.innerHTML = response.data.diagram;
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
      
      if (err.code === 'ECONNABORTED') {
        setError('Request timed out. Please try again.');
      } else if (err.response?.status === 429) {
        setError('Too many requests. Please wait a moment and try again.');
      } else if (err.response?.status === 400) {
        setError(err.response.data?.detail || 'Invalid request. Please check your input.');
      } else if (err.response?.status >= 500) {
        setError('Server error. Please try again later.');
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
      a.download = 'alterwise_script.py';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
      alert('Download failed. Please try copying the script instead.');
    }
  };

  const executeScript = async () => {
    if (!result?.script) {
      setError('No script to execute');
      return;
    }

    setExecuting(true);
    setExecutionResult(null);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('script', result.script);
      
      // Add the same files that were used for generation
      files.forEach((file) => {
        formData.append('files', file);
      });

      const response = await axios.post(`${API_URL}/api/execute`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 35000, // 35 second timeout
      });

      setExecutionResult(response.data);
      
      // Scroll to execution results
      setTimeout(() => {
        document.getElementById('execution-results')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);

    } catch (err) {
      console.error('Execution error:', err);
      
      if (err.code === 'ECONNABORTED') {
        setError('Execution timed out (max 30 seconds)');
      } else if (err.response?.status === 408) {
        setError('Script execution timed out');
      } else if (err.response?.status === 400) {
        setError(err.response.data?.detail || 'Script validation failed');
      } else {
        setError(err.response?.data?.detail || 'Failed to execute script');
      }
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="app">
      <div className="container">
        <header className="header">
          <h1>⚡ Alter-thon</h1>
          <p>Transform Alteryx workflows into Python code</p>
        </header>

        <div className="card">
          <h2>📁 Upload Your Data Files</h2>
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
          <h2>💬 What do you want to do?</h2>
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
            disabled={loading || !requirement.trim()}
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
            <p>Generating your Python script...</p>
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
                    className="btn-secondary" 
                    onClick={downloadScript}
                    type="button"
                  >
                    ⬇️ Download .py
                  </button>
                  <button 
                    className="btn-primary" 
                    onClick={executeScript}
                    disabled={executing || !files.length}
                    type="button"
                  >
                    {executing ? '⏳ Executing...' : '▶️ Execute Code'}
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
          </div>
        )}

        {executionResult && (
          <div id="execution-results" className="results">
            <div className={`card ${executionResult.success ? 'success-banner' : 'error-card'}`}>
              <p>{executionResult.success ? '✅ Code executed successfully!' : `❌ Code execution failed (Return Code: ${executionResult.return_code})`}</p>
            </div>

            <div className="card">
              <h2>📊 Execution Results</h2>
              
              {executionResult.stdout && (
                <div className="execution-section">
                  <h3>📋 Output</h3>
                  <pre className="execution-output">{executionResult.stdout}</pre>
                </div>
              )}
              
              {executionResult.stderr && (
                <div className="execution-section">
                  <h3>⚠️ Warnings/Errors</h3>
                  <pre className="execution-error">{executionResult.stderr}</pre>
                </div>
              )}
              
              {executionResult.output_files && executionResult.output_files.length > 0 && (
                <div className="execution-section">
                  <h3>📤 Generated Files</h3>
                  <ul className="output-files">
                    {executionResult.output_files.map((file, i) => (
                      <li key={i}>
                        {file.name} ({(file.size / 1024).toFixed(1)} KB)
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div className="execution-status">
                Return Code: {executionResult.return_code} {executionResult.return_code === 0 ? '✅' : '❌'}
              </div>
            </div>
          </div>
        )}

        {executing && (
          <div className="card loading-card">
            <div className="spinner"></div>
            <p>Executing your Python script...</p>
          </div>
        )}

        <footer className="footer">
          <p>Built with ❤️ using Claude • Powered by Anthropic API</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
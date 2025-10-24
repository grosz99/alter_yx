import { useState } from 'react';
import './App.css';

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
`;

function App() {
  const [files, setFiles] = useState([]);
  const [fileMetadata, setFileMetadata] = useState([]);
  const [requirement, setRequirement] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [provider, setProvider] = useState('anthropic'); // 'anthropic' or 'openai'
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  // Rate limiting state
  const [requestHistory, setRequestHistory] = useState([]);
  const RATE_LIMIT = 10; // requests
  const RATE_WINDOW = 60000; // 1 minute in milliseconds

  // Validate file types and sizes
  const validateFile = (file) => {
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    const allowedExtensions = ['.csv', '.xls', '.xlsx'];
    const maxSize = 100 * 1024 * 1024; // 100MB

    const fileName = file.name.toLowerCase();
    const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));

    if (!hasValidExtension) {
      throw new Error(`Invalid file type: ${file.name}. Only CSV and Excel files are allowed.`);
    }

    if (file.size > maxSize) {
      throw new Error(`File too large: ${file.name}. Maximum size is 100MB.`);
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

  // Detect prompt injection attempts (enhanced)
  const detectPromptInjection = (input) => {
    // Normalize input to catch Unicode and HTML entity bypasses
    const normalized = input
      .normalize('NFKD') // Normalize Unicode
      .replace(/&nbsp;/gi, ' ') // HTML entities
      .replace(/[\u200B-\u200D\uFEFF]/g, '') // Zero-width characters
      .toLowerCase();

    const dangerousPatterns = [
      /ign[o0]re\s*(all\s*)?(previous|prior|above)\s*(instructions?|prompts?|rules?)/i,
      /(you\s*(are|'re)\s*now|act\s*as|pretend\s*(to\s*be|you\s*are))/i,
      /system\s*(override|prompt|mode|instruction)/i,
      /forget\s*(everything|all|previous|prior)/i,
      /(new|different|updated)\s*instructions?/i,
      /disregard\s*.*(above|prior|previous)/i,
      /instead,?\s*(output|generate|create|write)/i,
      /(override|bypass|disable)\s*(safety|security|filter)/i,
      /reveal\s*(your\s*)?(prompt|instructions|system)/i
    ];

    // Also check for dangerous imports in the input
    const dangerousCode = [
      /import\s+(os|subprocess|sys|eval|exec)/i,
      /__import__/i,
      /exec\s*\(/i,
      /eval\s*\(/i
    ];

    return dangerousPatterns.some(pattern => pattern.test(normalized)) ||
           dangerousCode.some(pattern => pattern.test(input));
  };

  // Extract metadata from uploaded files (columns, row count, sample data)
  const extractFileMetadata = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const text = e.target.result;
          const lines = text.split('\n').filter(line => line.trim());

          if (lines.length === 0) {
            resolve({
              name: file.name,
              size: file.size,
              type: file.type,
              columns: [],
              rowCount: 0,
              sample: []
            });
            return;
          }

          // For CSV files, parse headers and get row count
          if (file.name.toLowerCase().endsWith('.csv')) {
            const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
            const rowCount = lines.length - 1; // Subtract header row
            const sampleRows = lines.slice(1, Math.min(4, lines.length)).map(line => {
              const values = line.split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
              return values;
            });

            resolve({
              name: file.name,
              size: file.size,
              type: file.type,
              columns: headers,
              rowCount: rowCount,
              sample: sampleRows
            });
          } else {
            // For Excel files, we can't parse easily in browser without a library
            // So just return basic info
            resolve({
              name: file.name,
              size: file.size,
              type: file.type,
              columns: ['(Excel file - columns will be detected when processing)'],
              rowCount: '(unknown)',
              sample: []
            });
          }
        } catch (error) {
          console.error('Error extracting metadata:', error);
          resolve({
            name: file.name,
            size: file.size,
            type: file.type,
            columns: ['(error reading file)'],
            rowCount: 0,
            sample: []
          });
        }
      };

      reader.onerror = () => {
        reject(new Error(`Failed to read file: ${file.name}`));
      };

      // Only read first 50KB for metadata extraction to avoid memory issues with large files
      const blob = file.slice(0, 50 * 1024);
      reader.readAsText(blob);
    });
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files?.length > 0) {
      try {
        const newFiles = Array.from(e.dataTransfer.files);
        newFiles.forEach(validateFile);

        // Extract metadata from all new files
        const metadataPromises = newFiles.map(file => extractFileMetadata(file));
        const newMetadata = await Promise.all(metadataPromises);

        setFiles([...files, ...newFiles]);
        setFileMetadata([...fileMetadata, ...newMetadata]);
        setError(null);
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handleFileInput = async (e) => {
    if (e.target.files?.length > 0) {
      try {
        const newFiles = Array.from(e.target.files);
        newFiles.forEach(validateFile);

        // Extract metadata from all new files
        const metadataPromises = newFiles.map(file => extractFileMetadata(file));
        const newMetadata = await Promise.all(metadataPromises);

        setFiles([...files, ...newFiles]);
        setFileMetadata([...fileMetadata, ...newMetadata]);
        setError(null);
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
    setFileMetadata(fileMetadata.filter((_, i) => i !== index));
  };

  const handleGenerate = async () => {
    // Rate limiting check
    const now = Date.now();
    const recentRequests = requestHistory.filter(timestamp => now - timestamp < RATE_WINDOW);

    if (recentRequests.length >= RATE_LIMIT) {
      const oldestRequest = Math.min(...recentRequests);
      const waitTime = Math.ceil((RATE_WINDOW - (now - oldestRequest)) / 1000);
      setError(`Rate limit exceeded. Please wait ${waitTime} seconds before trying again.`);
      return;
    }

    // Validate API key
    if (!apiKey || !apiKey.trim()) {
      setError('Please enter your API key');
      return;
    }

    // Validate API key format based on provider
    if (provider === 'anthropic' && !apiKey.startsWith('sk-ant-')) {
      setError('Invalid Anthropic API key format. Should start with sk-ant-');
      return;
    }

    if (provider === 'openai' && !apiKey.startsWith('sk-')) {
      setError('Invalid OpenAI API key format. Should start with sk-');
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

    // Check for prompt injection
    if (detectPromptInjection(cleanedRequirement)) {
      setError('Invalid input detected. Please describe your data workflow only.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    // Track this request for rate limiting
    setRequestHistory([...recentRequests, now]);

    try {
      // Build detailed file information with metadata
      let fileInfoText = 'None';
      if (fileMetadata.length > 0) {
        fileInfoText = fileMetadata.map((meta, idx) => {
          const columnsStr = Array.isArray(meta.columns) ? meta.columns.join(', ') : meta.columns;
          const rowCountStr = typeof meta.rowCount === 'number' ? meta.rowCount.toLocaleString() : meta.rowCount;
          return `
File ${idx + 1}: ${meta.name}
  - Size: ${(meta.size / 1024 / 1024).toFixed(2)} MB
  - Columns: ${columnsStr}
  - Approximate Rows: ${rowCountStr}`;
        }).join('\n');
      }

      // Build prompt for Claude
      const prompt = `${ALTERYX_KNOWLEDGE}

## USER REQUEST

Files uploaded:
${fileInfoText}

User requirement: ${cleanedRequirement}

## YOUR TASK

Generate a complete Python script that:
1. Loads the data files mentioned
2. Implements the requested workflow
3. **CRITICAL**: Includes df.columns = df.columns.str.lower().str.strip() after EVERY read_csv/read_excel
4. Saves the output appropriately

Also provide:
- A step-by-step explanation with code snippets
- List of input files needed
- List of output files that will be created

CRITICAL: You must respond with ONLY valid JSON. No explanatory text before or after. No markdown code blocks. Just pure JSON.

Use this exact format:
{
  "script": "complete Python code here",
  "steps": [
    {"description": "Load Superstore CSV", "code": "df = pd.read_csv('Superstore.csv')"},
    {"description": "Filter for South Region", "code": "df = df[df['region'] == 'South']"},
    {"description": "Group by subcategory and sum sales", "code": "df.groupby('subcategory')['sales'].sum()"},
    {"description": "Save results to CSV", "code": "df.to_csv('results.csv', index=False)"}
  ],
  "input_files": ["file1.csv", "file2.xlsx"],
  "output_files": ["output.xlsx"]
}

Start your response with { and end with }. Nothing else.`;

      // Call AI API directly from browser (no proxy, no logging)
      let response, data, content;

      if (provider === 'anthropic') {
        // Direct call to Anthropic API
        response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json'
          },
          body: JSON.stringify({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 8192,
            messages: [{
              role: 'user',
              content: prompt
            }]
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || `Anthropic API error: ${response.status}`);
        }

        data = await response.json();
        content = data.content[0].text;

      } else if (provider === 'openai') {
        // Direct call to OpenAI API
        response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'gpt-4-turbo-preview',
            messages: [{
              role: 'user',
              content: prompt
            }],
            max_tokens: 8192,
            temperature: 0.7
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || `OpenAI API error: ${response.status}`);
        }

        data = await response.json();
        content = data.choices[0].message.content;
      } else {
        throw new Error('Invalid provider');
      }

      // Parse JSON response
      let parsedResult;
      try {
        // Try to parse the entire content first
        try {
          parsedResult = JSON.parse(content);
        } catch (e) {
          // If that fails, try to extract JSON from response (in case Claude adds explanation text)
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            parsedResult = JSON.parse(jsonMatch[0]);
          } else {
            console.error('Raw response:', content);
            throw new Error('No JSON found in response. Check console for raw output.');
          }
        }
      } catch (parseError) {
        console.error('Parse error:', parseError);
        console.error('Content:', content);
        throw new Error(`Failed to parse Claude response: ${parseError.message}`);
      }

      // Validate response structure
      const requiredFields = ['script', 'steps', 'input_files', 'output_files'];
      for (const field of requiredFields) {
        if (!(field in parsedResult)) {
          throw new Error(`Missing required field: ${field}`);
        }
      }

      // Validate generated code for dangerous imports
      if (parsedResult.script) {
        const dangerousImports = ['os', 'subprocess', 'sys', 'eval', 'exec', '__import__', 'pickle', 'shelve'];
        const hasDangerous = dangerousImports.some(mod =>
          new RegExp(`import\\s+${mod}|from\\s+${mod}`, 'i').test(parsedResult.script)
        );

        if (hasDangerous) {
          throw new Error('AI generated code with unauthorized imports. This may be a prompt injection attempt. Please try describing your workflow differently.');
        }
      }

      setResult(parsedResult);

      // Smooth scroll to results
      setTimeout(() => {
        document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' });
      }, 200);

    } catch (err) {
      console.error('Generation error:', err);

      if (err.message.includes('401')) {
        setError('Invalid API key. Please check your API key.');
      } else if (err.message.includes('429')) {
        setError('Rate limit exceeded. Please wait a moment and try again.');
      } else if (err.message.includes('400')) {
        setError('Invalid request. Please check your input.');
      } else if (err.message.includes('500') || err.message.includes('503')) {
        setError('API error. Please try again later.');
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
      a.download = 'pycture_script.py';
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
          <h1>📊 Pycture</h1>
          <p>Transform Alteryx workflows into Python code with AI</p>
        </header>

        <div className="card">
          <h2>🔑 API Configuration</h2>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ fontSize: '14px', color: '#333', fontWeight: '500', marginBottom: '8px', display: 'block' }}>
              Select AI Provider
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setProvider('anthropic')}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: provider === 'anthropic' ? '#2e7d32' : '#f5f5f5',
                  color: provider === 'anthropic' ? 'white' : '#333',
                  border: provider === 'anthropic' ? '2px solid #2e7d32' : '2px solid #e0e0e0',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '14px',
                  transition: 'all 0.2s'
                }}
              >
                Anthropic Claude
              </button>
              <button
                onClick={() => setProvider('openai')}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: provider === 'openai' ? '#2e7d32' : '#f5f5f5',
                  color: provider === 'openai' ? 'white' : '#333',
                  border: provider === 'openai' ? '2px solid #2e7d32' : '2px solid #e0e0e0',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '14px',
                  transition: 'all 0.2s'
                }}
              >
                OpenAI GPT-4
              </button>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '14px', color: '#333', fontWeight: '500', marginBottom: '8px', display: 'block' }}>
              API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={provider === 'anthropic' ? 'sk-ant-api03-...' : 'sk-...'}
              style={{ width: '100%', padding: '12px', fontSize: '14px', marginBottom: '10px', borderRadius: '6px', border: '1px solid #ddd' }}
            />
            <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
              🔒 Your API key is sent directly from your browser to {provider === 'anthropic' ? 'Anthropic' : 'OpenAI'}. We never see or log your API key.{' '}
              <a
                href={provider === 'anthropic' ? 'https://console.anthropic.com/' : 'https://platform.openai.com/api-keys'}
                target="_blank"
                rel="noopener noreferrer"
              >
                Get your API key here
              </a>
            </p>
          </div>
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
            <p className="upload-hint">Supports CSV, Excel (.xlsx, .xls) - Max 100MB per file</p>
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
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                      📄 {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </div>
                    {fileMetadata[index] && (
                      <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                        <div>Columns: {Array.isArray(fileMetadata[index].columns) ? fileMetadata[index].columns.join(', ') : fileMetadata[index].columns}</div>
                        <div>Rows: {typeof fileMetadata[index].rowCount === 'number' ? fileMetadata[index].rowCount.toLocaleString() : fileMetadata[index].rowCount}</div>
                      </div>
                    )}
                  </div>
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
            <p>Generating your Python script with {provider === 'anthropic' ? 'Claude AI' : 'GPT-4'}...</p>
            <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>This may take 10-30 seconds</p>
          </div>
        )}

        {result && (
          <div id="results" className="results">
            <div className="card success-banner">
              <p>✅ Script generated successfully!</p>
            </div>

            <div className="card">
              <h2>📋 Workflow Steps</h2>
              <div className="workflow-steps">
                {result.steps && result.steps.map((step, index) => (
                  <div key={index} className="workflow-step-item">
                    <div className="step-number">{index + 1}</div>
                    <div className="step-content">
                      <div className="step-description">{step.description}</div>
                      <code className="step-code">{step.code}</code>
                    </div>
                  </div>
                ))}
              </div>
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

            <div className="card" style={{ backgroundColor: '#f1f8f4', border: '2px solid #2e7d32' }}>
              <h3>📝 Next Steps</h3>
              <ol style={{ marginLeft: '20px', lineHeight: '1.8' }}>
                <li>Download the Python script above</li>
                <li>Ensure you have the input files in the same directory</li>
                <li>Install required packages: <code style={{ background: '#e8f5e9', padding: '2px 6px', borderRadius: '3px' }}>pip install pandas numpy openpyxl</code></li>
                <li>Run the script: <code style={{ background: '#e8f5e9', padding: '2px 6px', borderRadius: '3px' }}>python pycture_script.py</code></li>
              </ol>
            </div>
          </div>
        )}

        <footer className="footer">
          <p>Built with ❤️ using AI • Supports Anthropic Claude & OpenAI GPT-4</p>
          <p style={{ fontSize: '11px', color: '#999', marginTop: '5px' }}>
            Fully client-side application. Your API key and data never touch our servers. We do not store or log anything.
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;

# 📊 Pycture

Transform Alteryx workflows into Python pandas code using AI.

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/grosz99/alter_yx)

> ⚠️ **Beta Software**: Pycture is currently in beta. See [Privacy & Security](#privacy--security) for data handling details.

## 🚀 Live Demo

**[Add your Netlify URL here after deployment]**

## 📋 What It Does

Pycture uses AI (Anthropic Claude or OpenAI GPT-4) to convert Alteryx workflow descriptions into clean, well-documented Python scripts using pandas. Simply describe your Alteryx workflow, and get production-ready Python code instantly.

### Features

- 🤖 **Dual AI Support**: Choose between Anthropic Claude 3.5 Sonnet or OpenAI GPT-4
- 📁 **Smart File Analysis**: Upload CSV/Excel files (up to 100MB) for metadata extraction
- 📋 **Step-by-Step Workflow**: See each transformation with corresponding code
- 🐍 **Clean Python Code**: Well-commented, production-ready pandas scripts
- 🔒 **Bring Your Own Key**: Use your own API key (see privacy details below)
- ⬇️ **Easy Export**: Download scripts or copy to clipboard

## 🛠️ How to Use

1. **Get an Anthropic API Key**
   Sign up at [console.anthropic.com](https://console.anthropic.com/) and create an API key

2. **Visit the App**
   Go to the live deployment URL

3. **Enter Your API Key**
   Paste your Anthropic API key (starts with `sk-ant-`)

4. **Upload Files** (optional)
   Upload CSV/Excel files for context

5. **Describe Your Workflow**
   Example: "Load sales.csv, filter for amounts over $1000, join with customers.csv on customer_id, calculate total revenue by region, and save to Excel"

6. **Generate & Download**
   Click "Generate Python Script" and download your code!

## 📂 Project Structure

```
alter_yx/
├── frontend/               # React + Vite frontend
│   ├── src/
│   │   ├── App.jsx        # Main application component
│   │   ├── App.css        # Application styles
│   │   └── main.jsx       # React entry point
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── netlify/
│   └── functions/
│       └── generate.mjs   # Serverless API proxy for Anthropic
├── netlify.toml           # Netlify build configuration
├── .gitignore
└── README.md
```

## 🏗️ Local Development

### Prerequisites

- Node.js 18+
- npm or yarn
- Anthropic API key

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/grosz99/alter_yx.git
   cd alter_yx
   ```

2. **Install frontend dependencies**
   ```bash
   cd frontend
   npm install
   ```

3. **Run development server**
   ```bash
   npm run dev
   ```
   Open http://localhost:5173

4. **Build for production**
   ```bash
   npm run build
   ```

## 🌐 Deployment

This project is configured for **Netlify** deployment with automatic serverless functions.

### Deploy to Netlify

#### Option 1: One-Click Deploy
Click the "Deploy to Netlify" button at the top of this README!

#### Option 2: Manual Deploy

1. **Connect to GitHub**
   - Go to [app.netlify.com](https://app.netlify.com/)
   - Click "Add new site" → "Import an existing project"
   - Select your GitHub repository: `grosz99/alter_yx`

2. **Build Settings** (auto-detected from `netlify.toml`)
   - **Branch to deploy**: `main`
   - **Build command**: `cd frontend && npm install && npm run build`
   - **Publish directory**: `frontend/dist`
   - **Functions directory**: `netlify/functions`

3. **Deploy!**
   Click "Deploy site" and you're done!

### Auto-Deploy

Every push to the `main` branch automatically triggers a new deployment on Netlify.

## 🔧 Technical Stack

- **Frontend**: React 18, Vite 5
- **Styling**: Custom CSS
- **Visualization**: Mermaid.js
- **AI**: Anthropic Claude 3.5 Sonnet (8192 max tokens)
- **Serverless**: Netlify Functions
- **Deployment**: Netlify

## 📝 Common Alteryx Tool Mappings

| Alteryx Tool | Python Equivalent |
|--------------|-------------------|
| Input Data | `pd.read_csv()`, `pd.read_excel()` |
| Output Data | `df.to_csv()`, `df.to_excel()` |
| Filter | `df[condition]` |
| Select | `df[['col1', 'col2']]` |
| Join | `pd.merge(df1, df2, on='key')` |
| Union | `pd.concat([df1, df2])` |
| Formula | `df['new'] = calculation` |
| Summarize | `df.groupby().agg()` |
| Sort | `df.sort_values()` |
| Unique | `df.drop_duplicates()` |
| Cross Tab | `pd.pivot_table()` |
| Data Cleansing | `str.strip()`, `str.upper()`, `fillna()` |

## 🔒 Security Features

- **Client-side API key**: Your Anthropic API key is sent directly to Anthropic, never stored on our servers
- **Input validation**: File type and size restrictions (CSV/Excel, max 10MB)
- **Sanitized inputs**: All user inputs are sanitized to prevent XSS attacks
- **Serverless proxy**: CORS-safe proxy prevents direct browser-to-API calls
- **No backend storage**: No databases, no data persistence

## 🐛 Troubleshooting

### "Failed to parse Claude response as JSON"
- Open browser console (F12) to see the raw response
- The AI prompt has been optimized to return pure JSON
- If issue persists, try simplifying your workflow description

### "CORS error" or "Failed to fetch"
- Make sure the Netlify deployment completed successfully
- Check that the serverless function deployed correctly
- Try refreshing the page

### "Invalid API key"
- Verify your Anthropic API key starts with `sk-ant-`
- Get a new key at [console.anthropic.com](https://console.anthropic.com/)
- Ensure you have sufficient API credits

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs via GitHub Issues
- Suggest features
- Submit pull requests
- Improve documentation

## 🔒 Privacy & Security

### How Your Data is Handled

- **API Keys**: Your API key is transmitted through our serverless proxy to Anthropic/OpenAI via HTTPS. Keys are **not stored** in any database, but may appear in temporary server execution logs for debugging purposes.

- **File Uploads**: Files are processed **entirely in your browser**. Only metadata (column names, row count from first 50KB) is extracted. Full file contents never leave your device.

- **Prompts & Code**: Your workflow descriptions and generated code pass through our Netlify serverless functions but are **not saved** to any database or persistent storage.

- **No Tracking**: We do not use analytics, cookies, or tracking pixels. Your usage is private.

### Security Measures

- ✅ HTTPS encryption for all communications
- ✅ Content Security Policy (CSP) headers
- ✅ Input sanitization & prompt injection detection
- ✅ Server-side validation of all requests
- ✅ No data persistence or logging to databases

### Important Limitations

⚠️ **This is beta software**. While we've implemented security best practices:
- API keys transit through serverless functions (may appear in logs)
- Rate limiting is not yet implemented
- Not recommended for highly sensitive data workflows

For detailed security information, see [SECURITY_PENTEST.md](SECURITY_PENTEST.md) and [PRODUCTION_ACTION_PLAN.md](PRODUCTION_ACTION_PLAN.md).

## 📄 License

MIT License - feel free to use this project however you'd like!

## 🙏 Acknowledgments

- Built with [Claude](https://www.anthropic.com/claude) by Anthropic & [OpenAI GPT-4](https://openai.com/)
- Powered by [Netlify](https://www.netlify.com/)
- Created for Alteryx users transitioning to Python

---

**Note**: This is an unofficial tool and is not affiliated with Alteryx Inc. or Alteryx.

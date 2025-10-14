# Alterwise - Local Development Setup

Complete guide to running Alterwise locally before deploying to Vercel.

---

## 🚀 Quick Start (TL;DR)

**Terminal 1 (Backend):**
```bash
cd /Users/justingrosz/Documents/AI-Work/alter_yx
./start_backend.sh
```

**Terminal 2 (Frontend):**
```bash
cd /Users/justingrosz/Documents/AI-Work/alter_yx
./start_frontend.sh
```

**Open Browser:** http://localhost:5173

---

## 📋 Prerequisites

### Required Software
- ✅ **Python 3.8+** - Check: `python --version`
- ✅ **Node.js 16+** - Check: `node --version`
- ✅ **npm** - Check: `npm --version`
- ✅ **Anthropic API Key** - Get from: https://console.anthropic.com/

### Verify Your Setup
```bash
# Check Python
python --version  # or python3 --version

# Check Node.js
node --version

# Check npm
npm --version
```

---

## 🔧 Initial Setup (First Time Only)

### 1. Backend Setup

```bash
cd /Users/justingrosz/Documents/AI-Work/alter_yx/backend

# Install Python dependencies
pip install -r requirements.txt

# Verify .env file exists with API key
cat .env
# Should show: ANTHROPIC_API_KEY=sk-ant-...
```

**If .env is missing:**
```bash
echo "ANTHROPIC_API_KEY=your_api_key_here" > .env
```

### 2. Frontend Setup

```bash
cd /Users/justingrosz/Documents/AI-Work/alter_yx/frontend

# Install Node.js dependencies
npm install

# Verify .env file exists
cat .env
# Should show: VITE_API_URL=http://localhost:8000
```

**If .env is missing:**
```bash
echo "VITE_API_URL=http://localhost:8000" > .env
```

---

## 🎬 Starting the Servers

### Option 1: Using Startup Scripts (Recommended)

**Terminal 1 - Start Backend:**
```bash
cd /Users/justingrosz/Documents/AI-Work/alter_yx
./start_backend.sh
```

You should see:
```
========================================
  ALTERWISE - Starting Backend Server
========================================

✓ Configuration files found
✓ Dependencies ready

Starting FastAPI server on http://localhost:8000
API docs will be available at http://localhost:8000/docs

Press Ctrl+C to stop the server
========================================

INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process [12345] using StatReload
INFO:     Started server process [12346]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

**Terminal 2 - Start Frontend:**
```bash
cd /Users/justingrosz/Documents/AI-Work/alter_yx
./start_frontend.sh
```

You should see:
```
========================================
  ALTERWISE - Starting Frontend Server
========================================

✓ Configuration files found
✓ Dependencies ready

Starting Vite development server on http://localhost:5173

⚠️  IMPORTANT: Make sure the backend is running on http://localhost:8000

Press Ctrl+C to stop the server
========================================

  VITE v5.0.8  ready in 1234 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.1.100:5173/
  ➜  press h to show help
```

### Option 2: Manual Commands

**Backend (Terminal 1):**
```bash
cd /Users/justingrosz/Documents/AI-Work/alter_yx/backend
uvicorn api.generate:app --reload --port 8000 --host 0.0.0.0
```

**Frontend (Terminal 2):**
```bash
cd /Users/justingrosz/Documents/AI-Work/alter_yx/frontend
npm run dev
```

---

## 🌐 Accessing the Application

Once both servers are running:

### Main Application
**URL:** http://localhost:5173
- Upload CSV/Excel files
- Generate Python scripts
- View workflow diagrams

### Backend API Documentation
**URL:** http://localhost:8000/docs
- Interactive API documentation
- Test endpoints directly
- View request/response schemas

### Health Check
**URL:** http://localhost:8000/api/health
```json
{
  "status": "healthy",
  "service": "Alterwise API",
  "version": "1.0.0",
  "security": "enabled"
}
```

---

## 🧪 Testing the Fixed Column Name Issue

### Test with Sample Data

1. **Start both servers** (backend + frontend)

2. **Create test CSV:**
```bash
cd /Users/justingrosz/Documents/AI-Work/alter_yx

# Use the sample we created
cat final_ncc_data.csv
```

3. **Upload via UI:**
   - Open http://localhost:5173
   - Upload `final_ncc_data.csv`
   - Describe requirement: "Analyze NCC by sector and region"
   - Click "Generate Python Script"

4. **Verify the fix:**
   - Generated script should include:
   ```python
   df = pd.read_csv('final_ncc_data.csv')
   df.columns = df.columns.str.lower().str.strip()  # ✅ This line!
   ```

5. **Test the generated script:**
   - Copy the generated script
   - Save as `test_generated.py`
   - Run: `python test_generated.py`
   - Should work without column name errors!

---

## 🐛 Troubleshooting

### Backend Issues

**Problem:** `ModuleNotFoundError: No module named 'fastapi'`
```bash
cd backend
pip install -r requirements.txt
```

**Problem:** `API configuration error`
```bash
# Check if .env exists
cat backend/.env

# If missing, create it
echo "ANTHROPIC_API_KEY=your_key_here" > backend/.env
```

**Problem:** `Address already in use (port 8000)`
```bash
# Find and kill the process
lsof -ti:8000 | xargs kill -9

# Or use a different port
uvicorn api.generate:app --reload --port 8001
```

### Frontend Issues

**Problem:** `Module not found` errors
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

**Problem:** `VITE_API_URL is not defined`
```bash
# Create .env file
echo "VITE_API_URL=http://localhost:8000" > frontend/.env

# Restart frontend server
```

**Problem:** `Cannot connect to backend`
- Ensure backend is running on port 8000
- Check: http://localhost:8000/api/health
- Verify CORS settings allow localhost:5173

### CORS Issues

**Symptom:** Frontend can't connect to backend

**Fix:** Verify CORS settings in `backend/api/generate.py`:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins in dev
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)
```

---

## 📊 File Structure Reference

```
alter_yx/
├── backend/
│   ├── .env                    # API key (ANTHROPIC_API_KEY)
│   ├── requirements.txt        # Python dependencies
│   ├── api/
│   │   └── generate.py        # FastAPI endpoints
│   └── knowledge/
│       └── alteryx_mapping.py # Knowledge base (UPDATED ✅)
│
├── frontend/
│   ├── .env                   # API URL (VITE_API_URL)
│   ├── package.json           # Node dependencies
│   ├── vite.config.js        # Vite configuration
│   └── src/
│       ├── App.jsx           # Main React component
│       └── App.css           # Styles
│
├── start_backend.sh          # Backend startup script ✅
├── start_frontend.sh         # Frontend startup script ✅
├── example_ncc_fixed.py      # Test script with fix ✅
├── final_ncc_data.csv        # Sample test data ✅
├── FIX_SUMMARY.md            # Detailed fix documentation ✅
└── LOCAL_SETUP.md            # This file ✅
```

---

## 🔄 Development Workflow

### Making Changes

**Backend Changes:**
1. Edit files in `backend/`
2. Server auto-reloads (watch terminal)
3. Test at http://localhost:8000/docs

**Frontend Changes:**
1. Edit files in `frontend/src/`
2. Vite hot-reloads automatically
3. See changes instantly in browser

**Knowledge Base Updates:**
1. Edit `backend/knowledge/alteryx_mapping.py`
2. Backend auto-reloads
3. Next generation will use updated knowledge

### Testing the Column Fix

**Before Fix:**
```python
df = pd.read_csv('data.csv')
# Columns: ['Sector', 'Region', 'Month']
required_cols = ['sector', 'region', 'month']
# ❌ Fails - case mismatch!
```

**After Fix:**
```python
df = pd.read_csv('data.csv')
df.columns = df.columns.str.lower().str.strip()
# Columns: ['sector', 'region', 'month']
required_cols = ['sector', 'region', 'month']
# ✅ Works!
```

---

## 🚀 Ready to Deploy to Vercel?

Once local testing is complete:

### 1. Test Everything Locally
- [ ] Backend starts without errors
- [ ] Frontend connects to backend
- [ ] Can upload CSV files
- [ ] Scripts generate successfully
- [ ] Generated scripts handle column names correctly

### 2. Commit Changes
```bash
git add .
git commit -m "fix: add column name normalization for case-insensitive processing"
git push origin main
```

### 3. Deploy to Vercel

**Backend:**
```bash
cd backend
vercel --prod
# Set environment variable:
vercel env add ANTHROPIC_API_KEY
```

**Frontend:**
```bash
cd frontend
# Update .env.production with production backend URL
vercel --prod
```

---

## 📝 Quick Reference

### Startup Commands
```bash
# Backend
./start_backend.sh

# Frontend
./start_frontend.sh

# Both (in separate terminals)
```

### Stop Servers
```bash
# Press Ctrl+C in each terminal
```

### Check if Running
```bash
# Backend
curl http://localhost:8000/api/health

# Frontend
curl http://localhost:5173
```

### View Logs
- Backend logs appear in Terminal 1
- Frontend logs appear in Terminal 2
- Browser console shows client-side logs

---

## ✅ Verification Checklist

Before considering local setup complete:

- [ ] Backend starts on http://localhost:8000
- [ ] Frontend starts on http://localhost:5173
- [ ] Can access API docs at http://localhost:8000/docs
- [ ] Can upload CSV files through UI
- [ ] Can generate Python scripts
- [ ] Generated scripts include column normalization
- [ ] Test script runs without column name errors
- [ ] No CORS errors in browser console

---

## 🆘 Need Help?

### Common Issues
1. **Port already in use**: Change ports in configs
2. **Dependencies missing**: Re-run install commands
3. **API key invalid**: Check `.env` file
4. **CORS errors**: Verify middleware settings

### Debug Mode

**Backend Debug:**
```bash
cd backend
uvicorn api.generate:app --reload --port 8000 --log-level debug
```

**Frontend Debug:**
Check browser console (F12) for detailed errors

---

**Last Updated:** October 14, 2025
**Status:** ✅ Ready for local development and testing

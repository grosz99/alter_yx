# ⚡ Alterwise - Quick Start Guide

## 🎉 Your Servers Are Already Running!

Based on the test results, both your backend and frontend are already active:

- ✅ **Backend:** http://localhost:8000
- ✅ **Frontend:** http://localhost:5173

---

## 🧪 Test the Column Fix Right Now!

### Option 1: Test with the UI (Recommended)

1. **Open your browser:**
   ```
   http://localhost:5173
   ```

2. **Upload the test file:**
   - Click "Browse" or drag & drop
   - Select: `/Users/justingrosz/Documents/AI-Work/alter_yx/final_ncc_data.csv`

3. **Enter requirement:**
   ```
   Analyze NCC data by sector and region. Show totals, averages, and monthly trends.
   ```

4. **Click "Generate Python Script"**

5. **Verify the fix:**
   - Look for this line in the generated code:
   ```python
   df.columns = df.columns.str.lower().str.strip()
   ```
   - This means the fix is working! ✅

6. **Download and test the script:**
   - Click "Download Script"
   - Save as `test_generated.py`
   - Run: `python test_generated.py`
   - Should work without column name errors!

---

### Option 2: Test with Example Script

We already have a working example ready:

```bash
cd /Users/justingrosz/Documents/AI-Work/alter_yx
python example_ncc_fixed.py
```

Expected output:
```
✓ Successfully loaded 18 records
✓ Columns: ['sector', 'month', 'client', 'project_id', 'ncc', 'region', 'system']
✓ All required columns present

[Analysis results...]

✓ Results saved to output/ncc_analysis_results.xlsx
```

---

## 📊 View API Documentation

**URL:** http://localhost:8000/docs

This shows:
- All available endpoints
- Request/response schemas
- Interactive API testing

---

## 🔄 If You Need to Restart Servers

### Stop Servers
If you need to stop them, find the terminal windows and press `Ctrl+C`

Or kill them:
```bash
# Kill backend
lsof -ti:8000 | xargs kill -9

# Kill frontend
lsof -ti:5173 | xargs kill -9
```

### Start Servers

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

---

## ✅ Verification Checklist

Test these to confirm everything works:

- [ ] Frontend loads: http://localhost:5173
- [ ] Backend healthy: http://localhost:8000/api/health
- [ ] Can upload CSV files
- [ ] Scripts generate successfully
- [ ] Generated code includes column normalization
- [ ] Downloaded scripts run without errors

---

## 🎯 What Changed (The Fix)

### Before (Broken):
```python
df = pd.read_csv('final_ncc_data.csv')
# Columns: ['Sector', 'Region', 'Month'] ← Capitalized in CSV

required_cols = ['sector', 'region', 'month']  # ← Lowercase in code
if c not in df.columns:  # ❌ Fails - case mismatch!
```

### After (Fixed):
```python
df = pd.read_csv('final_ncc_data.csv')
df.columns = df.columns.str.lower().str.strip()  # ✅ Normalize!
# Columns: ['sector', 'region', 'month'] ← Now lowercase

required_cols = ['sector', 'region', 'month']  # ← Matches!
if c not in df.columns:  # ✅ Works!
```

---

## 📁 Files Created for You

All ready in `/Users/justingrosz/Documents/AI-Work/alter_yx/`:

1. ✅ **start_backend.sh** - Backend startup script
2. ✅ **start_frontend.sh** - Frontend startup script
3. ✅ **test_local_setup.sh** - Setup verification
4. ✅ **example_ncc_fixed.py** - Working example script
5. ✅ **final_ncc_data.csv** - Test data (18 records)
6. ✅ **LOCAL_SETUP.md** - Detailed setup guide
7. ✅ **FIX_SUMMARY.md** - Technical fix documentation
8. ✅ **QUICK_START.md** - This file

---

## 🚀 Next Steps

### 1. Test the Fix Locally ⬅️ **You Are Here**
   - Upload CSV files
   - Generate scripts
   - Verify column normalization works

### 2. Verify Generated Scripts
   - Download generated code
   - Check for `df.columns = df.columns.str.lower().str.strip()`
   - Test scripts with your actual data

### 3. Deploy to Vercel
   Once everything works locally:
   ```bash
   # Commit changes
   git add .
   git commit -m "fix: add column name normalization"
   git push origin main

   # Deploy backend
   cd backend
   vercel --prod

   # Deploy frontend
   cd ../frontend
   vercel --prod
   ```

---

## 🆘 Quick Troubleshooting

**"Cannot connect to backend"**
- Check: http://localhost:8000/api/health
- If not working: `./start_backend.sh`

**"Column name error still happening"**
- Make sure you're testing with newly generated code
- Old scripts won't have the fix
- Regenerate using the UI

**"Need to restart everything"**
```bash
# Kill all
lsof -ti:8000 | xargs kill -9
lsof -ti:5173 | xargs kill -9

# Restart
./start_backend.sh  # Terminal 1
./start_frontend.sh # Terminal 2
```

---

## ✨ You're All Set!

Everything is configured and running. Just open:

**🌐 http://localhost:5173**

And start testing! 🚀

---

**Pro Tip:** Keep the verification test handy:
```bash
./test_local_setup.sh
```

Run this anytime to check if everything is working correctly.

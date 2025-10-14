# 🚀 Deploy Alter-thon to Vercel (Single Deployment)

**Simple, unified deployment - Everything in one command!**

---

## ✅ What Changed

Your project is now restructured for **single deployment**:

```
alter_yx/
├── api/                    # Backend (Python/FastAPI)
│   ├── index.py           # Main API file
│   └── knowledge/         # Knowledge base
├── frontend/              # Frontend (React/Vite)
├── requirements.txt       # Python dependencies
├── package.json           # Build configuration
└── vercel.json           # Unified deployment config
```

**Benefits:**
- ✅ Single `vercel` command deploys everything
- ✅ One URL for both frontend and backend
- ✅ No CORS issues
- ✅ Simpler configuration

---

## 🎯 Prerequisites

1. **Vercel CLI** - Install: `npm install -g vercel`
2. **Anthropic API Key** - Get from: https://console.anthropic.com/
3. **Vercel Account** - Sign up at: https://vercel.com

---

## 🚀 Deploy in 3 Steps

### Step 1: Login to Vercel

```bash
vercel login
```

### Step 2: Deploy

```bash
cd /Users/justingrosz/Documents/AI-Work/alter_yx
vercel --prod
```

You'll be prompted:

```
? Set up and deploy? [Y/n] Y
? Which scope? Your Username
? Link to existing project? [y/N] N
? What's your project's name? alter-thon
? In which directory is your code located? ./
```

**Answer:**
- Project name: `alter-thon`
- Directory: `./`

### Step 3: Add Environment Variable

```bash
vercel env add ANTHROPIC_API_KEY production
```

When prompted, paste your Anthropic API key.

Then redeploy:
```bash
vercel --prod
```

---

## ✅ Done!

Your application is live at:
```
https://alter-thon.vercel.app
```

(Or whatever URL Vercel assigns you)

---

## 🧪 Test Your Deployment

1. **Visit your URL**
   ```
   https://your-app.vercel.app
   ```

2. **Check health endpoint**
   ```
   https://your-app.vercel.app/api/health
   ```

   Should return:
   ```json
   {
     "status": "healthy",
     "service": "Alter-thon API",
     "version": "1.0.0",
     "security": "enabled"
   }
   ```

3. **Upload a CSV and generate code**
   - Upload any CSV file
   - Enter: "Filter for amounts > 1000"
   - Click "Generate Python Script"
   - Should receive working Python code!

---

## 🔄 Update Your Deployment

Whenever you make changes:

```bash
git add .
git commit -m "your changes"
git push origin main
```

Then redeploy:
```bash
vercel --prod
```

---

## 🆘 Troubleshooting

### "Module not found" error

Make sure you're deploying from the root directory:
```bash
cd /Users/justingrosz/Documents/AI-Work/alter_yx
vercel --prod
```

### "API configuration error"

Add your Anthropic API key:
```bash
vercel env add ANTHROPIC_API_KEY production
vercel --prod
```

### Frontend shows but API doesn't work

Check the environment variable:
```bash
vercel env ls
```

Should show `ANTHROPIC_API_KEY` for production.

---

## 📊 Monitor Your Deployment

Visit Vercel Dashboard:
```
https://vercel.com/dashboard
```

You can see:
- Deployment logs
- Build status
- Runtime logs
- Analytics

---

## ⚡ Local Development

Both servers run together:

**Terminal 1 - Backend:**
```bash
cd /Users/justingrosz/Documents/AI-Work/alter_yx
uvicorn index:app --reload --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd /Users/justingrosz/Documents/AI-Work/alter_yx/frontend
npm run dev
```

**Open:** http://localhost:5173

The frontend automatically proxies `/api` requests to the backend!

---

## ✨ You're Done!

Your Alter-thon application is now:
- ✅ Deployed to Vercel
- ✅ Accessible worldwide
- ✅ Using Claude Sonnet 4.5 for code generation
- ✅ Column name normalization working
- ✅ Single URL, no CORS issues

**Share your URL and help data professionals transition from Alteryx to Python!** 🚀

---

**Last Updated:** October 14, 2025
**Deployment Type:** Single unified deployment

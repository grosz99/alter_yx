# 🚀 Deploy Alter-thon to Vercel (Single Project)

Deploy both frontend and backend as a single Vercel project!

---

## 📋 Prerequisites

- ✅ **Vercel Account** - Sign up at https://vercel.com
- ✅ **Vercel CLI** - Install: `npm install -g vercel`
- ✅ **GitHub Repository** - Your code at https://github.com/grosz99/alter_yx
- ✅ **Local testing complete** - Everything works locally

---

## 🎯 One-Command Deployment

### Option 1: Deploy from CLI

```bash
cd /Users/justingrosz/Documents/AI-Work/alter_yx

# Login to Vercel
vercel login

# Deploy to production
vercel --prod
```

**Answer the prompts:**
```
? Set up and deploy? Y
? Which scope? (your username)
? Link to existing project? N
? What's your project's name? alter-thon
? In which directory is your code located? ./
```

**That's it!** ✅ Both frontend and backend are now deployed!

---

### Option 2: Deploy from GitHub (Recommended)

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard

2. **Import Project**:
   - Click "Add New..."
   - Select "Project"
   - Import from GitHub
   - Select `grosz99/alter_yx`

3. **Configure**:
   - **Framework Preset**: Vite
   - **Root Directory**: `./` (leave as project root)
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Output Directory**: `frontend/dist`
   - **Install Command**: `cd frontend && npm install`

4. **Click "Deploy"**

5. **Done!** ✅ Vercel auto-deploys on every push to main

---

## 📦 What Gets Deployed

```
alter_yx/
├── api/                    → Vercel Serverless Functions
│   ├── index.py           → /api/* routes
│   ├── requirements.txt   → Python dependencies
│   └── knowledge/         → Alteryx mappings
│
├── frontend/              → Static Site
│   ├── dist/             → Built files (created on deploy)
│   └── src/              → React source
│
└── vercel.json           → Unified deployment config
```

**Result:**
- **Frontend**: https://alter-thon.vercel.app
- **API**: https://alter-thon.vercel.app/api/*

---

## ✅ Verify Deployment

### Test Backend

```bash
curl https://alter-thon.vercel.app/api/health
```

Expected:
```json
{
  "status": "healthy",
  "service": "Alter-thon API",
  "version": "1.0.0",
  "security": "enabled"
}
```

### Test Frontend

Open: https://alter-thon.vercel.app

Should see:
- ⚡ Alter-thon header
- 🔑 API key input
- 📁 File upload area
- 💬 Workflow description

---

## 🔑 No Environment Variables Needed!

Since users provide their own API keys:
- ✅ No `ANTHROPIC_API_KEY` needed on backend
- ✅ No environment configuration
- ✅ Deploy and forget!

---

## 🔧 Advanced Configuration

### Custom Domain

In Vercel Dashboard:
1. Go to your project
2. Settings → Domains
3. Add your domain
4. Follow DNS setup

### Environment Variables (Optional)

If you want a fallback API key:

```bash
# Add via CLI
vercel env add ANTHROPIC_API_KEY

# Or via Dashboard
Project → Settings → Environment Variables
```

But **not required** since users provide their own!

---

## 🔄 Continuous Deployment

**Automatic Deploys:**
- Push to `main` branch → Auto-deploy to production
- Push to other branches → Auto-deploy to preview URLs

**Manual Deploys:**
```bash
# Deploy current branch
vercel

# Deploy to production
vercel --prod
```

---

## 📊 Monitoring

### View Logs

**CLI:**
```bash
vercel logs https://alter-thon.vercel.app
```

**Dashboard:**
- Project → Deployments → Click deployment → Logs

### Analytics

- Project → Analytics
- View page views, performance metrics

---

## 🐛 Troubleshooting

### Backend Issues

**Problem:** "Module not found" error

**Solution:** Ensure `api/requirements.txt` lists all dependencies

**Problem:** Function timeout

**Solution:** Increase timeout in `vercel.json`:
```json
{
  "functions": {
    "api/*.py": {
      "maxDuration": 60
    }
  }
}
```

### Frontend Issues

**Problem:** "Cannot connect to API"

**Solution:** Check browser console. API should be at same domain (relative URLs)

**Problem:** Build fails

**Solution:**
```bash
# Test build locally
cd frontend
npm install
npm run build
```

### CORS Issues

**Should not occur** since API and frontend are on same domain!

---

## 📝 Deployment Checklist

Before going live:

- [ ] Code pushed to GitHub
- [ ] Vercel project created
- [ ] Deployment successful
- [ ] Backend health check works
- [ ] Frontend loads correctly
- [ ] Can upload files
- [ ] Can generate scripts (with user API key)
- [ ] Column normalization present in generated code
- [ ] No console errors

---

## 🎯 Project Structure

```
https://alter-thon.vercel.app/
├── /                      → Frontend (React + Vite)
├── /api/health           → Health check
├── /api/generate         → Script generation
└── /api/execute          → Script execution
```

---

## 💡 Key Benefits

✅ **Single deployment** - One command, everything goes live
✅ **Same domain** - No CORS issues
✅ **No API key management** - Users provide their own
✅ **Auto-scaling** - Vercel handles traffic
✅ **SSL included** - HTTPS by default
✅ **Global CDN** - Fast worldwide
✅ **Preview deployments** - Test before production

---

## 🚀 Quick Deploy Commands

```bash
# First time
cd alter_yx
vercel --prod

# Future updates
git add .
git commit -m "Update feature"
git push origin main
# Auto-deploys!

# Or manual
vercel --prod
```

---

## 📚 Resources

- **Vercel Docs**: https://vercel.com/docs
- **Python Functions**: https://vercel.com/docs/functions/serverless-functions/runtimes/python
- **Vite Deployment**: https://vitejs.dev/guide/static-deploy.html
- **Your Project**: https://github.com/grosz99/alter_yx

---

## ✨ You're Ready!

Deploy with one command:
```bash
vercel --prod
```

Then share your URL:
```
https://alter-thon.vercel.app
```

**Happy deploying! 🎉**

---

**Last Updated:** October 15, 2025
**Version:** 2.0.0 (Unified Deployment)

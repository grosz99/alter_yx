# 🚀 Deploy Alter-thon to Vercel

Complete step-by-step guide to deploy your Alter-thon application to Vercel.

---

## 📋 Prerequisites

Before deploying, make sure you have:

- ✅ **Vercel Account** - Sign up at https://vercel.com
- ✅ **Vercel CLI** - Install: `npm install -g vercel`
- ✅ **Anthropic API Key** - Get from: https://console.anthropic.com/
- ✅ **GitHub Repository** - Your code at https://github.com/grosz99/alter_yx
- ✅ **Local testing complete** - Everything works locally

---

## 🎯 Deployment Overview

We'll deploy two separate projects:
1. **Backend** (FastAPI) - Serverless Functions
2. **Frontend** (React + Vite) - Static Site

---

## 🔧 Step 1: Deploy Backend

### 1.1 Login to Vercel

```bash
vercel login
```

Follow the prompts to authenticate.

### 1.2 Navigate to Backend

```bash
cd /Users/justingrosz/Documents/AI-Work/alter_yx/backend
```

### 1.3 Deploy to Production

```bash
vercel --prod
```

You'll be prompted:

```
? Set up and deploy "~/Documents/AI-Work/alter_yx/backend"? [Y/n] Y
? Which scope do you want to deploy to? (Use arrow keys)
  ❯ Your Username
? Link to existing project? [y/N] N
? What's your project's name? alter-thon-backend
? In which directory is your code located? ./
```

**Important answers:**
- Project name: `alter-thon-backend`
- Directory: `./` (current directory)

### 1.4 Add Environment Variables

After deployment completes, add your API key:

```bash
vercel env add ANTHROPIC_API_KEY production
```

When prompted, paste your Anthropic API key:
```
? What's the value of ANTHROPIC_API_KEY? sk-ant-api03-...
```

### 1.5 Redeploy with Environment Variable

```bash
vercel --prod
```

### 1.6 Save Your Backend URL

After deployment, you'll see:

```
✅  Production: https://alter-thon-backend.vercel.app [copied to clipboard]
```

**SAVE THIS URL!** You'll need it for the frontend.

Example: `https://alter-thon-backend-abc123.vercel.app`

---

## 🎨 Step 2: Deploy Frontend

### 2.1 Update Frontend Environment

Navigate to frontend and update the API URL:

```bash
cd /Users/justingrosz/Documents/AI-Work/alter_yx/frontend
```

Create/update `.env.production`:

```bash
echo "VITE_API_URL=https://alter-thon-backend-abc123.vercel.app" > .env.production
```

Replace `alter-thon-backend-abc123.vercel.app` with your actual backend URL from Step 1.6!

### 2.2 Update Vercel Configuration

Update `frontend/vercel.json` to point to your backend:

```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://alter-thon-backend-abc123.vercel.app/api/:path*"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

**Replace the backend URL with yours!**

### 2.3 Deploy Frontend

```bash
vercel --prod
```

You'll be prompted:

```
? Set up and deploy "~/Documents/AI-Work/alter_yx/frontend"? [Y/n] Y
? Which scope do you want to deploy to? (Use arrow keys)
  ❯ Your Username
? Link to existing project? [y/N] N
? What's your project's name? alter-thon
? In which directory is your code located? ./
```

**Important answers:**
- Project name: `alter-thon`
- Directory: `./` (current directory)

### 2.4 Get Your Frontend URL

```
✅  Production: https://alter-thon.vercel.app [copied to clipboard]
```

---

## ✅ Step 3: Verify Deployment

### 3.1 Test Backend

```bash
curl https://your-backend-url.vercel.app/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "Alter-thon API",
  "version": "1.0.0",
  "security": "enabled"
}
```

### 3.2 Test Frontend

Open in browser:
```
https://your-frontend-url.vercel.app
```

You should see:
- ⚡ Alter-thon header
- File upload area
- Generate button

### 3.3 Full Integration Test

1. Upload a CSV file
2. Enter requirement: "Filter for amounts > 1000 and show summary"
3. Click "Generate Python Script"
4. Should receive:
   - Python script with column normalization
   - Mermaid workflow diagram
   - No errors!

---

## 🔄 Step 4: Update CORS Settings (If Needed)

If you get CORS errors, update backend CORS settings:

**Edit `backend/api/generate.py`:**

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://alter-thon.vercel.app",  # Your frontend URL
        "http://localhost:5173"  # Keep for local dev
    ],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)
```

Then redeploy backend:
```bash
cd backend
vercel --prod
```

---

## 📝 Step 5: Custom Domain (Optional)

### 5.1 Add Domain to Frontend

In Vercel Dashboard:
1. Go to your `alter-thon` project
2. Settings → Domains
3. Add your domain: `alterthon.com`
4. Follow DNS configuration instructions

### 5.2 Update Backend CORS

Add your custom domain to allowed origins in `backend/api/generate.py`.

---

## 🐛 Troubleshooting

### Backend Issues

**Problem:** "Module not found" error

**Solution:**
```bash
cd backend
# Make sure requirements.txt is complete
vercel --prod
```

**Problem:** "API configuration error"

**Solution:**
```bash
# Check environment variable
vercel env ls
# If missing, add it
vercel env add ANTHROPIC_API_KEY production
vercel --prod
```

### Frontend Issues

**Problem:** "Cannot connect to backend"

**Solution:**
1. Verify backend URL in `.env.production`
2. Check `vercel.json` has correct backend URL
3. Redeploy: `vercel --prod`

**Problem:** CORS errors in browser console

**Solution:**
1. Update backend CORS settings (Step 4)
2. Ensure frontend URL is in allowed origins
3. Redeploy backend

### General Issues

**Problem:** "Function timeout"

**Solution:**
- Anthropic API is slow sometimes
- In `backend/vercel.json`, increase timeout:
```json
{
  "functions": {
    "api/**/*.py": {
      "maxDuration": 60
    }
  }
}
```

---

## 🔧 Useful Vercel Commands

```bash
# View deployment logs
vercel logs https://your-project.vercel.app

# List all deployments
vercel ls

# Remove a deployment
vercel rm deployment-url

# View environment variables
vercel env ls

# Pull environment variables locally
vercel env pull

# Open project in Vercel dashboard
vercel open
```

---

## 📊 Monitoring Your Deployment

### Vercel Dashboard

Visit: https://vercel.com/dashboard

You can monitor:
- Deployment status
- Build logs
- Runtime logs
- Analytics
- Performance metrics

### Set Up Monitoring

1. **Error Tracking**
   - Enable Error Tracking in Vercel Dashboard
   - Or integrate Sentry

2. **Analytics**
   - Vercel Analytics (built-in)
   - Track page views, performance

3. **Logs**
   - View real-time logs in dashboard
   - Set up log drains for long-term storage

---

## 🚀 Continuous Deployment

### Enable Auto-Deploy from GitHub

1. Go to Vercel Dashboard
2. Import your GitHub repository
3. Configure:
   - **Backend**: `backend` directory
   - **Frontend**: `frontend` directory
4. Enable auto-deploy on push to `main`

Now every push to GitHub automatically deploys!

---

## 📋 Deployment Checklist

Before going live:

- [ ] Backend deployed successfully
- [ ] Environment variables configured
- [ ] Backend health check works
- [ ] Frontend deployed successfully
- [ ] Frontend connects to backend
- [ ] Can upload CSV files
- [ ] Can generate Python scripts
- [ ] Column normalization working
- [ ] No CORS errors
- [ ] Security headers enabled
- [ ] Custom domain configured (if applicable)
- [ ] Monitoring set up
- [ ] Error tracking enabled

---

## 🎯 Quick Reference

### Your Deployed URLs

**Backend:**
```
https://alter-thon-backend-[your-id].vercel.app
API Docs: https://alter-thon-backend-[your-id].vercel.app/docs
Health: https://alter-thon-backend-[your-id].vercel.app/api/health
```

**Frontend:**
```
https://alter-thon-[your-id].vercel.app
```

### Environment Variables

**Backend:**
- `ANTHROPIC_API_KEY` - Your Claude API key

**Frontend:**
- `VITE_API_URL` - Your backend URL

---

## 🆘 Need Help?

- **Vercel Docs**: https://vercel.com/docs
- **FastAPI Deployment**: https://vercel.com/docs/functions/serverless-functions/runtimes/python
- **Vite Deployment**: https://vitejs.dev/guide/static-deploy.html
- **GitHub Issues**: https://github.com/grosz99/alter_yx/issues

---

## ✨ You're Ready!

Your Alter-thon application is now live and accessible worldwide! 🌍

**Next Steps:**
1. Share your deployment URL
2. Monitor usage and performance
3. Iterate based on user feedback
4. Add features as needed

Happy deploying! 🚀

---

**Last Updated:** October 14, 2025
**Version:** 1.0.0

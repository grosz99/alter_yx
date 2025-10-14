# 🚀 Alter-thon Deployment Guide

**Quick Start:** Deploy backend to Railway (free), frontend to Vercel (free)

## The Problem We Solved

Vercel team accounts have deployment protection that blocks API requests with HTTP 401. This makes them unsuitable for public-facing APIs without complex bypass configurations.

## The Solution

**Split deployment strategy:**
- 🚂 **Backend → Railway** (no auth barriers, free tier, native Python support)
- ⚡ **Frontend → Vercel** (fast, CDN, perfect for React SPAs)

## 📋 Deployment Steps

### 1. Deploy Backend to Railway (5 minutes)

```bash
# 1. Visit railway.app and sign in with GitHub
# 2. Click "Deploy from GitHub repo"
# 3. Select: grosz99/alter_yx
# 4. Set root directory: api
# 5. Add environment variable: ANTHROPIC_API_KEY=your-key
# 6. Generate domain and copy URL
```

**Detailed guide:** See [DEPLOY_RAILWAY.md](./DEPLOY_RAILWAY.md)

### 2. Update Frontend Configuration

```bash
cd frontend
echo "VITE_API_URL=https://your-railway-url.railway.app" > .env.production
```

### 3. Deploy Frontend to Vercel

```bash
cd frontend
npx vercel --prod
# ✅ Frontend deploys successfully!
```

## 🎯 Architecture

```
User Browser
     ↓
Vercel CDN (Frontend)
     ↓ HTTPS
Railway (Backend API)
     ↓
Anthropic Claude API
```

## ✅ Advantages of This Approach

| Aspect | Railway Backend | Vercel Backend |
|--------|----------------|----------------|
| Cost | Free $5/month | Free (but blocked by auth) |
| Setup Time | 5 minutes | 30+ minutes troubleshooting |
| CORS Issues | None | Multiple |
| Auth Barriers | None | Team protection blocks |
| Python Support | Native | Serverless only |
| Shareable | ✅ Works for everyone | ❌ Requires authentication |

## 🔧 Configuration Files

### Backend (`/api`)

- **`railway.json`** - Railway configuration
- **`Procfile`** - Start command
- **`runtime.txt`** - Python 3.12
- **`requirements.txt`** - Dependencies
- **`vercel.json`** - (Optional) For Vercel deployment with Mangum

### Frontend (`/frontend`)

- **`.env.production`** - Production API URL
- **`vercel.json`** - Vite build configuration

## 🔄 Deployment Workflow

```bash
# Make changes
git add .
git commit -m "Update feature"
git push origin main

# Railway auto-deploys backend ✅
# Manually deploy frontend:
cd frontend && npx vercel --prod
```

## 🐛 Troubleshooting

### "Network Error" in production?

**Check:**
1. Railway backend is running (green status)
2. `ANTHROPIC_API_KEY` is set in Railway variables
3. Frontend `.env.production` has correct Railway URL
4. Railway domain is publicly accessible (no auth)

### CORS errors?

**Solution:**
- Backend already has CORS configured for `*`
- If issues persist, check Railway logs for startup errors

### Railway deployment fails?

**Check:**
1. Root directory set to `api`
2. Python version in `runtime.txt` matches Railway (3.12)
3. All dependencies in `requirements.txt`
4. Environment variables saved

## 📊 Monitoring

### Railway Backend
- View logs: Railway Dashboard → Service → Deployments → Logs
- Check health: `https://your-url.railway.app/api/health`

### Vercel Frontend
- View logs: `vercel logs <deployment-url>`
- Check status: Vercel Dashboard → Project → Deployments

## 💰 Cost Breakdown

- **Railway Backend:** $5/month free credit (plenty for demos)
- **Vercel Frontend:** Generous free tier
- **Anthropic API:** Pay-per-use (typically <$1/month for demos)
- **Total:** ~$1-5/month for production use

## 🔐 Security Checklist

- [ ] `ANTHROPIC_API_KEY` stored in Railway environment (not in code)
- [ ] `.env` files in `.gitignore`
- [ ] CORS configured properly (backend accepts all origins for now)
- [ ] HTTPS enabled (automatic on both platforms)
- [ ] API key never exposed in frontend code

## 🌐 Sharing Your App

Once deployed, share these URLs:

- **Live App:** `https://your-frontend.vercel.app`
- **API Docs:** `https://your-backend.railway.app/docs` (FastAPI auto-docs)
- **GitHub:** `https://github.com/grosz99/alter_yx`

## 📚 Additional Resources

- [Railway Documentation](https://docs.railway.app/)
- [Vercel Documentation](https://vercel.com/docs)
- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/)

---

**Questions?** Open an issue on [GitHub](https://github.com/grosz99/alter_yx/issues)

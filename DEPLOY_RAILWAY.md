# 🚂 Deploy Alter-thon to Railway (Recommended)

Railway is the recommended platform for deploying Alter-thon because it's free, simple, and has no authentication barriers like Vercel's team deployment protection.

## Why Railway?

- ✅ **Free tier** - No credit card required for hobby projects
- ✅ **No authentication issues** - Public by default
- ✅ **Python/FastAPI native support** - Auto-detects and configures
- ✅ **Automatic HTTPS** - SSL certificates handled automatically
- ✅ **GitHub integration** - Deploy directly from your repo
- ✅ **Easy environment variables** - Simple dashboard management
- ✅ **Automatic deployments** - Redeploys on git push

## 🚀 Step-by-Step Deployment

### Part 1: Deploy Backend to Railway

#### 1. Create Railway Account

1. Go to [railway.app](https://railway.app)
2. Click **"Start a New Project"**
3. Sign in with GitHub (recommended)

#### 2. Deploy Backend

1. Click **"Deploy from GitHub repo"**
2. Select your repository: `grosz99/alter_yx`
3. Railway will ask which directory to deploy:
   - Click **"Configure"**
   - Set **Root Directory** to: `api`
   - Click **"Deploy"**

#### 3. Configure Environment Variables

1. In your Railway project dashboard, click on your service
2. Go to **"Variables"** tab
3. Click **"New Variable"**
4. Add:
   ```
   ANTHROPIC_API_KEY=sk-ant-api03-your-key-here
   ```
5. Click **"Deploy"** to apply changes

#### 4. Get Your Backend URL

1. In your service dashboard, go to **"Settings"** tab
2. Scroll to **"Networking"** section
3. Click **"Generate Domain"**
4. Copy the generated URL (e.g., `https://alter-yx-production.up.railway.app`)

### Part 2: Deploy Frontend to Vercel

#### 1. Update Frontend Configuration

Update `.env.production` with your Railway backend URL:

```bash
cd frontend
echo "VITE_API_URL=https://your-railway-url.railway.app" > .env.production
```

#### 2. Deploy Frontend

```bash
cd frontend
npx vercel --prod
```

The frontend will deploy to Vercel without issues since it's a static site with no team protection.

### Part 3: Test Your Deployment

1. Visit your frontend URL (from Vercel)
2. Upload a CSV/Excel file
3. Enter a data transformation requirement
4. Click "Generate Script"
5. Verify the script generates successfully

## 🔧 Railway Configuration Files

The repository includes these Railway-specific files in `/api`:

- **`railway.json`** - Railway project configuration
- **`Procfile`** - Tells Railway how to start the app
- **`runtime.txt`** - Specifies Python version (3.12)
- **`requirements.txt`** - Python dependencies

## 🔄 Automatic Deployments

Railway automatically redeploys when you push to GitHub:

```bash
git add .
git commit -m "Update feature"
git push origin main
# Railway automatically redeploys!
```

## 📊 Monitoring & Logs

View logs in Railway dashboard:
1. Click on your service
2. Go to **"Deployments"** tab
3. Click on latest deployment
4. View **"Deploy Logs"** and **"Runtime Logs"**

## 💰 Railway Free Tier Limits

- **$5 free credit per month**
- **500 hours of execution time**
- **100GB bandwidth**

This is more than enough for a demo/portfolio project!

## 🆚 Railway vs Vercel Comparison

| Feature | Railway (Backend) | Vercel (Backend) |
|---------|------------------|------------------|
| Free Tier | ✅ $5/month credit | ✅ Generous free tier |
| Authentication | ✅ None by default | ❌ Team protection blocks access |
| Python Support | ✅ Native | ⚠️ Serverless functions only |
| Setup Complexity | ✅ Very simple | ⚠️ Requires Mangum adapter |
| CORS Issues | ✅ None | ⚠️ Requires edge config |
| Deployment Speed | ✅ ~2-3 minutes | ✅ ~1-2 minutes |

## 🐛 Troubleshooting

### Backend not starting?

Check Railway logs for errors:
- Missing `ANTHROPIC_API_KEY`?
- Python version mismatch?
- Port binding issues? (Railway auto-assigns `$PORT`)

### CORS errors?

The backend has CORS configured for `*` (all origins). If you see CORS errors:
1. Check that Railway service is running (green status)
2. Verify the frontend is using the correct Railway URL
3. Check browser console for the actual error

### Environment variable not updating?

After changing environment variables in Railway:
1. Click **"Deploy"** to trigger a new deployment
2. Wait for deployment to complete (~2-3 minutes)
3. Check logs to verify new value is loaded

## 🎯 Production Checklist

Before going live:

- [ ] Railway backend deployed and running
- [ ] `ANTHROPIC_API_KEY` configured in Railway
- [ ] Railway domain generated and copied
- [ ] Frontend `.env.production` updated with Railway URL
- [ ] Frontend deployed to Vercel
- [ ] End-to-end test successful (upload file, generate script)
- [ ] All secrets secured (no API keys in code)

## 📚 Additional Resources

- [Railway Documentation](https://docs.railway.app/)
- [FastAPI Deployment Guide](https://fastapi.tiangolo.com/deployment/)
- [Python on Railway](https://docs.railway.app/guides/python)

## 🔐 Security Notes

- Never commit `.env` files with real API keys
- Railway encrypts environment variables
- API keys are only visible to project members
- HTTPS is automatic for all Railway domains
- Consider adding rate limiting for production use

---

**Need help?** Check the [Railway Discord](https://discord.gg/railway) or [GitHub Issues](https://github.com/grosz99/alter_yx/issues)

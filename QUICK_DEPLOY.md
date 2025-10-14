# ⚡ Quick Deploy - Alter-thon

## 🎯 The Issue & Solution

**Problem:** Vercel team account has deployment protection → HTTP 401 blocks all API requests

**Solution:** Use Railway for backend (free, no auth) + Vercel for frontend

---

## 🚀 Deploy in 3 Steps (10 minutes)

### Step 1: Deploy Backend to Railway

1. **Go to:** [railway.app](https://railway.app)
2. **Click:** "Deploy from GitHub repo"
3. **Select:** `grosz99/alter_yx`
4. **Configure:**
   - Root directory: `api`
   - Click Deploy
5. **Add environment variable:**
   - Key: `ANTHROPIC_API_KEY`
   - Value: `sk-ant-api03-...` (your key)
6. **Generate domain:**
   - Settings → Networking → Generate Domain
   - Copy URL: `https://alter-yx-production.up.railway.app`

### Step 2: Update Frontend

```bash
cd frontend
echo "VITE_API_URL=https://your-railway-url.railway.app" > .env.production
```

### Step 3: Deploy Frontend

```bash
cd frontend
npx vercel --prod
```

---

## ✅ Done!

Your app is now live and shareable:
- **Frontend:** Your Vercel URL
- **Backend:** Your Railway URL
- **No authentication barriers!**

---

## 📚 Full Documentation

- [DEPLOY_RAILWAY.md](./DEPLOY_RAILWAY.md) - Detailed Railway guide
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Complete strategy & troubleshooting

## 🐛 Troubleshooting

**Backend not responding?**
- Check Railway dashboard (service should be green)
- Verify `ANTHROPIC_API_KEY` is set
- Check logs: Railway → Service → Deployments → Logs

**Frontend network error?**
- Verify `.env.production` has correct Railway URL
- Check browser console for actual error
- Test backend directly: `https://your-url.railway.app/api/health`

---

## 💡 Why Railway?

| Feature | Railway | Vercel (Current) |
|---------|---------|------------------|
| **Access** | ✅ Public | ❌ 401 Auth Block |
| **Setup** | ✅ 5 min | ❌ 30+ min troubleshooting |
| **Cost** | ✅ Free $5/mo | ✅ Free (but inaccessible) |
| **Python** | ✅ Native | ⚠️ Serverless only |
| **Share** | ✅ Works for everyone | ❌ Requires auth |

---

**Questions?** Check the full guides or open a [GitHub issue](https://github.com/grosz99/alter_yx/issues).

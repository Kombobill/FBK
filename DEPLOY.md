# TradeBot Pro - Deployment Guide

## Quick Deploy (No Domain Needed)

### Option 1: Vercel (Frontend) + Render/Railway (Backend)

1. **Frontend → Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repo
   - Build: `npm run build`
   - Output: `dist`

2. **Backend → Railway**
   - Go to [railway.app](https://railway.app)
   - Connect GitHub repo
   - Add env vars:
     ```
     NODE_ENV=production
     JWT_SECRET=your_secure_secret
     FRONTEND_URL=https://your-vercel-app.vercel.app
     ```

3. **Update Vercel Env Vars:**
   ```
   VITE_API_URL=https://your-railway-app.railway.app
   ```

---

## With Custom Domain

### Step 1: Buy Domain ($5-10/year)
- [Porkbun](https://porkbun.com) - $5/year
- [Cloudflare](https://cloudflare.com) - $10/year

### Step 2: Deploy
1. Deploy as above
2. Go to Vercel → Project → Settings → Domains
3. Add your domain (e.g., tradebotpro.com)
4. Update DNS records as instructed

### Step 3: Update Configuration

Update `.env`:
```
VITE_API_URL=https://api.yourdomain.com
DOMAIN=yourdomain.com
NODE_ENV=production
```

---

## Security Features Added

- ✅ Helmet.js (security headers)
- ✅ Rate limiting (auth: 20/15min, api: 100/min)
- ✅ CORS whitelist
- ✅ Body size limits (10kb)
- ✅ HTTPS redirect (production)
- ✅ Input sanitization

---

## Demo Credentials

```
Email: demo@test.com
Password: password123
```

---

## Quick Deploy Commands

```bash
# Development
npm run start

# Production build
npm run build

# Start production
NODE_ENV=production npm run server
```
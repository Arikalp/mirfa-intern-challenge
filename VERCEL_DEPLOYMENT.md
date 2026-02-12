# 🚀 Vercel Deployment Guide

This guide will help you deploy both the **Backend API** and **Frontend** to Vercel as separate projects.

## 📋 Prerequisites

Before deploying, ensure you have:

- ✅ **Vercel Account**: Sign up at [vercel.com](https://vercel.com) (free tier is fine)
- ✅ **GitHub Repository**: Your code pushed to GitHub
- ✅ **Vercel CLI** (optional but recommended): `npm install -g vercel`
- ✅ **Master Key Ready**: Your 64-character hex master key
- ✅ **Database URL**: Your Supabase PostgreSQL connection string

---

## 🎯 Part 1: Deploy Backend API

### Option A: Dashboard Deployment (Recommended for Beginners)

1. **Login to Vercel Dashboard**
   - Go to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click **"Add New Project"**

2. **Import Repository**
   - Select your GitHub repository: `Mirfa-IBC/mirfa-intern-challenge`
   - Click **"Import"**

3. **Configure Project**
   - **Project Name**: `mirfa-api` (or your choice)
   - **Framework Preset**: Other
   - **Root Directory**: Click **"Edit"** → Select `apps/api`
   - **Build Command**: `pnpm db:generate && pnpm build`
   - **Output Directory**: Leave empty
   - **Install Command**: `cd ../.. && pnpm install --filter=api...`

4. **Add Environment Variables**
   
   Click **"Environment Variables"** and add:
   
   | Name | Value | Environments |
   |------|-------|--------------|
   | `MASTER_KEY_HEX` | Your 64-char hex key | Production, Preview, Development |
   | `DATABASE_URL` | Your Supabase connection string | Production, Preview, Development |

   **Example Values:**
   ```
   MASTER_KEY_HEX=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
   DATABASE_URL=postgresql://postgres.mrpjuombdspzohukrsnd:f7C8lnqgbsuzadPY@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres
   ```

5. **Deploy**
   - Click **"Deploy"**
   - Wait for deployment to complete (2-3 minutes)
   - **Note your API URL**: `https://mirfa-api.vercel.app` (or similar)

### Option B: CLI Deployment (Faster for Experienced Users)

```bash
# Navigate to API directory
cd apps/api

# Login to Vercel (first time only)
vercel login

# Deploy
vercel

# Follow prompts:
# → Set up and deploy? Yes
# → Which scope? [Your account]
# → Link to existing project? No
# → What's your project's name? mirfa-api
# → In which directory is your code located? ./
# → Want to override the settings? No

# Add environment variables
vercel env add MASTER_KEY_HEX
# Paste: 0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
# Select: Production, Preview, Development (use spacebar to select, enter to confirm)

vercel env add DATABASE_URL
# Paste: postgresql://postgres.mrpjuombdspzohukrsnd:f7C8lnqgbsuzadPY@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres
# Select: Production, Preview, Development

# Deploy to production with environment variables
vercel --prod
```

### 6. **Test API Deployment**

```bash
# Replace with your actual API URL
API_URL="https://mirfa-api.vercel.app"

# Test health endpoint
curl $API_URL/health

# Expected response:
# {"status":"ok","database":"connected","timestamp":"..."}

# Test encrypt endpoint
curl -X POST $API_URL/tx/encrypt \
  -H "Content-Type: application/json" \
  -d '{"partyId":"party_test","payload":{"amount":100,"currency":"AED"}}'

# Expected response:
# {"id":"some-uuid","message":"Transaction encrypted and stored successfully"}
```

✅ **Save your API URL** - You'll need it for frontend deployment!

---

## 💻 Part 2: Deploy Frontend

### Step 1: Update Frontend Environment Variable

**Edit** `apps/web/.env.production` with your deployed API URL:

```env
NEXT_PUBLIC_API_URL=https://mirfa-api.vercel.app
```

Replace `https://mirfa-api.vercel.app` with your actual API URL from Part 1.

### Step 2: Commit Changes

```bash
git add apps/web/.env.production
git commit -m "Update production API URL"
git push
```

### Step 3: Deploy Frontend

#### Option A: Dashboard Deployment

1. **Go to Vercel Dashboard**
   - Click **"Add New Project"**

2. **Import Repository**
   - Select the same repository: `Mirfa-IBC/mirfa-intern-challenge`

3. **Configure Project**
   - **Project Name**: `mirfa-transaction-app` (or your choice)
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: Click **"Edit"** → Select `apps/web`
   - **Build Command**: `cd ../.. && pnpm build --filter=web`
   - **Output Directory**: `.next`
   - **Install Command**: `cd ../.. && pnpm install --filter=web...`

4. **Add Environment Variable**
   
   Click **"Environment Variables"** and add:
   
   | Name | Value | Environments |
   |------|-------|--------------|
   | `NEXT_PUBLIC_API_URL` | Your API URL from Part 1 | Production, Preview, Development |

   **Example:**
   ```
   NEXT_PUBLIC_API_URL=https://mirfa-api.vercel.app
   ```

5. **Deploy**
   - Click **"Deploy"**
   - Wait for deployment to complete
   - **Note your Frontend URL**: `https://mirfa-transaction-app.vercel.app` (or similar)

#### Option B: CLI Deployment

```bash
# Navigate to web directory
cd apps/web

# Ensure .env.production has your API URL
cat .env.production
# Should show: NEXT_PUBLIC_API_URL=https://mirfa-api.vercel.app

# Deploy
vercel

# Follow prompts:
# → Set up and deploy? Yes
# → Which scope? [Your account]
# → Link to existing project? No
# → What's your project's name? mirfa-transaction-app
# → In which directory is your code located? ./
# → Want to override the settings? No

# The environment variable from .env.production will be automatically picked up

# Deploy to production
vercel --prod
```

### Step 4: Test Frontend Deployment

1. Visit your frontend URL in a browser
2. **Test Encryption**:
   - Enter Party ID: `party_test_123`
   - Enter Payload (JSON):
     ```json
     {
       "amount": 500,
       "currency": "USD"
     }
     ```
   - Click **"Encrypt & Save Transaction"**
   - Should see success message with transaction ID

3. **Test Decryption**:
   - Copy the transaction ID
   - Paste in "Transaction ID" field
   - Click **"Fetch Encrypted Record"**
   - Click **"Decrypt Transaction"**
   - Should see original payload decrypted

---

## ✅ Deployment Checklist

### Backend API
- [ ] API deployed to Vercel
- [ ] `MASTER_KEY_HEX` environment variable set
- [ ] `DATABASE_URL` environment variable set
- [ ] Health endpoint returns `{"status":"ok","database":"connected"}`
- [ ] Can create encrypted transaction via API
- [ ] API URL noted and saved

### Frontend
- [ ] Frontend deployed to Vercel
- [ ] `NEXT_PUBLIC_API_URL` set to deployed API URL
- [ ] Can load frontend in browser
- [ ] Can encrypt transaction from UI
- [ ] Can fetch encrypted record from UI
- [ ] Can decrypt transaction from UI
- [ ] Frontend URL noted and saved

---

## 🐛 Troubleshooting

### API Issues

**Problem**: Build fails with "Cannot find module '@prisma/client'"

**Solution**: Ensure `vercel-build` script runs `prisma generate`:
```json
"vercel-build": "prisma generate && tsc"
```

**Problem**: Database connection fails

**Solution**: 
- Check `DATABASE_URL` is set correctly in Vercel environment variables
- Use **session pooler** (port 5432) not transaction pooler
- Verify Supabase allows connections from all IPs (0.0.0.0/0)

**Problem**: "MASTER_KEY_HEX environment variable is missing"

**Solution**: 
- Go to Vercel Dashboard → Project Settings → Environment Variables
- Add `MASTER_KEY_HEX` with exact 64-character hex value
- Redeploy: Deployments → Three dots → Redeploy

### Frontend Issues

**Problem**: "Failed to fetch" or CORS errors

**Solution**:
- Verify `NEXT_PUBLIC_API_URL` in environment variables
- Check API CORS is enabled (it should be in our code)
- Ensure API URL doesn't have trailing slash

**Problem**: Environment variable not updating

**Solution**:
- Environment variables require **redeployment**
- Dashboard: Deployments → Three dots → Redeploy
- CLI: `vercel --prod`

**Problem**: 404 on API routes

**Solution**:
- Check `vercel.json` rewrites configuration
- Ensure `api/index.ts` exists and exports default handler

---

## 📝 Important Notes

### Environment Variables
- **Must use `NEXT_PUBLIC_` prefix** for client-side variables in Next.js
- Environment changes require redeployment to take effect
- Never commit `.env` files with real secrets to Git

### Database
- Use **session pooler** (port 5432) for Prisma
- Ensure connection pooling is enabled in Supabase
- Monitor connection limits in Supabase dashboard

### Monorepo Considerations
- Vercel detects monorepo structure automatically
- Each project should specify its root directory
- Install commands must run from workspace root

---

## 🎓 Submission URLs

After successful deployment, you'll have:

1. **Backend API**: `https://mirfa-api.vercel.app`
2. **Frontend**: `https://mirfa-transaction-app.vercel.app`

Include both URLs in your internship submission!

---

## 🔗 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Deploying Monorepos](https://vercel.com/docs/monorepos)
- [Environment Variables Guide](https://vercel.com/docs/environment-variables)
- [Prisma on Vercel](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel)

---

## 💡 Pro Tips

1. **Use Preview Deployments**: Every PR gets a unique preview URL
2. **Monitor Logs**: Check function logs in Vercel dashboard for debugging
3. **Set Up Domains**: Add custom domains in project settings
4. **Enable Analytics**: Free analytics available in Vercel dashboard
5. **Configure Alerts**: Set up deployment notifications in Slack/Discord

---

**Need help?** Check the Vercel dashboard logs or create an issue in the challenge repository!

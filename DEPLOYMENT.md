# 🚀 Vercel Deployment Guide

## Prerequisites

- GitHub repository with this code
- Vercel account (free tier is fine)
- pnpm installed locally

## Step 1: Deploy API Backend

### Option A: Vercel Serverless Functions (Recommended for Demo)

Since Fastify needs a persistent server, we'll deploy it as a serverless function:

1. Create `apps/api/vercel.json`:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "dist/index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "dist/index.js"
    }
  ]
}
```

2. Update `apps/api/package.json` scripts:

```json
{
  "scripts": {
    "vercel-build": "npm run build"
  }
}
```

3. Deploy API:

```bash
cd apps/api
vercel
```

4. Set environment variables in Vercel dashboard:
   - `MASTER_KEY_HEX` - Your 64-character hex key

### Option B: Other Hosting Services

For a persistent Fastify server, consider:
- **Railway**: One-click deploy from GitHub
- **Render**: Free tier with persistent processes
- **Fly.io**: Deploy Docker containers

## Step 2: Deploy Next.js Frontend

1. In Vercel dashboard, import your GitHub repository
2. Select `apps/web/my-app` as the root directory
3. Set framework preset to "Next.js"
4. Set environment variables:
   - `NEXT_PUBLIC_API_URL` - Your deployed API URL (from Step 1)
5. Deploy!

## Step 3: Update Environment Variables

After deployment, update your frontend environment variable:

```env
NEXT_PUBLIC_API_URL=https://your-api.vercel.app
```

Then redeploy the frontend.

## 🔧 Vercel Configuration Files

### For API (apps/api/vercel.json)

Create this file if deploying Fastify to Vercel:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "dist/index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "dist/index.js"
    }
  ],
  "env": {
    "MASTER_KEY_HEX": "@master-key-hex"
  }
}
```

### For Web (apps/web/my-app/vercel.json)

Usually not needed as Next.js is auto-detected, but you can add:

```json
{
  "buildCommand": "pnpm build",
  "outputDirectory": ".next"
}
```

## 🌐 Alternative: Deploy as Monorepo

Vercel supports TurboRepo monorepos:

1. Import your repository
2. Vercel will detect TurboRepo
3. Select the app to deploy (web or api)
4. Set build settings:
   - **Build Command**: `pnpm build`
   - **Root Directory**: `apps/web/my-app` (for frontend)
5. Set environment variables

## 📝 Important Notes

1. **Master Key Security**: 
   - Never commit `.env` files
   - Use Vercel's environment variable system
   - Consider using Vercel's secret storage

2. **CORS Configuration**:
   - API must allow requests from your frontend domain
   - Update CORS settings in `apps/api/src/index.ts` if needed

3. **API Rate Limits**:
   - Consider adding rate limiting for production
   - Vercel free tier has function execution limits

4. **Database**:
   - Current implementation uses in-memory storage
   - For production, integrate PostgreSQL/Redis
   - Vercel offers database add-ons

## 🚨 Troubleshooting

### API not responding
- Check Vercel function logs
- Ensure `MASTER_KEY_HEX` is set
- Verify build was successful

### Frontend can't reach API
- Check `NEXT_PUBLIC_API_URL` is correct
- Ensure CORS is configured
- Check network tab for errors

### Build failures
- Run `pnpm build` locally first
- Check Node.js version compatibility
- Verify all dependencies are in package.json

## 📚 Resources

- [Vercel TurboRepo Guide](https://vercel.com/docs/monorepos/turborepo)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

---

Happy deploying! 🎉

# Deployment Guide

This guide explains how to deploy the Finance Research Bee application with the frontend on Vercel and the backend on Railway.

## Architecture Overview

- **Frontend**: React + Vite application deployed on Vercel
- **Backend**: Node.js + Express API deployed on Railway
- **Database**: MySQL (can be hosted on Railway, PlanetScale, or any MySQL provider)

---

## Frontend Deployment (Vercel)

### Prerequisites

- Vercel account ([vercel.com](https://vercel.com))
- GitHub repository connected to Vercel

### Steps

1. **Navigate to Frontend Directory**

   ```bash
   cd frontend
   ```

2. **Install Dependencies**

   ```bash
   pnpm install
   ```

3. **Configure Environment Variables**

   Create a `.env` file based on `.env.example`:

   ```env
   VITE_API_URL=https://your-backend-url.railway.app
   ```

   For local development:

   ```env
   VITE_API_URL=http://localhost:3001
   ```

4. **Deploy to Vercel**

   **Option A: Using Vercel CLI**

   ```bash
   npm i -g vercel
   vercel
   ```

   **Option B: Using Vercel Dashboard**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your repository
   - Set **Root Directory** to `frontend`
   - Add environment variable: `VITE_API_URL`
   - Deploy

5. **Configure Environment Variables in Vercel Dashboard**
   - Go to Project Settings → Environment Variables
   - Add: `VITE_API_URL` = `https://your-backend-url.railway.app`

---

## Backend Deployment (Railway)

### Prerequisites

- Railway account ([railway.app](https://railway.app))
- GitHub repository connected to Railway

### Steps

1. **Navigate to Backend Directory**

   ```bash
   cd backend
   ```

2. **Install Dependencies**

   ```bash
   pnpm install
   ```

3. **Deploy to Railway**

   **Option A: Using Railway CLI**

   ```bash
   npm i -g @railway/cli
   railway login
   railway init
   railway up
   ```

   **Option B: Using Railway Dashboard**
   - Go to [railway.app/new](https://railway.app/new)
   - Select "Deploy from GitHub repo"
   - Choose your repository
   - Set **Root Directory** to `backend`
   - Railway will auto-detect the build configuration

4. **Add MySQL Database**
   - In Railway dashboard, click "New" → "Database" → "Add MySQL"
   - Railway will automatically create a `DATABASE_URL` environment variable

5. **Configure Environment Variables**

   In Railway dashboard, add these variables:

   ```env
   DATABASE_URL=<automatically set by Railway MySQL>
   JWT_SECRET=<generate using: openssl rand -base64 32>
   PERPLEXITY_API_KEY=<your perplexity api key>
   PORT=3001
   NODE_ENV=production
   CORS_ORIGIN=https://your-frontend-url.vercel.app
   ```

6. **Run Database Migrations**

   After deployment, run migrations using Railway CLI:

   ```bash
   railway run pnpm run db:push
   ```

7. **Get Your Backend URL**
   - Railway will provide a public URL like `https://your-app.railway.app`
   - Use this URL in your frontend's `VITE_API_URL`

---

## Update Frontend with Backend URL

After deploying the backend:

1. Copy your Railway backend URL
2. Go to Vercel dashboard → Your Project → Settings → Environment Variables
3. Update `VITE_API_URL` with your Railway URL
4. Redeploy the frontend (Vercel will auto-redeploy on the next commit)

---

## Environment Variables Summary

### Frontend (.env)

```env
VITE_API_URL=https://your-backend-url.railway.app
```

### Backend (.env)

```env
DATABASE_URL=mysql://user:password@host:port/database
JWT_SECRET=your_generated_secret_string_here
PERPLEXITY_API_KEY=pplx-xxxxxxxxxxxxxxxxxxxxxxxx
PORT=3001
NODE_ENV=production
CORS_ORIGIN=https://your-frontend-url.vercel.app
```

---

## Local Development

### Frontend

```bash
cd frontend
pnpm install
pnpm run dev
# Runs on http://localhost:9999
```

### Backend

```bash
cd backend
pnpm install
cp .env.example .env
# Edit .env with your local database credentials
pnpm run dev
# Runs on http://localhost:3001
```

---

## Troubleshooting

### CORS Errors

- Ensure `CORS_ORIGIN` in backend matches your frontend URL
- Check that the backend is properly setting CORS headers

### Database Connection Issues

- Verify `DATABASE_URL` is correctly set in Railway
- Ensure database migrations have been run
- Check Railway logs for connection errors

### Build Failures

- Check Railway/Vercel build logs
- Ensure all dependencies are listed in package.json
- Verify TypeScript compilation with `pnpm run check`

### API Not Responding

- Check Railway deployment logs
- Verify the backend is running on the correct PORT (3001)
- Test the health endpoint: `https://your-backend-url.railway.app/api/health`

---

## Monitoring

- **Vercel**: View deployment logs and analytics in Vercel dashboard
- **Railway**: View application logs and metrics in Railway dashboard
- **Database**: Monitor database performance in Railway's MySQL dashboard

---

## Continuous Deployment

Both Vercel and Railway support automatic deployments:

- **Vercel**: Auto-deploys on push to main branch (frontend changes)
- **Railway**: Auto-deploys on push to main branch (backend changes)

Configure branch protection and deployment settings in each platform's dashboard.

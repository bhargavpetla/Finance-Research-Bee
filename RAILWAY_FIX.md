# Railway Deployment Fix

## Issue
Railway build was failing with error: `pnpm: command not found`

## Root Cause
The `railway.json` configuration was using `pnpm` commands, but Railway's Nixpacks builder was using Node.js 18 which doesn't include pnpm by default.

## Solution
Updated backend configuration to use `npm` instead of `pnpm`:

### Files Changed

1. **backend/railway.json**
   - Changed `buildCommand` from `pnpm install && pnpm run build` to `npm install && npm run build`
   - Changed `startCommand` from `pnpm start` to `npm start`

2. **backend/README.md**
   - Updated all command examples to use `npm` instead of `pnpm`

## Next Steps

1. **Commit and push the changes:**
   ```bash
   git add backend/railway.json backend/README.md backend/src/_core/index.ts
   git commit -m "Fix: Railway deployment - use npm and bind to 0.0.0.0"
   git push
   ```

2. **Redeploy on Railway:**
   - Railway should automatically detect the push and trigger a new build
   - The build should now succeed with npm
   - The server will now be accessible on all network interfaces

3. **Verify deployment:**
   - Check Railway logs to ensure build completes successfully
   - Test the health endpoint: `https://your-backend-url.railway.app/api/health`

## Additional Fix Applied

### Health Check Failure
After the build succeeded, health checks were failing because the server was binding to `localhost` only.

**Solution**: Updated `backend/src/_core/index.ts` to bind to `0.0.0.0`:
```typescript
server.listen(port, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${port}/`);
});
```

This allows Railway's health check system to access the `/api/health` endpoint.

## Note
The frontend can still use npm or pnpm locally - this change only affects the Railway backend deployment.

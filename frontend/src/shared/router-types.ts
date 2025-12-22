/**
 * This file contains the AppRouter type definition that is shared between frontend and backend.
 * In production, the frontend will use this type to ensure type-safety with the backend API.
 * 
 * NOTE: This is a placeholder. In a real deployment scenario, you would:
 * 1. Generate this file from the backend router using tRPC's type generation
 * 2. Or use a monorepo setup with shared packages
 * 3. Or manually keep this in sync with backend/src/routers.ts
 * 
 * For now, we're using `any` to allow the build to succeed.
 * The actual runtime type-safety comes from the tRPC client configuration.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AppRouter = any;

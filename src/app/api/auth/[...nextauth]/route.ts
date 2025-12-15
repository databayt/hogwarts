/**
 * NextAuth Route Handler - OAuth Entry Point
 *
 * Exports NextAuth HTTP handlers for authentication flows.
 *
 * WHY RE-EXPORT FROM @/auth:
 * - NextAuth v5 pattern: handlers defined once, exported here
 * - Main auth logic in src/auth.ts (callbacks, providers)
 * - This file just exposes GET/POST to the route
 *
 * ROUTES HANDLED:
 * - GET /api/auth/signin - Sign-in page
 * - GET /api/auth/signout - Sign-out page
 * - GET /api/auth/callback/:provider - OAuth callbacks
 * - GET /api/auth/session - Session endpoint
 * - POST /api/auth/signin/:provider - Initiate OAuth
 * - POST /api/auth/signout - Process sign-out
 * - POST /api/auth/callback/credentials - Credentials auth
 *
 * WHY [...nextauth] CATCH-ALL:
 * - Single route handles all auth paths
 * - NextAuth routes internally by path segment
 * - Simplifies routing configuration
 *
 * @see src/auth.ts for full authentication configuration
 * @see src/auth.config.ts for callbacks and session handling
 */

import { GET, POST } from "@/auth"

export { GET, POST }

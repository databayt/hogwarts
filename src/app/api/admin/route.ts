/**
 * Admin Access Verification API
 *
 * Simple endpoint to verify admin permissions.
 *
 * USE CASES:
 * - Client-side permission check before showing admin UI
 * - Preflight request before admin operations
 * - Health check for admin functionality
 *
 * ACCESS CONTROL:
 * - ADMIN or DEVELOPER role required
 * - Rate limited (ADMIN tier)
 *
 * WHY RATE LIMIT ADMIN ENDPOINTS:
 * - Prevents brute-force permission testing
 * - Reduces load from automated probes
 * - Logs suspicious access patterns
 *
 * WHY SEPARATE FROM /health:
 * - Health is public (for load balancers)
 * - This requires authentication
 * - Different rate limit tiers
 *
 * RESPONSE:
 * - 200: Admin access confirmed
 * - 403: Insufficient permissions
 * - 429: Rate limit exceeded
 *
 * @see /lib/auth-security.ts for requireRole implementation
 */

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth-security";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting for admin endpoints
    const rateLimitResponse = await rateLimit(request, RATE_LIMITS.ADMIN, 'admin');
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Only allow ADMIN and DEVELOPER roles
    await requireRole("ADMIN", "DEVELOPER");

    return NextResponse.json({ message: "Admin access granted" }, { status: 200 });
  } catch (error) {
    console.error("Admin endpoint access denied:", error);
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
}

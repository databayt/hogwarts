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

import "server-only";
import { auth } from "@/auth";
import { cookies, headers } from "next/headers";
import type { UserRole } from "@prisma/client";
import { db } from "@/lib/db";

// Extended user type that includes the properties added by our auth callbacks
type ExtendedUser = {
  id: string;
  email?: string | null;
  role?: string;
  schoolId?: string | null;
};

// Extended session type
type ExtendedSession = {
  user: ExtendedUser;
};

export type TenantContext = {
  schoolId: string | null;
  requestId: string | null;
  role: UserRole | null;
  isPlatformAdmin: boolean;
};

export async function getTenantContext(): Promise<TenantContext> {
  const session = await auth() as ExtendedSession | null;
  const cookieStore = await cookies();
  const hdrs = await headers();
  // 1) Impersonation cookie overrides
  const impersonatedSchoolId = cookieStore.get("impersonate_schoolId")?.value ?? null;
  // 2) Header from middleware carries subdomain; resolve to schoolId
  let headerSchoolId: string | null = null;
  const subdomain = hdrs.get("x-subdomain");
  if (subdomain) {
    try {
      const school = await db.school.findUnique({ where: { domain: subdomain } });
      headerSchoolId = school?.id ?? null;
    } catch (error) {
      console.error("[getTenantContext] Failed to resolve subdomain:", subdomain, error);
      headerSchoolId = null;
    }
  }
  const schoolId = impersonatedSchoolId ?? headerSchoolId ?? session?.user?.schoolId ?? null;
  const role = (session?.user?.role as UserRole | undefined) ?? null;
  const isPlatformAdmin = role === "DEVELOPER";
  const requestId = null;
  return { schoolId, requestId, role, isPlatformAdmin };
}
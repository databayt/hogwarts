import "server-only";
import { auth } from "@/auth";
import { cookies, headers } from "next/headers";
import type { UserRole } from "@prisma/client";
import { db } from "@/lib/db";

export type TenantContext = {
  schoolId: string | null;
  requestId: string | null;
  role: UserRole | null;
  isPlatformAdmin: boolean;
};

export async function getTenantContext(): Promise<TenantContext> {
  const session = await auth();
  const cookieStore = await cookies();
  const hdrs = await headers();
  // 1) Impersonation cookie overrides
  const impersonatedSchoolId = cookieStore.get("impersonate_schoolId")?.value ?? null;
  // 2) Header from middleware carries subdomain; resolve to schoolId
  let headerSchoolId: string | null = null;
  const subdomain = hdrs.get("x-subdomain");
  if (subdomain) {
    const school = await db.school.findUnique({ where: { domain: subdomain } });
    headerSchoolId = school?.id ?? null;
  }
  const schoolId = impersonatedSchoolId ?? headerSchoolId ?? session?.user?.schoolId ?? null;
  const role = (session?.user?.role as UserRole | undefined) ?? null;
  const isPlatformAdmin = role === "DEVELOPER";
  const requestId = null;
  return { schoolId, requestId, role, isPlatformAdmin };
}



"use server";
import { cookies, headers } from "next/headers";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function startImpersonation(targetSchoolId: string, reason?: string) {
  const session = await auth();
  if (!session || session.user.role !== "DEVELOPER") {
    throw new Error("Forbidden");
  }
  const cookieStore = await cookies();
  // 30-minute expiry
  const expires = new Date(Date.now() + 30 * 60 * 1000);
  cookieStore.set("impersonate_schoolId", targetSchoolId, { path: "/", httpOnly: true, expires });
  cookieStore.set("impersonate_expires", String(expires.getTime()), { path: "/", httpOnly: false, expires });

  // Attach hint for UI: school name/domain for banner
  try {
    const school = await db.school.findUnique({ where: { id: targetSchoolId }, select: { name: true, domain: true } });
    cookieStore.set("impersonate_hint", JSON.stringify({ name: school?.name, domain: school?.domain }), { path: "/", httpOnly: false, expires });
  } catch {}

  const ip = (await headers()).get("x-forwarded-for") ?? null;
  const userAgent = (await headers()).get("user-agent") ?? null;
  await db.auditLog.create({
    data: {
      userId: session.user.id,
      schoolId: targetSchoolId,
      action: "IMPERSONATION_START",
      reason,
      ip: ip ?? undefined,
      userAgent: userAgent ?? undefined,
    },
  });
  revalidatePath("/operator/tenants");
}



"use server";
import { cookies, headers } from "next/headers";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function stopImpersonation(reason?: string) {
  const session = await auth();
  if (!session || session.user.role !== "DEVELOPER") {
    throw new Error("Forbidden");
  }
  const cookieStore = await cookies();
  const schoolId = cookieStore.get("impersonate_schoolId")?.value ?? null;
  cookieStore.delete("impersonate_schoolId");

  const ip = (await headers()).get("x-forwarded-for") ?? null;
  const userAgent = (await headers()).get("user-agent") ?? null;
  await db.auditLog.create({
    data: {
      userId: session.user.id,
      schoolId: schoolId ?? undefined,
      action: "IMPERSONATION_STOP",
      reason,
      ip: ip ?? undefined,
      userAgent: userAgent ?? undefined,
    },
  });
  revalidatePath("/operator/tenants");
}



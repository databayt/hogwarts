"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { auth } from "@/auth"

import { db } from "@/lib/db"

const TEXT = {
  ar: "{name} ما قدر يثبّت التطبيق ودخل من المتصفح اليوم",
  en: "{name} could not install the app and used the browser today",
}
const TITLE = { ar: "دخول من المتصفح", en: "Browser sign-in" }

/**
 * Someone chose "I could not install the app" and was let into the browser
 * for the rest of the school day. Tell the school's ADMINs and, for a
 * student, the homeroom teacher of the student's section. No session (not
 * signed in yet): nothing to record. Never throws — the cookie is what lets
 * the person in; this is only the paper trail.
 */
export async function reportWebFallback(
  lang: string
): Promise<{ notified: number }> {
  try {
    const session = await auth()
    const user = session?.user
    const schoolId = user?.schoolId
    if (!user?.id || !schoolId) return { notified: 0 }

    const l = lang === "en" ? "en" : "ar"
    const name = user.name || user.email || ""

    const recipients = new Set<string>()
    const admins = await db.user.findMany({
      where: { schoolId, role: "ADMIN" },
      select: { id: true },
    })
    admins.forEach((a) => recipients.add(a.id))

    const student = await db.student.findFirst({
      where: { userId: user.id, schoolId },
      select: { section: { select: { homeroomTeacher: { select: { userId: true } } } } },
    })
    const homeroom = student?.section?.homeroomTeacher?.userId
    if (homeroom) recipients.add(homeroom)
    recipients.delete(user.id)
    if (recipients.size === 0) return { notified: 0 }

    const body = TEXT[l].replace("{name}", name)
    await db.notification.createMany({
      data: [...recipients].map((userId) => ({
        schoolId,
        userId,
        type: "system_alert" as const,
        priority: "normal" as const,
        title: TITLE[l],
        body,
        actorId: user.id,
        channels: ["in_app", "push"] as ("in_app" | "push")[],
        metadata: { kind: "android_web_fallback", userId: user.id },
      })),
    })
    return { notified: recipients.size }
  } catch (error) {
    console.error("[reportWebFallback]", error)
    return { notified: 0 }
  }
}

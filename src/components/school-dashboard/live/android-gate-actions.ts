"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { auth } from "@/auth"

import {
  HANDOFF_MAX_LIVE,
  HANDOFF_TTL_MS,
  handoffIdentifier,
  hashHandoffCode,
  newHandoffCode,
} from "@/lib/app-handoff"
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

/**
 * A signed-in web session mints a 60-second, single-use code the app trades
 * for tokens (POST /api/mobile/auth/handoff). Only the hash is stored.
 * Returns null when not signed in or on any failure — the caller then opens
 * the app without a code.
 */
export async function createAppHandoffCode(): Promise<{ code: string } | null> {
  try {
    const session = await auth()
    const userId = session?.user?.id
    const schoolId = session?.user?.schoolId
    if (!userId || !schoolId) return null

    const identifier = handoffIdentifier(userId, schoolId)
    const now = new Date()
    await db.verificationToken.deleteMany({
      where: { email: identifier, expires: { lte: now } },
    })
    const live = await db.verificationToken.count({
      where: { email: identifier, expires: { gt: now } },
    })
    if (live >= HANDOFF_MAX_LIVE) return null

    const code = newHandoffCode()
    await db.verificationToken.create({
      data: {
        email: identifier,
        token: hashHandoffCode(code),
        expires: new Date(now.getTime() + HANDOFF_TTL_MS),
      },
    })
    return { code }
  } catch (error) {
    console.error("[createAppHandoffCode]", error)
    return null
  }
}

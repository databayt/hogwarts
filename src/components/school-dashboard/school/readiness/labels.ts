// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Reason-code labels — the one place a readiness reason becomes words. Pure and
 * client-safe (no db, no server-only) so the dashboard card, the class report,
 * the WhatsApp text and the membership lane all import the same strings.
 */

import type { ReadinessLevel, ReadinessReason } from "./rules"

export type ReadinessLang = "ar" | "en"

type Label = { emoji: string; text: string }

const LABELS: Record<ReadinessLang, Record<ReadinessReason, Label>> = {
  ar: {
    on_app: { emoji: "✅", text: "التطبيق" },
    allowed_web: { emoji: "🖥️", text: "كمبيوتر/آيفون" },
    android_web: { emoji: "⚠️", text: "متصفح الأندرويد" },
    old_app: { emoji: "⚠️", text: "تطبيق قديم" },
    password_trouble: { emoji: "🔑", text: "بيغلط في كلمة المرور" },
    never_signed_in: { emoji: "❌", text: "ما سجّل دخول" },
    no_class_recent: { emoji: "❌", text: "ما بيدخل الحصص" },
    push_off: { emoji: "🔕", text: "الإشعارات مقفولة" },
  },
  en: {
    on_app: { emoji: "✅", text: "On the app" },
    allowed_web: { emoji: "🖥️", text: "Computer/iPhone" },
    android_web: { emoji: "⚠️", text: "Android browser" },
    old_app: { emoji: "⚠️", text: "Old app" },
    password_trouble: { emoji: "🔑", text: "Struggling with password" },
    never_signed_in: { emoji: "❌", text: "Never signed in" },
    no_class_recent: { emoji: "❌", text: "Not joining classes" },
    push_off: { emoji: "🔕", text: "Notifications off" },
  },
}

export function asReadinessLang(lang: string | null | undefined): ReadinessLang {
  return lang === "en" ? "en" : "ar"
}

/** The words for a reason code, without the emoji ("التطبيق"). */
export function reasonText(code: ReadinessReason, lang: string): string {
  return LABELS[asReadinessLang(lang)][code].text
}

/** The emoji for a reason code. */
export function reasonEmoji(code: ReadinessReason): string {
  return LABELS.ar[code].emoji
}

/** Emoji + words ("✅ التطبيق") — the chip and WhatsApp form. */
export function reasonChip(code: ReadinessReason, lang: string): string {
  const l = LABELS[asReadinessLang(lang)][code]
  return `${l.emoji} ${l.text}`
}

/** Chips joined for a line of text; "—" when there is nothing to say. */
export function reasonChips(
  reasons: ReadinessReason[],
  lang: string,
  sep = " · "
): string {
  return reasons.length ? reasons.map((r) => reasonChip(r, lang)).join(sep) : "—"
}

/** Chip colour family by what the code means. */
export function reasonTone(code: ReadinessReason): ReadinessLevel {
  switch (code) {
    case "never_signed_in":
    case "no_class_recent":
    case "password_trouble":
      return "bad"
    case "android_web":
    case "old_app":
    case "push_off":
      return "warn"
    default:
      return "ok"
  }
}

/** The reasons worth telling an admin about (info codes dropped). */
export function problemReasons(reasons: ReadinessReason[]): ReadinessReason[] {
  return reasons.filter((r) => reasonTone(r) !== "ok")
}

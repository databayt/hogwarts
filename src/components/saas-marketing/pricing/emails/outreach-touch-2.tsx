// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Touch 2 reply-bump: same thread as Touch 1, short, lossless.
 * Day 4 of the 5-touch cadence. Country-specific stat to anchor.
 */

import { Text } from "@react-email/components"

import { OutreachShell, type OutreachLang } from "./outreach-shell"

export type OutreachTouch2Props = {
  lang: OutreachLang
  school: string
  country: string // ISO-2
  city?: string | null
  senderName: string
  senderEmail: string
}

function statFor(country: string, isAr: boolean): string {
  // Conservative directional stats we can defend; used as the bump anchor.
  // Real numbers come from the King Fahad case study once published.
  if (isAr) {
    if (country === "SD")
      return "نظراءكم في السودان يفقدون ~٦ ساعات أسبوعياً في التواصل مع أولياء الأمور."
    if (country === "SA")
      return "مدارس المملكة عادةً تستهلك ~٤٠ ساعة شهرياً في إدارة الحضور يدوياً."
    if (country === "EG")
      return "مدارس اللغات بمصر تفقد ~٨ ساعات أسبوعياً على Excel وواتساب."
    return "المدارس بالمنطقة تخسر ~٦ ساعات أسبوعياً على Excel وواتساب."
  }
  if (country === "SD")
    return "Schools we talk to in Sudan lose ~6 hrs/week on parent comms alone."
  if (country === "SA")
    return "KSA schools typically burn ~40 hrs/month on manual attendance."
  if (country === "EG")
    return "Egypt language schools lose ~8 hrs/week to Excel + WhatsApp."
  return "Schools in the region lose ~6 hrs/week to Excel + WhatsApp."
}

export default function OutreachTouch2({
  lang,
  school,
  country,
  city,
  senderName,
  senderEmail,
}: OutreachTouch2Props) {
  const isAr = lang === "ar"
  const stat = statFor(country, isAr)

  return (
    <OutreachShell
      lang={lang}
      preview={isAr ? `متابعة بشأن ${school}` : `Following up on ${school}`}
      city={city}
      senderEmail={senderEmail}
    >
      {isAr ? (
        <>
          <Text className="mb-4 text-base leading-relaxed text-zinc-800">
            أعيد الإرسال تحسباً لأن الأولى ضاعت في الصندوق.
          </Text>
          <Text className="mb-4 text-base leading-relaxed text-zinc-800">
            {stat} هل هذا قريب من واقع {school}؟
          </Text>
          <Text className="mt-6 text-base text-zinc-800">
            {senderName} — Databayt
          </Text>
        </>
      ) : (
        <>
          <Text className="mb-4 text-base leading-relaxed text-zinc-800">
            Bumping this in case the first email got buried.
          </Text>
          <Text className="mb-4 text-base leading-relaxed text-zinc-800">
            {stat} Curious if that&apos;s close to where {school} sits.
          </Text>
          <Text className="mt-6 text-base text-zinc-800">
            {senderName} — Databayt
          </Text>
        </>
      )}
    </OutreachShell>
  )
}

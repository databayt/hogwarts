// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Touch 4 demo ask: 15-min slot with scarcity framing.
 * Day 14 of the 5-touch cadence. New subject thread.
 */

import { Link, Section, Text } from "@react-email/components"

import { OutreachShell, type OutreachLang } from "./outreach-shell"

export type OutreachTouch4Props = {
  lang: OutreachLang
  school: string
  city?: string | null
  calLink: string
  seatsRemaining?: number // unused since the MENA-10 cohort ended (2026-11-08)
  senderName: string
  senderEmail: string
}

export default function OutreachTouch4({
  lang,
  school,
  city,
  calLink,
  senderName,
  senderEmail,
}: OutreachTouch4Props) {
  const isAr = lang === "ar"

  return (
    <OutreachShell
      lang={lang}
      preview={
        isAr
          ? `هل أحجز لكم عرضاً ١٥ دقيقة هذا الأسبوع؟`
          : `15-min demo this week?`
      }
      city={city}
      senderEmail={senderEmail}
    >
      {isAr ? (
        <>
          <Text className="mb-4 text-base leading-relaxed text-zinc-800">
            مساء الخير — أعود إليكم بسؤال محدد.
          </Text>
          <Text className="mb-4 text-base leading-relaxed text-zinc-800">
            شهركم الأول مجاني: عنوان خاص بـ {school}، نجهّز المدرسة معكم، ودعم
            أسبوعي. بعده كل طالب بـ24 ريالًا في السنة.
          </Text>
          <Text className="mb-4 text-base leading-relaxed text-zinc-800">
            هل أحجز لكم ١٥ دقيقة هذا الأسبوع؟
          </Text>
        </>
      ) : (
        <>
          <Text className="mb-4 text-base leading-relaxed text-zinc-800">
            Quick one — coming back with a direct ask.
          </Text>
          <Text className="mb-4 text-base leading-relaxed text-zinc-800">
            Your first month is free: your own {school} address, set up with
            you, with weekly support. After it, every student is 24 SAR a year.
          </Text>
          <Text className="mb-4 text-base leading-relaxed text-zinc-800">
            Open to a 15-min demo this week?
          </Text>
        </>
      )}

      <Section className="mb-4">
        <Link href={calLink} className="text-base text-blue-700 underline">
          {isAr ? "احجز موعد ١٥ دقيقة" : "Book a 15-min slot"} →
        </Link>
      </Section>

      <Text className="mt-6 text-base text-zinc-800">
        {senderName} — Databayt
      </Text>
    </OutreachShell>
  )
}

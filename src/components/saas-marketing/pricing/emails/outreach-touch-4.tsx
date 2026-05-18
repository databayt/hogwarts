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
  seatsRemaining?: number // MENA-10 seat scarcity
  senderName: string
  senderEmail: string
}

export default function OutreachTouch4({
  lang,
  school,
  city,
  calLink,
  seatsRemaining = 3,
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
            متبقي {seatsRemaining} مقاعد فقط في برنامج MENA-10 المجاني (٦ أشهر،
            بدون رسوم، نطاق فرعي خاص بـ {school}، دعم أسبوعي). الحجز يُغلق حسب
            الأولوية.
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
            We have {seatsRemaining} MENA-10 free pilot seats left (6 months,
            $0, own {school} subdomain, weekly support). First-come basis.
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

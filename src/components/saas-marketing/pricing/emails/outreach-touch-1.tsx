// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Touch 1 cold-open: the free-month offer with rating personalization.
 * Day 1 of the 5-touch cadence.
 */

import { Link, Section, Text } from "@react-email/components"

import { OutreachShell, type OutreachLang } from "./outreach-shell"

export type OutreachTouch1Props = {
  lang: OutreachLang
  principal?: string | null
  school: string
  city?: string | null
  rating?: number | null
  country?: string | null
  calLink: string
  senderName: string
  senderEmail: string
}

export default function OutreachTouch1({
  lang,
  principal,
  school,
  city,
  rating,
  calLink,
  senderName,
  senderEmail,
}: OutreachTouch1Props) {
  const isAr = lang === "ar"
  const greeting = isAr
    ? `${principal?.trim() || "حضرة مدير المدرسة"}،`
    : `Hi ${principal?.trim() || "Principal"},`

  const ratingLine =
    typeof rating === "number"
      ? isAr
        ? `رأيت ${school} على خرائط قوقل بتقييم ${rating} نجمة — مبروك.`
        : `Saw ${school} on Google Maps with a ${rating}-star rating — congrats.`
      : isAr
        ? `أتابع ${school} عن بُعد ومعجب بالعمل.`
        : `Been following ${school} from afar and impressed by the work.`

  return (
    <OutreachShell
      lang={lang}
      preview={isAr ? `سؤال واحد عن ${school}` : `One question about ${school}`}
      city={city}
      senderEmail={senderEmail}
    >
      <Text className="mb-4 text-base leading-relaxed text-zinc-800">
        {greeting}
      </Text>

      {isAr ? (
        <>
          <Text className="mb-4 text-base leading-relaxed text-zinc-800">
            {ratingLine} أعمل على منصة إدارة مدارس عربية الأصل (balqalam) ولدي
            سؤال محدد:
          </Text>
          <Text className="mb-4 text-base leading-relaxed text-zinc-800">
            كيف تتعاملون اليوم مع متابعة الحضور وتواصل أولياء الأمور — Excel
            وواتساب، أم نظام مدمج؟
          </Text>
          <Text className="mb-4 text-base leading-relaxed text-zinc-800">
            مدرسة في الخرطوم تدير اليوم مدرستها أونلاين كلها على «بالقلم»، وكل
            مدرسة جديدة تبدأ بشهر مجاني. لو يهمك، أحجز لك عرض ١٥ دقيقة:
          </Text>
        </>
      ) : (
        <>
          <Text className="mb-4 text-base leading-relaxed text-zinc-800">
            {ratingLine} I&apos;m building an Arabic-first school management
            platform (balqalam) and have one specific question:
          </Text>
          <Text className="mb-4 text-base leading-relaxed text-zinc-800">
            How does {school} handle attendance + parent communication today —
            Excel/WhatsApp, or an integrated system?
          </Text>
          <Text className="mb-4 text-base leading-relaxed text-zinc-800">
            A school in Khartoum already runs its whole online school on
            Balqalam, and every new school starts with a free month. If it&apos;s
            worth a 15-min demo:
          </Text>
        </>
      )}

      <Section className="mb-4">
        <Link href={calLink} className="text-base text-blue-700 underline">
          {calLink}
        </Link>
      </Section>

      <Text className="mt-6 text-base text-zinc-800">
        {senderName} — Databayt
      </Text>
    </OutreachShell>
  )
}

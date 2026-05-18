// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Touch 3 case study: shares the King Fahad story + Loom demo. No ask.
 * Day 8 of the 5-touch cadence. New subject thread.
 *
 * NOTE: caseStudyUrl points to /case-studies/king-fahad once published.
 * If not live, the helper falls back to the docs page.
 */

import { Link, Section, Text } from "@react-email/components"

import { OutreachShell, type OutreachLang } from "./outreach-shell"

export type OutreachTouch3Props = {
  lang: OutreachLang
  school: string
  city?: string | null
  caseStudyUrl: string
  loomUrl?: string | null
  senderName: string
  senderEmail: string
}

export default function OutreachTouch3({
  lang,
  school,
  city,
  caseStudyUrl,
  loomUrl,
  senderName,
  senderEmail,
}: OutreachTouch3Props) {
  const isAr = lang === "ar"

  return (
    <OutreachShell
      lang={lang}
      preview={
        isAr
          ? `قصة من مدرسة الملك فهد قد تهم ${school}`
          : `A story from King Fahad Schools that ${school} might relate to`
      }
      city={city}
      senderEmail={senderEmail}
    >
      {isAr ? (
        <>
          <Text className="mb-4 text-base leading-relaxed text-zinc-800">
            بدون طلب — فقط شاركتني المدرسة الأولى في برنامج MENA-10 (مدرسة الملك
            فهد، السودان) أثرها بعد الشهور الأولى:
          </Text>
          <Text className="mb-2 text-base leading-relaxed text-zinc-800">
            • الحضور: ١١ وضعاً لالتقاط الحضور (QR، بصمة، NFC، Geofence،
            بالجملة...).
          </Text>
          <Text className="mb-2 text-base leading-relaxed text-zinc-800">
            • تواصل أولياء الأمور: بوابة واتساب رسمية مدمجة.
          </Text>
          <Text className="mb-4 text-base leading-relaxed text-zinc-800">
            • المالية: قيد محاسبي مزدوج + ٦ بوابات دفع (Stripe، بنكك، Tap،
            تحويل، نقدي، Mobile Money).
          </Text>
          <Text className="mb-4 text-base leading-relaxed text-zinc-800">
            الرابط أدناه — لا تردّ إن لم يخدم {school} الآن، إنما رأيت أن
            تعرفها.
          </Text>
        </>
      ) : (
        <>
          <Text className="mb-4 text-base leading-relaxed text-zinc-800">
            No ask — just sharing what the first MENA-10 school (King Fahad,
            Sudan) reported after the first months:
          </Text>
          <Text className="mb-2 text-base leading-relaxed text-zinc-800">
            • Attendance: 11 capture modes (QR, fingerprint, NFC, geofence,
            bulk...).
          </Text>
          <Text className="mb-2 text-base leading-relaxed text-zinc-800">
            • Parent comms: native WhatsApp Business bridge.
          </Text>
          <Text className="mb-4 text-base leading-relaxed text-zinc-800">
            • Finance: double-entry bookkeeping + 6 payment gateways (Stripe,
            bankak, Tap, transfer, cash, mobile money).
          </Text>
          <Text className="mb-4 text-base leading-relaxed text-zinc-800">
            Link below — no need to reply if it&apos;s not useful for {school}{" "}
            right now. Just wanted you to have it.
          </Text>
        </>
      )}

      <Section className="mb-2">
        <Link href={caseStudyUrl} className="text-base text-blue-700 underline">
          {isAr ? "اقرأ القصة" : "Read the story"} →
        </Link>
      </Section>
      {loomUrl ? (
        <Section className="mb-4">
          <Link href={loomUrl} className="text-base text-blue-700 underline">
            {isAr ? "شاهد عرضاً مختصراً (٥ دقائق)" : "Watch the 5-min demo"} →
          </Link>
        </Section>
      ) : null}

      <Text className="mt-6 text-base text-zinc-800">
        {senderName} — Databayt
      </Text>
    </OutreachShell>
  )
}

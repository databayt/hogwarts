// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Touch 5 close-the-loop: permission to close, short and respectful.
 * Day 21 of the 5-touch cadence. Highest single-reply rate of the sequence
 * in industry benchmarks (~25%).
 */

import { Text } from "@react-email/components"

import { OutreachShell, type OutreachLang } from "./outreach-shell"

export type OutreachTouch5Props = {
  lang: OutreachLang
  school: string
  city?: string | null
  senderName: string
  senderEmail: string
}

export default function OutreachTouch5({
  lang,
  school,
  city,
  senderName,
  senderEmail,
}: OutreachTouch5Props) {
  const isAr = lang === "ar"

  return (
    <OutreachShell
      lang={lang}
      preview={isAr ? `هل أغلق الملف؟` : `Closing the loop on ${school}`}
      city={city}
      senderEmail={senderEmail}
    >
      {isAr ? (
        <>
          <Text className="mb-4 text-base leading-relaxed text-zinc-800">
            لم أردّ سماعكم بشأن MENA-10 — وهذا تماماً مفهوم.
          </Text>
          <Text className="mb-4 text-base leading-relaxed text-zinc-800">
            سأغلق الملف الخاص بـ {school} الآن إن لم أسمع منكم. لو أردتم العودة
            في أي وقت، الرد على هذه الرسالة كافٍ.
          </Text>
          <Text className="mb-4 text-base leading-relaxed text-zinc-800">
            تمنياتي لكم بعام دراسي موفق.
          </Text>
          <Text className="mt-6 text-base text-zinc-800">
            {senderName} — Databayt
          </Text>
        </>
      ) : (
        <>
          <Text className="mb-4 text-base leading-relaxed text-zinc-800">
            Haven&apos;t heard back on MENA-10 — totally understand, schools are
            busy.
          </Text>
          <Text className="mb-4 text-base leading-relaxed text-zinc-800">
            I&apos;ll close out the {school} file on my end. If timing improves,
            replying to this email is enough to re-open it.
          </Text>
          <Text className="mb-4 text-base leading-relaxed text-zinc-800">
            Wishing you a strong year.
          </Text>
          <Text className="mt-6 text-base text-zinc-800">
            {senderName} — Databayt
          </Text>
        </>
      )}
    </OutreachShell>
  )
}

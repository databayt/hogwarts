// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Shared shell for outreach emails (Touch 1-5). Owns: html lang/dir, head,
 * preview, container, header, hr, opt-out footer. Each Touch component plugs
 * its body into `children`.
 */

import type { ReactNode } from "react"
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components"

export type OutreachLang = "ar" | "en"

export type OutreachShellProps = {
  lang: OutreachLang
  preview: string
  city?: string | null
  senderEmail: string
  children: ReactNode
}

export function OutreachShell({
  lang,
  preview,
  city,
  senderEmail,
  children,
}: OutreachShellProps) {
  const isAr = lang === "ar"
  return (
    <Html lang={lang} dir={isAr ? "rtl" : "ltr"}>
      <Head />
      <Preview>{preview}</Preview>
      <Tailwind>
        <Body className="bg-white font-sans">
          <Container className="mx-auto max-w-xl py-8">
            <Heading
              as="h1"
              className="mb-6 text-lg font-semibold text-zinc-900"
            >
              Hogwarts · Databayt
            </Heading>
            {children}
            <Hr className="my-6 border-t border-zinc-200" />
            <Section>
              {isAr ? (
                <Text className="mb-1 text-xs text-zinc-500">
                  لإيقاف رسائلنا، ردّ بكلمة &quot;إلغاء&quot; وسنوقفها فوراً.
                </Text>
              ) : (
                <Text className="mb-1 text-xs text-zinc-500">
                  Don&apos;t want emails from us? Reply &quot;unsubscribe&quot;
                  and we&apos;ll stop right away.
                </Text>
              )}
              <Text className="text-xs text-zinc-500">
                Databayt · {senderEmail}
                {city ? ` · ${city}` : ""}
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}

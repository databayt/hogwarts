"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { useId, useMemo, useState, useTransition } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { motion } from "framer-motion"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import type { z } from "zod"

import { tenantOriginForHost } from "@/lib/root-domain"
import {
  submitContact,
  type ContactErrorCode,
} from "@/components/saas-marketing/contact/actions"
import { createContactSchema } from "@/components/saas-marketing/contact/validation"
import { DemoLink } from "@/components/saas-marketing/demo-link"
import {
  SALES_WHATSAPP,
  thmanyahLocaleFor,
} from "@/components/saas-marketing/thmanyah/lib/copy"

/**
 * /contact — one green screen in the hero's dress: the same #00bc6d field,
 * gutters (20/40/60px, content capped at 1320px), sans eyebrow, Serif Display
 * Black headline and #9fe5b1 highlight mark, with the transparent HomeHeader
 * drawn over it.
 *
 * It is the page's "talk to a human" door — the homepage's two CTAs are both
 * self-serve (demo school, onboarding), and our schools buy in conversation.
 * Three ways in, in order of weight:
 *   1. WhatsApp — the black pill, opening the sales line with a greeting.
 *   2. A short email + message form → `submitContact` (honeypot, 3/hour rate
 *      limit, mail to sales, and a `Prospect` row for the funnel).
 *   3. The demo school, for anyone not ready to talk yet.
 *
 * Mounted OUTSIDE `.thmanyah-shell`: the clone's scoped reset restyles
 * `input, textarea, button`, which this form needs as drawn here.
 */

const EASE: [number, number, number, number] = [0.45, 0.4, 0.17, 0.82]
const APPEAR = {
  initial: { opacity: 0.001, y: 60 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 1, ease: EASE, type: "tween" as const },
}

const SANS: React.CSSProperties = {
  fontFamily: '"thmanyah sans", sans-serif',
  fontFeatureSettings: '"blwf" on, "cv09" on, "cv03" on, "cv04" on, "cv11" on',
}
const DISPLAY: React.CSSProperties = {
  fontFamily: '"thmanyah serif display", serif',
  fontWeight: 900,
  fontFeatureSettings: '"ss01" on',
}

const demoFallbackHref = (lang: string) =>
  `${process.env.NEXT_PUBLIC_DEMO_URL || tenantOriginForHost(null, "demo")}/${lang}/dashboard`

function WhatsAppGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="size-6 shrink-0" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

export function ContactBlock({ lang: routeLang }: { lang: string }) {
  const { lang, dir, copy } = thmanyahLocaleFor(routeLang)
  const c = copy.contact
  const emailId = useId()
  const messageId = useId()
  const [isPending, startTransition] = useTransition()
  const [sent, setSent] = useState(false)

  const schema = useMemo(
    () =>
      createContactSchema({
        required: () => c.validation.required,
        email: () => c.validation.email,
        minLength: () => c.validation.tooShort,
        maxLength: () => c.validation.required,
      } as unknown as Parameters<typeof createContactSchema>[0]),
    [c]
  )
  type FormValues = z.infer<typeof schema>
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", message: "", website: "" },
    mode: "onBlur",
  })

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      const result = await submitContact({ ...values, lang })
      if (result.success) {
        toast.success(c.success)
        form.reset()
        setSent(true)
      } else {
        const map: Record<ContactErrorCode, string> = c.errors
        toast.error(map[result.errorCode] ?? c.errors.SEND_FAILED)
      }
    })
  }

  const whatsappHref = `https://wa.me/${SALES_WHATSAPP}?text=${encodeURIComponent(c.whatsappText)}`
  const emailError = form.formState.errors.email?.message
  const messageError = form.formState.errors.message?.message
  const field =
    "w-full border-0 border-b border-black/40 bg-transparent px-0 py-3 text-lg text-black placeholder:text-black/50 focus:border-black focus:outline-none focus-visible:outline-none"

  return (
    <section
      dir={dir}
      lang={lang}
      data-cta="contact"
      className="relative flex min-h-svh w-full flex-col justify-between gap-10 bg-[#00bc6d] px-5 pt-24 pb-10 text-black sm:px-10 sm:pt-28 lg:px-[60px] lg:pt-32 lg:pb-12"
    >
      {/* Eyebrow · headline · lede */}
      <motion.div {...APPEAR} className="mx-auto w-full max-w-[1320px]">
        <h3
          className="text-xl sm:text-2xl"
          style={{ ...SANS, fontWeight: 400 }}
        >
          {c.eyebrow}
        </h3>
        <h1
          className={`mt-4 flex max-w-[840px] flex-wrap items-center gap-x-[0.18em] text-[44px] sm:text-[64px] lg:text-[92px] ${
            dir === "rtl" ? "leading-[1.25]" : "leading-[1.12]"
          }`}
          style={DISPLAY}
        >
          {c.words.map((w, i) => (
            <span key={i}>{w}</span>
          ))}
          <span className="relative isolate">
            <motion.span
              aria-hidden
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.9, delay: 0.5, ease: EASE }}
              className={`absolute -z-10 bg-[#9fe5b1] ${
                dir === "rtl" ? "origin-right" : "origin-left"
              }`}
              style={{ inset: "0.3em -0.02em 0.24em" }}
            />
            {c.highlight}
          </span>
        </h1>
        <p
          className="mt-4 max-w-[560px] text-lg leading-relaxed text-black/80 sm:text-xl"
          style={{ ...SANS, fontWeight: 400 }}
        >
          {c.lede}
        </p>
      </motion.div>

      {/* Actions: WhatsApp + demo  |  message form */}
      <motion.div
        {...APPEAR}
        transition={{ ...APPEAR.transition, delay: 0.15 }}
        className="mx-auto grid w-full max-w-[1320px] gap-12 lg:grid-cols-2 lg:items-end"
        style={SANS}
      >
        <div className="flex flex-col items-start gap-5">
          <a
            href={whatsappHref}
            target="_blank"
            rel="noreferrer"
            data-cta="contact-whatsapp"
            className="inline-flex h-14 items-center gap-3 rounded-full bg-black px-7 text-[18px] text-white no-underline transition-colors hover:bg-black/85 md:text-[20px]"
          >
            <WhatsAppGlyph />
            {c.whatsapp}
          </a>
          <DemoLink
            fallbackHref={demoFallbackHref(lang)}
            lang={lang}
            path="/dashboard"
            className="text-lg text-black underline decoration-black/40 underline-offset-4 hover:decoration-black"
          >
            {c.demo}
          </DemoLink>
        </div>

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          noValidate
          data-cta="contact-form"
          className="flex w-full max-w-[560px] flex-col gap-4 lg:justify-self-end"
        >
          <p className="text-xl" style={{ fontWeight: 500 }}>
            {c.formTitle}
          </p>
          <div>
            <label htmlFor={emailId} className="sr-only">
              {c.emailLabel}
            </label>
            <input
              id={emailId}
              type="email"
              dir="ltr"
              autoComplete="email"
              placeholder={c.emailLabel}
              aria-invalid={!!emailError}
              className={`${field} ${dir === "rtl" ? "text-right" : ""}`}
              {...form.register("email")}
            />
            {emailError && (
              <p className="mt-1 text-sm text-black/80">{emailError}</p>
            )}
          </div>
          <div>
            <label htmlFor={messageId} className="sr-only">
              {c.messageLabel}
            </label>
            <textarea
              id={messageId}
              rows={3}
              placeholder={c.messagePlaceholder}
              aria-invalid={!!messageError}
              className={`${field} resize-none`}
              {...form.register("message")}
            />
            {messageError && (
              <p className="mt-1 text-sm text-black/80">{messageError}</p>
            )}
          </div>
          {/* Honeypot — hidden from people, filled by bots. */}
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden
            className="absolute -left-[9999px] h-0 w-0 opacity-0"
            {...form.register("website")}
          />
          <button
            type="submit"
            disabled={isPending}
            className="mt-2 inline-flex h-12 items-center justify-center self-start rounded-full border border-black px-8 text-lg text-black transition-colors hover:bg-black hover:text-white disabled:opacity-60"
          >
            {isPending ? c.submitting : sent ? `${c.submit} ✓` : c.submit}
          </button>
        </form>
      </motion.div>
    </section>
  )
}

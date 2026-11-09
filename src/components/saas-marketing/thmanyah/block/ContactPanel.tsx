"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { useId, useMemo, useState, useTransition } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { motion } from "framer-motion"
import { Facebook, Github, Mail, Phone } from "lucide-react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import {
  submitContact,
  type ContactErrorCode,
} from "@/components/saas-marketing/contact/actions"
import {
  CONTACT_EMAIL_MAX,
  CONTACT_MESSAGE_MAX,
  CONTACT_MESSAGE_MIN,
  CONTACT_REACH_MIN,
} from "@/components/saas-marketing/contact/validation"
import {
  CONTACT_CHANNELS,
  useThmanyahLocale,
} from "@/components/saas-marketing/thmanyah/lib/copy"

/**
 * The hero's contact panel. The header's "Contact" doesn't navigate on the
 * homepage: HeroBlock fades its headline and CTA out and this fades in on the
 * same green, in the hero's type (sans eyebrow, Serif Display Black title).
 *
 *   start column  eyebrow · title · lede, then the channels: the two
 *                 mailboxes, a call link, and WhatsApp / Facebook / X / GitHub
 *   end column    two fields — "your email or phone" and the message — and
 *                 Send, through `submitContact` (honeypot, 3/hour rate limit,
 *                 mail to sales, an inbound Prospect for the funnel)
 *
 * Every number and handle lives in `CONTACT_CHANNELS` (lib/copy.ts).
 */

const SANS: React.CSSProperties = {
  fontFamily: '"thmanyah sans", sans-serif',
  fontFeatureSettings: '"blwf" on, "cv09" on, "cv03" on, "cv04" on, "cv11" on',
}
const DISPLAY: React.CSSProperties = {
  fontFamily: '"thmanyah serif display", serif',
  fontWeight: 900,
  fontFeatureSettings: '"ss01" on',
}

/* The clone's reset sets `input, textarea, button` to 12px sans-serif in
   unlayered CSS, which outranks Tailwind's layered utilities — so the form
   controls take their type inline. */
const CONTROL: React.CSSProperties = { ...SANS, fontSize: "18px" }

function WhatsAppGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

function XGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
    </svg>
  )
}

const ENTER = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 16 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
}

export function ContactPanel({ onClose }: { onClose: () => void }) {
  const { lang, dir, copy } = useThmanyahLocale()
  const c = copy.contact
  const reachId = useId()
  const messageId = useId()
  const [isPending, startTransition] = useTransition()
  const [sent, setSent] = useState(false)

  const schema = useMemo(
    () =>
      z.object({
        contact: z
          .string()
          .trim()
          .min(1, c.validation.required)
          .min(CONTACT_REACH_MIN, c.validation.reachShort)
          .max(CONTACT_EMAIL_MAX, c.validation.reachShort),
        message: z
          .string()
          .trim()
          .min(CONTACT_MESSAGE_MIN, c.validation.tooShort)
          .max(CONTACT_MESSAGE_MAX),
        website: z.string().max(0),
      }),
    [c]
  )
  type FormValues = z.infer<typeof schema>
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { contact: "", message: "", website: "" },
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

  const reachError = form.formState.errors.contact?.message
  const messageError = form.formState.errors.message?.message
  const field =
    "w-full rounded-none border-0 border-b border-black/40 bg-transparent px-0 py-3 text-[17px] text-black placeholder:text-black/55 focus:border-black focus:outline-none md:text-lg"

  const socials = [
    {
      key: "whatsapp",
      label: c.social.whatsapp,
      href: `https://wa.me/${CONTACT_CHANNELS.whatsapp}?text=${encodeURIComponent(c.whatsappText)}`,
      icon: <WhatsAppGlyph className="size-5" />,
    },
    {
      key: "facebook",
      label: c.social.facebook,
      href: CONTACT_CHANNELS.facebook,
      icon: <Facebook className="size-5" strokeWidth={1.75} />,
    },
    {
      key: "x",
      label: c.social.x,
      href: CONTACT_CHANNELS.x,
      icon: <XGlyph className="size-[18px]" />,
    },
    {
      key: "github",
      label: c.social.github,
      href: CONTACT_CHANNELS.github,
      icon: <Github className="size-5" strokeWidth={1.75} />,
    },
  ]

  return (
    <motion.div
      key="contact"
      {...ENTER}
      data-cta="contact"
      className="grid w-full max-w-[1320px] flex-1 content-center gap-10 pt-16 pb-4 text-black lg:grid-cols-2 lg:items-center lg:gap-20 lg:pt-10"
      style={SANS}
    >
      {/* Start column — who we are to talk to, and every way in */}
      <div className="flex flex-col items-start gap-6">
        <div>
          <p className="text-xl md:text-2xl">{c.eyebrow}</p>
          <h2
            className={`mt-3 text-[40px] sm:text-[56px] lg:text-[72px] ${
              dir === "rtl" ? "leading-[1.25]" : "leading-[1.08]"
            }`}
            style={DISPLAY}
          >
            {c.title}
          </h2>
          <p className="mt-3 max-w-[480px] text-[17px] leading-relaxed text-black/75 md:text-lg">
            {c.lede}
          </p>
        </div>

        <div className="flex flex-col gap-2 text-[17px] md:text-lg">
          {CONTACT_CHANNELS.emails.map((m) => (
            <a
              key={m}
              href={`mailto:${m}`}
              dir="ltr"
              className="inline-flex items-center gap-2 text-black no-underline hover:underline"
            >
              <Mail className="size-[18px]" strokeWidth={1.75} aria-hidden />
              {m}
            </a>
          ))}
          <a
            href={`tel:${CONTACT_CHANNELS.phone}`}
            className="inline-flex items-center gap-2 text-black no-underline hover:underline"
          >
            <Phone className="size-[18px]" strokeWidth={1.75} aria-hidden />
            <span>{c.call}</span>
            <span dir="ltr" className="text-black/70">
              {CONTACT_CHANNELS.phone}
            </span>
          </a>
        </div>

        <div className="flex items-center gap-3" aria-label={c.followLabel}>
          {socials.map((s) => (
            <a
              key={s.key}
              href={s.href}
              target="_blank"
              rel="noreferrer"
              aria-label={s.label}
              title={s.label}
              data-cta={`contact-${s.key}`}
              className="inline-flex size-11 items-center justify-center rounded-full bg-black text-white transition-colors hover:bg-black/80"
            >
              {s.icon}
            </a>
          ))}
        </div>
      </div>

      {/* End column — the two-field form */}
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        noValidate
        data-cta="contact-form"
        className="relative flex w-full max-w-[560px] flex-col gap-4 lg:justify-self-end"
      >
        <div>
          <label htmlFor={reachId} className="sr-only">
            {c.reachLabel}
          </label>
          <input
            id={reachId}
            style={CONTROL}
            type="text"
            inputMode="email"
            autoComplete="email"
            placeholder={c.reachLabel}
            aria-invalid={!!reachError}
            className={field}
            {...form.register("contact")}
          />
          {reachError && (
            <p className="mt-1 text-sm text-black/80">{reachError}</p>
          )}
        </div>
        <div>
          <label htmlFor={messageId} className="sr-only">
            {c.messageLabel}
          </label>
          <textarea
            id={messageId}
            style={CONTROL}
            rows={4}
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
          className="absolute h-0 w-0 opacity-0"
          {...form.register("website")}
        />
        <div className="mt-2 flex items-center gap-6">
          <button
            type="submit"
            style={CONTROL}
            disabled={isPending}
            className="inline-flex h-12 items-center justify-center rounded-full bg-black px-8 text-[17px] text-white transition-colors hover:bg-black/85 disabled:opacity-60 md:text-lg"
          >
            {isPending ? c.submitting : sent ? `${c.submit} ✓` : c.submit}
          </button>
          <button
            type="button"
            style={CONTROL}
            onClick={onClose}
            className="bg-transparent text-[17px] text-black underline decoration-black/40 underline-offset-4 hover:decoration-black md:text-lg"
          >
            {c.back}
          </button>
        </div>
      </form>
    </motion.div>
  )
}

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
  clusterCount,
  SortingText,
} from "@/components/saas-marketing/thmanyah/block/SortingText"
import {
  CONTACT_CHANNELS,
  useThmanyahLocale,
} from "@/components/saas-marketing/thmanyah/lib/copy"

/**
 * The hero's contact panel — the old homepage's "Let's Work Together" section
 * (`saas-marketing/lets-work-together.tsx`), recalled onto the hero's green in
 * the hero's type. The header's "Contact" doesn't navigate on the homepage:
 * HeroBlock smokes its headline out and this sorts in (SortingText).
 *
 *   top     (hero-text) the title in the hero headline's face, size and
 *           slot — it sorts in exactly where the headline smoked out — then
 *           the lede
 *   bottom  (hero-cta) one row of round icons — WhatsApp, Facebook, X,
 *           GitHub, mail, call — and the two-field form: Submit through
 *           `submitContact` (honeypot, 3/hour rate limit, mail to sales, an
 *           inbound Prospect for the funnel), Live chat opens the chatbot
 *
 * Every number and handle lives in `CONTACT_CHANNELS` (lib/copy.ts).
 */

const SANS: React.CSSProperties = {
  fontFamily: '"thmanyah sans", sans-serif',
  fontFeatureSettings: '"blwf" on, "cv09" on, "cv03" on, "cv04" on, "cv11" on',
}
/* The hero headline's H1_STYLE: same face, size and leading (the leading
   comes from `.hero-words h1` in thmanyah-clone.css, per dir). */
const TITLE: React.CSSProperties = {
  fontFamily: '"thmanyah serif display", serif',
  fontWeight: 900,
  fontFeatureSettings: '"ss01" on',
  color: "#000",
  textAlign: "start",
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

/* Everything but the title blurs in after it starts sorting, in reading
   order — the dashboard's vocabulary (blur + opacity + a small lift) — and
   leaves the same way, all at once and a touch faster, so the title's
   letters are the last thing to go. */
const EASE = [0.22, 1, 0.36, 1] as const
const rise = (step: number, leaving: boolean) => ({
  initial: { opacity: 0, y: 14, filter: "blur(8px)" },
  animate: leaving
    ? { opacity: 0, y: -6, filter: "blur(6px)" }
    : { opacity: 1, y: 0, filter: "blur(0px)" },
  transition: leaving
    ? { duration: 0.4, ease: [0.4, 0, 1, 1] as const }
    : { duration: 0.7, ease: EASE, delay: 0.18 + step * 0.08 },
})

export function ContactPanel({
  onClose,
  leaving = false,
}: {
  onClose: () => void
  /** HeroBlock is swapping back to the headline: smoke out. */
  leaving?: boolean
}) {
  const { lang, dir, copy } = useThmanyahLocale()
  const rtl = dir === "rtl"
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
  /* The old section's bordered fields, lifted onto the green: a pale wash so
     they read as wells in the ground, black ink, a darker rule on focus. */
  const field =
    "w-full rounded-2xl border border-black/15 bg-white/35 px-5 py-3.5 text-black placeholder:text-black/55 transition-colors focus:border-black/60 focus:bg-white/55 focus:outline-none"

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

  const titleLines = useMemo(() => {
    const cut = c.title.lastIndexOf(" ")
    return cut > 0 ? [c.title.slice(0, cut), c.title.slice(cut + 1)] : [c.title]
  }, [c.title])

  /* One row of round black buttons: the socials, then mail and call. */
  const channels = [
    ...socials.map((s) => ({ ...s, external: true })),
    {
      key: "mail",
      label: c.emailsLabel,
      href: `mailto:${CONTACT_CHANNELS.email}`,
      icon: <Mail className="size-5" strokeWidth={1.75} />,
      external: false,
    },
    {
      key: "call",
      label: c.call,
      href: `tel:${CONTACT_CHANNELS.phone}`,
      icon: <Phone className="size-5" strokeWidth={1.75} />,
      external: false,
    },
  ]

  /* Laid out on the hero's own frame — `hero-text` on top, `hero-cta` at the
     bottom, spaced by the section's justify-between — so the title sorts in
     exactly where the headline smoked out. */
  return (
    <>
      <div
        className="hero-text text-black"
        data-cta="contact"
        /* Hug the content instead of filling the hero (`.hero-text` grows to
           push the CTA down), so the icons and form follow the lede. */
        style={{ ...SANS, flex: "0 0 auto", height: "auto" }}
      >
        {/* An empty slot the height of the hero's eyebrow line, so the
            title lands on the headline's exact baseline. */}
        {/* Phones: clear the menu bar (the hero centres its text there). */}
        <div className="h-10 sm:hidden" aria-hidden />
        <h3 className="hero-title invisible w-full" aria-hidden="true">
          &nbsp;
        </h3>
        {/* Two lines, like the hero's headline: everything but the last
            word, then the last word ("Let's Work" / "Together", «لنعمل» /
            «معًا»). Same box, size, leading and row gap as `.hero-words`. */}
        <div className="hero-words flex w-full flex-row flex-wrap items-center justify-start">
          {titleLines.map((line, i) => {
            const last = i === titleLines.length - 1 && i > 0
            const h1 = (
              <h1 style={TITLE}>
                <SortingText
                  text={line}
                  rtl={rtl}
                  scramble
                  leaving={leaving}
                  order={titleLines
                    .slice(0, i)
                    .reduce((n, l) => n + clusterCount(l), 0)}
                  total={clusterCount(titleLines.join(""))}
                />
              </h1>
            )
            return (
              <React.Fragment key={i}>
                {i > 0 && <div className="h-0 basis-full" aria-hidden />}
                {last ? (
                  /* The hero's highlight group: the pale mark behind the last
                     word, drawn from the reading edge once the word starts
                     sorting, wiped away on the leave. */
                  <div className="relative flex flex-row items-center justify-center gap-[10px]">
                    <motion.div
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: leaving ? 0 : 1 }}
                      transition={
                        leaving
                          ? { duration: 0.5, ease: EASE }
                          : { duration: 0.7, ease: EASE, delay: 0.25 }
                      }
                      className={`hero-mark ${rtl ? "origin-right" : "origin-left"}`}
                      aria-hidden
                    />
                    <div className="relative flex flex-col">{h1}</div>
                  </div>
                ) : (
                  h1
                )}
              </React.Fragment>
            )
          })}
        </div>
      </div>

      {/* `.hero-cta` is a column in unlayered CSS; the row lives inside it. */}
      <div
        className="hero-cta text-black"
        /* 24px — the hero-text gap — so the row starts where the lede did. */
        style={{ ...SANS, marginTop: 24, marginBottom: "auto" }}
      >
        <div className="flex w-full flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          {/* Start column — the description, then the icon row; its top
              lines up with the form's first field. */}
          <div className="flex flex-col gap-7 lg:max-w-[560px]">
            <motion.p
              {...rise(0, leaving)}
              className="text-start text-[18px] leading-relaxed text-black/80 md:text-[20px]"
            >
              {c.lede}
            </motion.p>
            <motion.div
              {...rise(1, leaving)}
              className="flex flex-wrap items-center gap-3"
              aria-label={c.followLabel}
            >
              {channels.map((s) => (
                <a
                  key={s.key}
                  href={s.href}
                  {...(s.external
                    ? { target: "_blank", rel: "noreferrer" }
                    : {})}
                  aria-label={s.label}
                  title={s.label}
                  data-cta={`contact-${s.key}`}
                  className="inline-flex size-11 items-center justify-center rounded-full bg-black text-white transition-transform hover:-translate-y-0.5 hover:bg-black/85"
                >
                  {s.icon}
                </a>
              ))}
            </motion.div>
          </div>

          {/* End column — the old two-field form */}
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            noValidate
            data-cta="contact-form"
            className="relative flex w-full flex-col gap-4 lg:max-w-[680px]"
          >
            <motion.div {...rise(1, leaving)}>
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
                <p className="mt-1.5 text-sm text-black/80">{reachError}</p>
              )}
            </motion.div>
            <motion.div {...rise(2, leaving)}>
              <label htmlFor={messageId} className="sr-only">
                {c.messageLabel}
              </label>
              <textarea
                id={messageId}
                style={CONTROL}
                rows={4}
                placeholder={c.messagePlaceholder}
                aria-invalid={!!messageError}
                className={`${field} min-h-[120px] resize-none`}
                {...form.register("message")}
              />
              {messageError && (
                <p className="mt-1.5 text-sm text-black/80">{messageError}</p>
              )}
            </motion.div>
            {/* Honeypot — hidden from people, filled by bots. */}
            <input
              type="text"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden
              className="absolute h-0 w-0 opacity-0"
              {...form.register("website")}
            />
            <motion.div
              {...rise(3, leaving)}
              className="mt-1 flex flex-wrap items-center gap-2"
            >
              <button
                type="submit"
                style={CONTROL}
                disabled={isPending}
                className="inline-flex h-12 items-center justify-center rounded-full bg-black px-8 text-white transition-colors hover:bg-black/85 disabled:opacity-60"
              >
                {isPending ? c.submitting : sent ? `${c.submit} ✓` : c.submit}
              </button>
              <button
                type="button"
                style={CONTROL}
                onClick={() =>
                  window.dispatchEvent(new CustomEvent("open-chatbot"))
                }
                className="inline-flex h-12 items-center justify-center rounded-full px-5 text-black transition-colors hover:bg-black/10"
              >
                {c.liveChat}
              </button>
              <button
                type="button"
                style={CONTROL}
                onClick={onClose}
                className="ms-auto bg-transparent text-black/70 underline decoration-black/30 underline-offset-4 hover:text-black hover:decoration-black"
              >
                {c.back}
              </button>
            </motion.div>
          </form>
        </div>
      </div>
    </>
  )
}

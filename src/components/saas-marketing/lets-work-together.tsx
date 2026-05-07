"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useId, useMemo, useState, useTransition } from "react"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import type { z } from "zod"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Icons } from "@/components/icons"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import { createI18nHelpers } from "@/components/internationalization/helpers"

import { submitContact, type ContactErrorCode } from "./contact/actions"
import { createContactSchema } from "./contact/validation"

interface LetsWorkTogetherProps {
  dictionary?: Dictionary
  lang?: Locale
}

const FALLBACK = {
  title: "Let's Work Together",
  description:
    "Ready to revolutionize your educational institution with advanced automation? Experience streamlined operations and enhanced learning outcomes for students and educators.",
  emailLabel: "Email address",
  messageLabel: "Your message",
  emailPlaceholder: "Email address",
  messagePlaceholder: "What educational processes would you like to automate?",
  submit: "Submit",
  submitting: "Sending…",
  liveChat: "Live chat",
  successToast: "Thanks — we'll get back to you soon.",
  errorToast: "Could not send your message. Please try again.",
  rateLimited: "Too many requests. Please try again in an hour.",
  validationFailed: "Please check the form for errors.",
} as const

export default function LetsWorkTogether({
  dictionary,
  lang,
}: LetsWorkTogetherProps) {
  const isRTL = lang === "ar"
  const dict = {
    ...FALLBACK,
    ...(dictionary?.marketing?.letsWorkTogether ?? {}),
  }
  const emailId = useId()
  const messageId = useId()
  const [isPending, startTransition] = useTransition()
  const [submitted, setSubmitted] = useState(false)

  // Localized validation messages — fall back to a minimal helper when the
  // dictionary isn't passed (component is also reachable via storybook/tests).
  const schema = useMemo(() => {
    if (dictionary) {
      return createContactSchema(
        createI18nHelpers(dictionary.messages).validation
      )
    }
    return createContactSchema({
      required: () => "Required",
      email: () => "Invalid email",
      minLength: (n: number) => `Must be at least ${n} characters`,
      maxLength: (n: number) => `Must be at most ${n} characters`,
    } as Parameters<typeof createContactSchema>[0])
  }, [dictionary])

  type FormValues = z.infer<typeof schema>

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", message: "", website: "" },
    mode: "onBlur",
  })

  const errorMap: Record<ContactErrorCode, string> = {
    VALIDATION_FAILED: dict.validationFailed,
    RATE_LIMITED: dict.rateLimited,
    SEND_FAILED: dict.errorToast,
  }

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      const result = await submitContact({
        ...values,
        lang: lang ?? "en",
      })
      if (result.success) {
        toast.success(dict.successToast)
        form.reset()
        setSubmitted(true)
      } else {
        toast.error(errorMap[result.errorCode] ?? dict.errorToast)
      }
    })
  }

  const emailError = form.formState.errors.email?.message
  const messageError = form.formState.errors.message?.message

  return (
    <section dir={isRTL ? "rtl" : "ltr"}>
      <h1 className="font-heading mb-8 text-4xl font-extrabold md:text-5xl">
        {dict.title}
      </h1>
      <div className="flex flex-col gap-8 lg:flex-row lg:gap-14">
        <div className="flex-1">
          <p className="muted mb-4">{dict.description}</p>
          <div className="mt-4 flex items-center gap-4">
            <Link
              href="https://github.com/databayt/hogwarts"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-opacity hover:opacity-80"
            >
              <Icons.github className="size-7" />
            </Link>
            <Link
              href="https://discord.gg/uPa4gGG62c"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-opacity hover:opacity-80"
            >
              <Icons.discord className="size-8" />
            </Link>
          </div>
        </div>
        <div className="flex-1 pt-1">
          <form
            className="space-y-4"
            onSubmit={form.handleSubmit(onSubmit)}
            noValidate
          >
            {/* Visually-hidden label keeps the placeholder design but adds an
                accessible name for screen readers. */}
            <label htmlFor={emailId} className="sr-only">
              {dict.emailLabel}
            </label>
            <Input
              id={emailId}
              type="email"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
              spellCheck={false}
              placeholder={dict.emailPlaceholder}
              aria-invalid={!!emailError}
              aria-describedby={emailError ? `${emailId}-error` : undefined}
              disabled={isPending || submitted}
              {...form.register("email")}
            />
            {emailError ? (
              <p
                id={`${emailId}-error`}
                role="alert"
                className="text-destructive text-sm"
              >
                {emailError}
              </p>
            ) : null}

            <label htmlFor={messageId} className="sr-only">
              {dict.messageLabel}
            </label>
            <Textarea
              id={messageId}
              placeholder={dict.messagePlaceholder}
              className="min-h-[70px] resize-none"
              aria-invalid={!!messageError}
              aria-describedby={messageError ? `${messageId}-error` : undefined}
              disabled={isPending || submitted}
              {...form.register("message")}
            />
            {messageError ? (
              <p
                id={`${messageId}-error`}
                role="alert"
                className="text-destructive text-sm"
              >
                {messageError}
              </p>
            ) : null}

            {/* Honeypot — hidden from real users, bots fill it. The matching
                z.string().max(0) on the server returns silent success. */}
            <input
              type="text"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              className={cn("hidden")}
              {...form.register("website")}
            />

            <div className="flex gap-2">
              <Button
                type="submit"
                className="w-fit px-8"
                disabled={isPending || submitted}
                aria-busy={isPending}
              >
                {isPending ? dict.submitting : dict.submit}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-fit px-4"
                onClick={() =>
                  window.dispatchEvent(new CustomEvent("open-chatbot"))
                }
              >
                {dict.liveChat}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </section>
  )
}

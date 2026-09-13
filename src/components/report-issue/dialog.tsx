// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

"use client"

/**
 * Canonical Report Issue dialog — the one file every databayt repo ships
 * (kun is the source; hogwarts and mkan copy it verbatim and wire their own
 * wrapper in ./index.tsx).
 *
 * Two surfaces, one state machine:
 *
 *   ≥ 768px  — a centred Dialog: title, textarea, hint, captcha, Submit.
 *   < 768px  — a full-height bottom sheet shaped like the iOS "Search Book"
 *              sheet: title on top, a quiet state area in the middle, and a
 *              pill composer pinned right above the on-screen keyboard with a
 *              round send button inside it and a round ✕ beside it. The pill
 *              follows the keyboard through `window.visualViewport`, which is
 *              the only signal iOS Safari gives for the keyboard's height.
 *
 * Symmetric success: every accepted submission shows the same success toast
 * regardless of which bucket it landed in. Only verified-bucket results
 * surface the issue number (when the server action chooses to return it).
 *
 * Anti-abuse client-side mirror — the numbers come from ONE place,
 * `@/lib/report/limits`, so the submit button enables exactly when the server
 * will accept the text (hogwarts once enabled it on any text while the server
 * demanded 30 chars: the team got "Submitted. Thank you!" and no issue):
 *   - description ≥ minChars and ≥ minTokens for the reporter kind (HF1/HF6)
 *   - ≤ 2000 chars (HF2)
 *   - 60s cooldown after submit (HF9 — prevents the triple-click case)
 *   - Turnstile widget required when no session and a site key exists (HF3)
 *
 * Language comes from the `lang` prop, else the `[lang]` route param — never
 * from `document` at render time, which differed between server and client
 * and mis-hydrated the Arabic dialog. Direction is set on the portal content
 * explicitly because the portal mounts outside the page's `dir` wrapper.
 */
import * as React from "react"
import { useParams } from "next/navigation"
import { ArrowUp, Bug, Check, X } from "lucide-react"

import { REPORT_LIMITS } from "@/lib/report/limits"
import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet"

import {
  REPORT_DICTIONARY,
  type ReportDict,
  type ReportLang,
} from "./dictionary"

type ReportCategory =
  | "visual"
  | "broken"
  | "data"
  | "slow"
  | "confusing"
  | "auth"
  | "i18n"
  | "other"

type SeverityHint = "low" | "medium" | "high" | "critical"

const COOLDOWN_MS = 60_000
const SUCCESS_CLOSE_MS = 1_500
const COMPOSER_MAX_HEIGHT_PX = 160

type Status = "idle" | "loading" | "success" | "error"

export interface ReportIssueSubmitInput {
  description: string
  pageUrl: string
  category: ReportCategory
  reproSteps?: string
  expected?: string
  actual?: string
  severityHint?: SeverityHint
  viewport: string
  direction: "ltr" | "rtl"
  browser: string
  hasScreenshot: false
  captchaToken?: string
}

export interface ReportIssueSubmitResult {
  ok: boolean
  issueNumber?: number
}

export interface ReportIssueDialogProps {
  /** "text" = underlined link, "icon" = bug icon button. Default "text". */
  variant?: "text" | "icon"
  /** Active language. Defaults to the `[lang]` route param, then "en". */
  lang?: ReportLang
  /** True when the visitor is signed in. Controls captcha visibility AND the intake floor. */
  hasSession: boolean
  /** Server action invoked on submit. Should call runReportPipeline. */
  onSubmit: (input: ReportIssueSubmitInput) => Promise<ReportIssueSubmitResult>
  /** Turnstile site key. When absent the captcha block is hidden. */
  turnstileSiteKey?: string | undefined
  /** Sign-in link href used when prompting anonymous users. */
  signInHref?: string
  /** Per-key overrides for the built-in dictionary (mkan feeds its central dictionary through here). */
  strings?: Partial<ReportDict>
  /** Icon-variant styling hooks kept for mkan's header parity. */
  iconClassName?: string
  iconStrokeWidth?: number
}

export function ReportIssueDialog({
  variant = "text",
  lang,
  hasSession,
  onSubmit,
  turnstileSiteKey,
  signInHref = "/login",
  strings,
  iconClassName,
  iconStrokeWidth,
}: ReportIssueDialogProps): React.JSX.Element {
  const params = useParams<{ lang?: string }>()
  const effectiveLang: ReportLang =
    lang ?? (params?.lang === "ar" ? "ar" : "en")
  const dir = effectiveLang === "ar" ? "rtl" : "ltr"
  const t = React.useMemo<ReportDict>(
    () => ({ ...REPORT_DICTIONARY[effectiveLang], ...strings }),
    [effectiveLang, strings]
  )
  const isMobile = useIsMobile()
  const limits = hasSession
    ? REPORT_LIMITS.authenticated
    : REPORT_LIMITS.anonymous

  const [open, setOpen] = React.useState(false)
  const [description, setDescription] = React.useState("")
  const [captchaToken, setCaptchaToken] = React.useState<string | null>(null)
  const [status, setStatus] = React.useState<Status>("idle")
  const [issueNumber, setIssueNumber] = React.useState<number | undefined>(
    undefined
  )
  const [cooldownUntil, setCooldownUntil] = React.useState<number | null>(null)
  const cooldownActive = useCooldown(cooldownUntil)

  const trimmed = description.trim()
  const charCount = trimmed.length
  const tokenCount = React.useMemo(
    () => countMeaningfulTokens(trimmed),
    [trimmed]
  )
  const meetsMin =
    charCount >= limits.minChars && tokenCount >= limits.minTokens
  const needsCaptcha = !hasSession && Boolean(turnstileSiteKey)
  const canSubmit =
    meetsMin &&
    status !== "loading" &&
    !cooldownActive &&
    (!needsCaptcha || Boolean(captchaToken))

  const submit = React.useCallback(async () => {
    if (!canSubmit) return
    setStatus("loading")

    const payload: ReportIssueSubmitInput = {
      description,
      pageUrl: typeof window !== "undefined" ? window.location.href : "",
      category: "other",
      viewport:
        typeof window !== "undefined"
          ? `${window.innerWidth}x${window.innerHeight}`
          : "0x0",
      direction: dir,
      browser: typeof navigator !== "undefined" ? navigator.userAgent : "",
      hasScreenshot: false,
      captchaToken: captchaToken ?? undefined,
    }

    try {
      const res = await onSubmit(payload)
      if (res.ok) {
        setStatus("success")
        setIssueNumber(res.issueNumber)
        setCooldownUntil(Date.now() + COOLDOWN_MS)
        setDescription("")
        setCaptchaToken(null)
      } else {
        setStatus("error")
      }
    } catch {
      setStatus("error")
    }
  }, [canSubmit, captchaToken, description, dir, onSubmit])

  // Success closes the surface on its own after a beat.
  React.useEffect(() => {
    if (status !== "success") return
    const id = setTimeout(() => {
      setOpen(false)
      setStatus("idle")
      setIssueNumber(undefined)
    }, SUCCESS_CLOSE_MS)
    return () => clearTimeout(id)
  }, [status])

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (!next) {
      setStatus("idle")
      setIssueNumber(undefined)
    }
  }

  const onComposerKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      void submit()
    }
  }

  const successMessage = issueNumber
    ? t.successWithId.replace("{id}", String(issueNumber))
    : t.success

  // Empty and short both show the counter ("0/30 characters"); the placeholder
  // already says what to type, so repeating it as the hint reads as an echo.
  const hint = !meetsMin
    ? charCount < limits.minChars
      ? t.descriptionHint
          .replace("{count}", String(charCount))
          .replace("{min}", String(limits.minChars))
      : t.minHint.replace("{min}", String(limits.minChars))
    : isMobile
      ? t.readyHintMobile
      : t.readyHint

  const shared = {
    t,
    dir,
    description,
    setDescription,
    onComposerKeyDown,
    submit,
    canSubmit,
    status,
    cooldownActive,
    successMessage,
    hint,
    captcha: needsCaptcha ? (
      <TurnstileSlot
        siteKey={turnstileSiteKey as string}
        onSuccess={setCaptchaToken}
        hint={t.captchaHint}
        linkText={t.captchaLink}
        linkHref={signInHref}
      />
    ) : null,
  } satisfies SurfaceProps

  return (
    <>
      <TriggerButton
        variant={variant}
        label={t.triggerText}
        ariaLabel={t.triggerAriaLabel}
        onClick={() => setOpen(true)}
        iconClassName={iconClassName}
        iconStrokeWidth={iconStrokeWidth}
      />

      {isMobile ? (
        <MobileSheet open={open} onOpenChange={handleOpenChange} {...shared} />
      ) : (
        <DesktopDialog
          open={open}
          onOpenChange={handleOpenChange}
          {...shared}
        />
      )}
    </>
  )
}

// ─── surfaces ──────────────────────────────────────────────────────────────

interface SurfaceProps {
  t: ReportDict
  dir: "ltr" | "rtl"
  description: string
  setDescription: (v: string) => void
  onComposerKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
  submit: () => Promise<void>
  canSubmit: boolean
  status: Status
  cooldownActive: boolean
  successMessage: string
  hint: string
  captcha: React.ReactNode
}

interface OpenProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const inputClass =
  "border-input placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-md border bg-transparent px-3 py-2 text-sm focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"

function DesktopDialog({
  open,
  onOpenChange,
  t,
  dir,
  description,
  setDescription,
  onComposerKeyDown,
  submit,
  canSubmit,
  status,
  cooldownActive,
  successMessage,
  hint,
  captcha,
}: SurfaceProps & OpenProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir={dir} className="sm:max-w-md">
        <DialogHeader className={dir === "rtl" ? "sm:text-right" : undefined}>
          <DialogTitle>{t.title}</DialogTitle>
          <DialogDescription>{t.description}</DialogDescription>
        </DialogHeader>

        <textarea
          className={`${inputClass} min-h-[120px]`}
          placeholder={t.descriptionPlaceholder}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onKeyDown={onComposerKeyDown}
          maxLength={REPORT_LIMITS.maxChars}
          autoFocus
          aria-label={t.title}
        />
        <p className="text-muted-foreground text-xs" aria-live="polite">
          {hint}
        </p>

        {captcha}

        {status === "error" && (
          <p className="text-destructive text-sm" role="alert">
            {t.error}
          </p>
        )}
        {cooldownActive && status !== "success" && (
          <p className="text-muted-foreground text-xs">{t.cooldown}</p>
        )}

        {status === "success" ? (
          <p className="text-sm text-green-600" role="status">
            {successMessage}
          </p>
        ) : (
          <Button onClick={() => void submit()} disabled={!canSubmit}>
            {status === "loading" ? t.submitting : t.submit}
          </Button>
        )}
      </DialogContent>
    </Dialog>
  )
}

function MobileSheet({
  open,
  onOpenChange,
  t,
  dir,
  description,
  setDescription,
  onComposerKeyDown,
  submit,
  canSubmit,
  status,
  cooldownActive,
  successMessage,
  hint,
  captcha,
}: SurfaceProps & OpenProps) {
  const keyboardInset = useKeyboardInset(open)
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)
  useAutogrow(textareaRef, description, open)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        dir={dir}
        className="h-[calc(100dvh-2.5rem)] gap-0 rounded-t-2xl border-0 p-0 [&>button]:hidden"
        style={{ paddingBottom: keyboardInset }}
      >
        <div className="flex h-full flex-col">
          {/* Title — centred like the reference, no close control up here. */}
          <div className="shrink-0 px-4 pt-5 pb-3 text-center">
            <SheetTitle className="text-base font-semibold">
              {t.title}
            </SheetTitle>
            <SheetDescription className="sr-only">
              {t.description}
            </SheetDescription>
          </div>

          {/* State area — quiet until there is something to say. */}
          <div
            className="text-muted-foreground flex min-h-0 flex-1 flex-col justify-end gap-3 overflow-y-auto px-5 pb-4 text-sm"
            aria-live="polite"
          >
            {status === "success" ? (
              <div className="flex items-center gap-2 text-green-600">
                <Check className="size-4 shrink-0" />
                <span>{successMessage}</span>
              </div>
            ) : (
              <>
                {captcha}
                {status === "error" && (
                  <p className="text-destructive" role="alert">
                    {t.error}
                  </p>
                )}
                {cooldownActive && <p className="text-xs">{t.cooldown}</p>}
                <p className="text-xs">
                  {status === "loading"
                    ? t.submitting
                    : description.trim().length === 0
                      ? t.emptyState
                      : hint}
                </p>
              </>
            )}
          </div>

          {/* Composer — the pill sits right above the keyboard. */}
          <div className="shrink-0 px-3 pt-1 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <div className="flex items-end gap-2">
              <div className="bg-muted flex min-w-0 flex-1 items-end gap-2 rounded-[1.5rem] px-3.5 py-2 shadow-xs">
                <Bug
                  className="text-muted-foreground mb-1.5 size-5 shrink-0"
                  aria-hidden
                />
                <textarea
                  ref={textareaRef}
                  rows={1}
                  className="text-foreground placeholder:text-muted-foreground max-h-40 min-h-7 w-full resize-none bg-transparent py-1 text-base leading-6 outline-none"
                  placeholder={t.composerPlaceholder}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onKeyDown={onComposerKeyDown}
                  maxLength={REPORT_LIMITS.maxChars}
                  autoFocus
                  aria-label={t.title}
                  enterKeyHint="enter"
                />
                <button
                  type="button"
                  onClick={() => void submit()}
                  disabled={!canSubmit}
                  aria-label={t.send}
                  className={cn(
                    "mb-0.5 flex size-8 shrink-0 items-center justify-center rounded-full transition-colors",
                    "bg-primary text-primary-foreground",
                    "disabled:bg-muted-foreground/25 disabled:text-background"
                  )}
                >
                  <ArrowUp className="size-4" strokeWidth={2.5} />
                </button>
              </div>
              <SheetClose asChild>
                <button
                  type="button"
                  aria-label={t.close}
                  className="bg-muted text-foreground flex size-12 shrink-0 items-center justify-center rounded-full shadow-xs"
                >
                  <X className="size-5" />
                </button>
              </SheetClose>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ─── internals ─────────────────────────────────────────────────────────────

function TriggerButton({
  variant,
  label,
  ariaLabel,
  onClick,
  iconClassName,
  iconStrokeWidth,
}: {
  variant: "text" | "icon"
  label: string
  ariaLabel: string
  onClick: () => void
  iconClassName?: string
  iconStrokeWidth?: number
}) {
  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={ariaLabel}
        className={
          iconClassName
            ? "hover:bg-accent/50 inline-flex h-8 w-8 items-center justify-center rounded-full"
            : "hover:bg-accent inline-flex h-9 w-9 items-center justify-center rounded-md"
        }
      >
        <Bug
          className={iconClassName || "h-4 w-4"}
          strokeWidth={iconStrokeWidth}
        />
      </button>
    )
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline cursor-pointer font-medium underline underline-offset-4"
    >
      {label}
    </button>
  )
}

interface TurnstileSlotProps {
  siteKey: string
  onSuccess: (token: string) => void
  hint: string
  linkText: string
  linkHref: string
}

/**
 * Lazy at module scope: a component created inside render is a new type on
 * every render and remounts the widget. The captcha bundle still loads only
 * the first time an anonymous reporter opens the dialog.
 */
const Turnstile = React.lazy(async () => {
  const mod = await import("@marsidev/react-turnstile")
  return { default: mod.Turnstile }
})

function TurnstileSlot({
  siteKey,
  onSuccess,
  hint,
  linkText,
  linkHref,
}: TurnstileSlotProps) {
  return (
    <div className="space-y-2">
      <React.Suspense fallback={<div className="h-16" />}>
        <Turnstile
          siteKey={siteKey}
          onSuccess={onSuccess}
          options={{ size: "flexible", theme: "auto" }}
        />
      </React.Suspense>
      <p className="text-muted-foreground text-xs">
        {hint}{" "}
        <a className="underline" href={linkHref}>
          {linkText}
        </a>
      </p>
    </div>
  )
}

/**
 * Mirror of the server's HF6 token count so the send button never enables on
 * "asdf asdf asdf" — the server would silently reject it and the user would
 * see a success toast for nothing.
 */
function countMeaningfulTokens(text: string): number {
  return new Set(
    text
      .toLowerCase()
      .replace(/[ً-ٰ]/g, "")
      .split(/[\s\p{P}]+/u)
      .filter((token) => token.length >= 2)
  ).size
}

/**
 * True while the cooldown `until` (epoch ms) is still running. The render
 * stays pure: no clock read, only "which cooldown has already lapsed", which
 * the timer records so the submit button comes back on its own.
 */
function useCooldown(until: number | null): boolean {
  const [lapsed, setLapsed] = React.useState<number | null>(null)
  React.useEffect(() => {
    if (until === null) return
    const remaining = Math.max(0, until - Date.now())
    const id = setTimeout(() => setLapsed(until), remaining + 50)
    return () => clearTimeout(id)
  }, [until])
  return until !== null && lapsed !== until
}

/**
 * Height of the on-screen keyboard (plus any browser chrome it displaces),
 * from the visual viewport. 0 when closed or unsupported.
 */
function useKeyboardInset(active: boolean): number {
  const [inset, setInset] = React.useState(0)
  React.useEffect(() => {
    if (!active || typeof window === "undefined") return
    const vv = window.visualViewport
    if (!vv) return
    const update = () => {
      const next = Math.max(
        0,
        Math.round(window.innerHeight - vv.height - vv.offsetTop)
      )
      setInset(next)
    }
    update()
    vv.addEventListener("resize", update)
    vv.addEventListener("scroll", update)
    return () => {
      vv.removeEventListener("resize", update)
      vv.removeEventListener("scroll", update)
      setInset(0)
    }
  }, [active])
  return active ? inset : 0
}

/** Grows the composer with its content up to a cap; `field-sizing` is not in Safari yet. */
function useAutogrow(
  ref: React.RefObject<HTMLTextAreaElement | null>,
  value: string,
  enabled: boolean
) {
  React.useLayoutEffect(() => {
    const el = ref.current
    if (!el || !enabled) return
    el.style.height = "auto"
    el.style.height = `${Math.min(el.scrollHeight, COMPOSER_MAX_HEIGHT_PX)}px`
  }, [ref, value, enabled])
}

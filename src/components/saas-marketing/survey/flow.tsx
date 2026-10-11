// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

"use client"

/**
 * One question per screen. Answering flips the screen up to the next one —
 * the card tilts back and rises out while the next rises in from below —
 * so every question sits alone in the centre. Vertical on purpose: it reads
 * the same in Arabic and English. Look and easing borrowed from space's
 * booking flow (cards, `cubic-bezier(0.16, 1, 0.3, 1)`, the error shake).
 *
 * Keys: Enter / ↓ next · ↑ back · A–K pick an option · 1–5 rate.
 */
import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Check, ChevronDown, ChevronUp, Clock } from "lucide-react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"

import { cn } from "@/lib/utils"
import { LangSwitcher } from "@/components/template/marketing-header/lang-switcher"

import { submitSurvey } from "./actions"
import {
  EMAIL_PATTERN,
  isAnswered,
  otherKey,
  SURVEY_ID,
  visibleQuestions,
  type Answers,
  type Question,
} from "./config"
import type { SurveyDictionary } from "./dictionary"
import { Choices, KEYS, OpenText, Scale } from "./fields"

const EASE = [0.16, 1, 0.3, 1] as const
const STORAGE_KEY = `survey:${SURVEY_ID}`
const AUTO_ADVANCE_MS = 380

const flip = {
  enter: (d: number) => ({
    y: d > 0 ? "42%" : "-42%",
    rotateX: d > 0 ? -16 : 16,
    scale: 0.94,
    opacity: 0,
  }),
  center: {
    y: 0,
    rotateX: 0,
    scale: 1,
    opacity: 1,
    transition: { duration: 0.6, ease: EASE },
  },
  exit: (d: number) => ({
    y: d > 0 ? "-32%" : "32%",
    rotateX: d > 0 ? 14 : -14,
    scale: 0.94,
    opacity: 0,
    transition: { duration: 0.38, ease: [0.4, 0, 1, 1] as const },
  }),
}

const fade = {
  enter: { opacity: 0 },
  center: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
}

const SHAKE: Keyframe[] = [
  { transform: "none" },
  { transform: "translateX(-8px)" },
  { transform: "translateX(7px)" },
  { transform: "translateX(-4px)" },
  { transform: "translateX(2px)" },
  { transform: "none" },
]

const Turnstile = React.lazy(async () => {
  const mod = await import("@marsidev/react-turnstile")
  return { default: mod.Turnstile }
})

interface Props {
  dictionary: SurveyDictionary
  lang: string
  turnstileSiteKey?: string
}

export function SurveyFlow({ dictionary: t, lang, turnstileSiteKey }: Props) {
  const reduce = useReducedMotion()
  const [answers, setAnswers] = React.useState<Answers>({})
  // 0 = welcome · 1..total = questions · total + 1 = thanks
  const [index, setIndex] = React.useState(0)
  const [direction, setDirection] = React.useState(1)
  const [error, setError] = React.useState<string | null>(null)
  const [captcha, setCaptcha] = React.useState<string>()
  const [honeypot, setHoneypot] = React.useState("")
  const [finePointer, setFinePointer] = React.useState(false)
  const [pending, startTransition] = React.useTransition()

  const screenRef = React.useRef<HTMLDivElement>(null)
  const timer = React.useRef<ReturnType<typeof setTimeout>>(undefined)

  const questions = React.useMemo(() => visibleQuestions(answers), [answers])
  const total = questions.length
  const question: Question | undefined = questions[index - 1]
  const done = index > total

  // Restore an unfinished run (a reload mid-survey keeps its answers).
  React.useEffect(() => {
    setFinePointer(window.matchMedia("(pointer: fine)").matches)
    try {
      const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "null")
      if (saved?.answers) {
        setAnswers(saved.answers)
        setIndex(Math.max(0, Math.min(saved.index ?? 0, 16)))
      }
    } catch {}
  }, [])

  React.useEffect(() => {
    if (index < 1 || done) return
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ answers, index }))
    } catch {}
  }, [answers, index, done])

  React.useEffect(() => () => clearTimeout(timer.current), [])

  const go = React.useCallback((to: number, dir: number) => {
    clearTimeout(timer.current)
    setError(null)
    setDirection(dir)
    setIndex(to)
  }, [])

  const shake = React.useCallback(() => {
    if (reduce) return
    screenRef.current?.animate(SHAKE, { duration: 480, easing: "ease-out" })
  }, [reduce])

  const errorFor = (q: Question, a: Answers) => {
    if (q.type === "email") return t.errors.email
    const v = a[q.id]
    const picked = Array.isArray(v) ? v : [v]
    if (q.other && picked.includes(q.other) && !a[otherKey(q.id)]) {
      return t.errors.other
    }
    return t.errors.required
  }

  const submit = (a: Answers) => {
    startTransition(async () => {
      const res = await submitSurvey({
        answers: a,
        locale: lang,
        website: honeypot,
        captchaToken: captcha,
      })
      if (res.ok) {
        try {
          sessionStorage.removeItem(STORAGE_KEY)
        } catch {}
        go(visibleQuestions(a).length + 1, 1)
      } else {
        setError(
          res.error === "invalid" ? t.errors.generic : t.errors[res.error]
        )
        shake()
      }
    })
  }

  /** Validate the screen at `from` against `a`, then flip forward. */
  const advance = (from: number, a: Answers) => {
    const list = visibleQuestions(a)
    if (from === 0) return go(1, 1)
    const q = list[from - 1]
    if (!q || pending) return
    if (!isAnswered(q, a)) {
      setError(errorFor(q, a))
      shake()
      return
    }
    if (from === list.length) return submit(a)
    go(from + 1, 1)
  }

  const back = () => {
    if (index > 1 && !done) go(index - 1, -1)
  }

  const update = (patch: Answers) => {
    setError(null)
    setAnswers((prev) => ({ ...prev, ...patch }))
  }

  /** A pick that completes the screen flips on its own after a beat. */
  const autoAdvance = (next: Answers) => {
    clearTimeout(timer.current)
    const from = index
    // Never auto-submit: the last screen waits for the button.
    if (from >= visibleQuestions(next).length) return
    timer.current = setTimeout(() => advance(from, next), AUTO_ADVANCE_MS)
  }

  const pick = (q: Question, option: string) => {
    if (q.type === "multi") {
      const current = (answers[q.id] as string[] | undefined) ?? []
      let next = current.includes(option)
        ? current.filter((o) => o !== option)
        : [...current, option]
      if (q.exclusive) {
        next =
          option === q.exclusive && next.includes(option)
            ? [option]
            : next.filter((o) => o !== q.exclusive)
      }
      update({ [q.id]: next })
      return
    }
    const next = { ...answers, [q.id]: option }
    update({ [q.id]: option })
    if (option !== q.other) autoAdvance(next)
  }

  const rate = (q: Question, n: number) => {
    const next = { ...answers, [q.id]: n }
    update({ [q.id]: n })
    autoAdvance(next)
  }

  // Keyboard — one listener, always reading the latest render.
  const onKey = React.useRef<(e: KeyboardEvent) => void>(() => {})
  React.useEffect(() => {
    onKey.current = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.isComposing) return
      const el = e.target as HTMLElement
      const typing =
        el.tagName === "TEXTAREA" ||
        (el.tagName === "INPUT" &&
          !["radio", "checkbox"].includes((el as HTMLInputElement).type))

      if (e.key === "Enter" && !e.shiftKey) {
        if (done || el.tagName === "BUTTON" || el.tagName === "A") return
        e.preventDefault()
        advance(index, answers)
        return
      }
      if (typing || done) return

      if (e.key === "ArrowDown" || e.key === "PageDown") {
        e.preventDefault()
        advance(index, answers)
      } else if (e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault()
        back()
      } else if (
        question?.type === "scale" &&
        /^(Digit|Numpad)[1-5]$/.test(e.code)
      ) {
        rate(question, Number(e.code.slice(-1)))
      } else if (question?.options && /^Key[A-Z]$/.test(e.code)) {
        const option = question.options[KEYS.indexOf(e.code.slice(3))]
        if (option) {
          e.preventDefault()
          pick(question, option)
        }
      }
    }
  })
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => onKey.current(e)
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  // Each flip hands focus to the new screen, so screen readers hear it.
  React.useEffect(() => {
    const screen = screenRef.current
    // A text screen's autoFocus already put the caret in the field — keep it.
    if (screen && !screen.contains(document.activeElement)) {
      screen.focus({ preventScroll: true })
    }
  }, [index])

  const variants = reduce ? fade : flip
  const progress = done ? 1 : total ? (index - 1) / total : 0
  const isLast = index === total
  const textAutoFocus = finePointer

  const counter = t.nav.counter
    .replace("{n}", String(index))
    .replace("{total}", String(total))

  return (
    <div className="bg-background text-foreground fixed inset-0 z-40 flex h-dvh flex-col overflow-hidden">
      <header className="relative flex h-14 shrink-0 items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href={`/${lang}`}
          className="flex items-center gap-2 font-bold"
          aria-label={lang === "ar" ? "بالقلم" : "balqalam"}
        >
          <Image
            src="/feather.png"
            alt=""
            width={18}
            height={18}
            className="dark:invert"
          />
          <span>{lang === "ar" ? "بالقلم" : "balqalam"}</span>
        </Link>
        <div className="flex items-center gap-3">
          {question && (
            <span className="text-muted-foreground text-sm tabular-nums">
              {counter}
            </span>
          )}
          <LangSwitcher />
        </div>
        <div className="bg-foreground/8 absolute inset-x-0 bottom-0 h-1">
          <motion.div
            className="bg-foreground h-full origin-left rtl:origin-right"
            initial={false}
            animate={{ scaleX: progress }}
            transition={{ duration: 0.6, ease: EASE }}
          />
        </div>
      </header>

      <main className="relative flex-1 [perspective:1400px]">
        <AnimatePresence initial={false} custom={direction}>
          <motion.section
            key={done ? "thanks" : (question?.id ?? "welcome")}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            className="absolute inset-0 overflow-y-auto overscroll-contain"
          >
            <div className="grid min-h-full place-items-center px-4 py-10 sm:px-6">
              <div
                // Callback ref: the exiting screen unmounting must not null it.
                ref={(el) => {
                  if (el) screenRef.current = el
                }}
                tabIndex={-1}
                className="w-full max-w-xl outline-none"
              >
                {index === 0 ? (
                  <Welcome t={t} onStart={() => go(1, 1)} />
                ) : done ? (
                  <Thanks
                    t={t}
                    lang={lang}
                    emailed={typeof answers.email === "string"}
                  />
                ) : question ? (
                  <QuestionScreen
                    t={t}
                    n={index}
                    question={question}
                    answers={answers}
                    textAutoFocus={textAutoFocus}
                    onPick={(o) => pick(question, o)}
                    onRate={(n) => rate(question, n)}
                    onText={(v) => update({ [question.id]: v })}
                    onOther={(v) => update({ [otherKey(question.id)]: v })}
                  />
                ) : null}
              </div>
            </div>
          </motion.section>
        </AnimatePresence>
      </main>

      {question && !done && (
        <footer className="shrink-0 px-4 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6">
          <div className="mx-auto flex max-w-xl flex-col gap-2">
            {isLast && turnstileSiteKey && (
              <React.Suspense fallback={null}>
                <Turnstile
                  siteKey={turnstileSiteKey}
                  onSuccess={setCaptcha}
                  options={{ size: "flexible", theme: "auto" }}
                />
              </React.Suspense>
            )}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => advance(index, answers)}
                disabled={pending}
                className="bg-foreground text-background inline-flex h-12 items-center gap-2 rounded-full px-6 font-semibold transition-[opacity,transform] active:scale-95 disabled:opacity-60"
              >
                {isLast
                  ? pending
                    ? t.nav.submitting
                    : t.nav.submit
                  : t.nav.next}
                {!isLast && <Check className="size-4" aria-hidden />}
              </button>
              <span className="text-muted-foreground hidden text-xs [@media(pointer:fine)]:inline">
                {t.nav.pressEnter}
              </span>
              <p
                role="alert"
                className="text-destructive min-w-0 flex-1 truncate text-sm"
              >
                {error}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  aria-label={t.nav.back}
                  onClick={back}
                  disabled={index <= 1}
                  className="bg-foreground/8 hover:bg-foreground/12 grid size-11 place-items-center rounded-full transition-colors disabled:opacity-30"
                >
                  <ChevronUp className="size-5" />
                </button>
                <button
                  type="button"
                  aria-label={isLast ? t.nav.submit : t.nav.next}
                  onClick={() => advance(index, answers)}
                  disabled={pending}
                  className="bg-foreground/8 hover:bg-foreground/12 grid size-11 place-items-center rounded-full transition-colors disabled:opacity-30"
                >
                  <ChevronDown className="size-5" />
                </button>
              </div>
            </div>
          </div>
        </footer>
      )}

      {/* Honeypot — people never see or fill it. */}
      <div aria-hidden className="sr-only">
        <input
          tabIndex={-1}
          autoComplete="off"
          name="website"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
        />
      </div>
    </div>
  )
}

function Welcome({ t, onStart }: { t: SurveyDictionary; onStart: () => void }) {
  return (
    <div className="flex flex-col items-start gap-6">
      <h1 className="text-4xl leading-tight font-bold text-balance sm:text-5xl">
        {t.welcome.title}
      </h1>
      <p className="text-muted-foreground text-lg leading-relaxed text-pretty">
        {t.welcome.body}
      </p>
      <p className="text-muted-foreground flex items-center gap-2 text-sm">
        <Clock className="size-4" aria-hidden />
        {t.welcome.duration} · {t.welcome.privacy}
      </p>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onStart}
          className="bg-foreground text-background inline-flex h-13 items-center gap-2 rounded-full px-8 text-lg font-semibold transition-transform active:scale-95"
        >
          {t.welcome.start}
          <ArrowLeft className="size-5 ltr:rotate-180" aria-hidden />
        </button>
        <span className="text-muted-foreground hidden text-xs [@media(pointer:fine)]:inline">
          {t.nav.pressEnter}
        </span>
      </div>
    </div>
  )
}

function Thanks({
  t,
  lang,
  emailed,
}: {
  t: SurveyDictionary
  lang: string
  emailed: boolean
}) {
  return (
    <div className="flex flex-col items-center gap-5 text-center">
      <span className="bg-foreground text-background animate-in zoom-in-50 grid size-20 place-items-center rounded-full duration-500 motion-reduce:animate-none">
        <Check className="size-10" strokeWidth={2.5} aria-hidden />
      </span>
      <h1 className="text-3xl font-bold sm:text-4xl">{t.thanks.title}</h1>
      <p className="text-muted-foreground max-w-md text-lg text-pretty">
        {t.thanks.body} {emailed && t.thanks.bodyEmail}
      </p>
      <Link
        href={`/${lang}`}
        className="border-input hover:border-foreground/40 mt-2 inline-flex h-11 items-center rounded-full border px-6 font-medium transition-colors"
      >
        {t.thanks.home}
      </Link>
    </div>
  )
}

interface QuestionScreenProps {
  t: SurveyDictionary
  n: number
  question: Question
  answers: Answers
  textAutoFocus: boolean
  onPick: (option: string) => void
  onRate: (n: number) => void
  onText: (value: string) => void
  onOther: (value: string) => void
}

function QuestionScreen({
  t,
  n,
  question: q,
  answers,
  textAutoFocus,
  onPick,
  onRate,
  onText,
  onOther,
}: QuestionScreenProps) {
  const copy = t.questions[q.id as keyof SurveyDictionary["questions"]] as {
    title: string
    hint?: string
    options?: Record<string, string>
    low?: string
    high?: string
  }
  const hint =
    q.type === "multi"
      ? t.nav.multiHint
      : q.optional
        ? t.nav.optional
        : copy.hint

  const value = answers[q.id]
  const text = typeof value === "string" ? value : ""
  const valid = q.type !== "email" || EMAIL_PATTERN.test(text.trim())

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p className="text-muted-foreground text-sm font-medium">
          {t.sections[q.section]}
        </p>
        <h1
          id={`q-${q.id}`}
          className="flex gap-3 text-2xl leading-snug font-bold text-balance sm:text-3xl"
        >
          <span className="text-muted-foreground mt-1.5 flex shrink-0 items-center gap-1 text-base font-semibold tabular-nums">
            {n}
            <ArrowLeft className="size-3.5 ltr:rotate-180" aria-hidden />
          </span>
          <span>{copy.title}</span>
        </h1>
        {hint && <p className="text-muted-foreground text-sm">{hint}</p>}
      </div>

      {(q.type === "single" || q.type === "multi") && (
        <Choices
          question={q}
          labels={copy.options ?? {}}
          value={value as string | string[] | undefined}
          other={(answers[otherKey(q.id)] as string) ?? ""}
          otherLabel={t.nav.otherPlaceholder}
          onPick={onPick}
          onOther={onOther}
        />
      )}
      {q.type === "scale" && (
        <Scale
          question={q}
          value={value as number | undefined}
          low={copy.low ?? ""}
          high={copy.high ?? ""}
          onPick={onRate}
        />
      )}
      {(q.type === "text" || q.type === "email") && (
        <div className="flex flex-col gap-2">
          <OpenText
            question={q}
            value={text}
            placeholder={
              q.type === "email"
                ? t.nav.emailPlaceholder
                : t.nav.textPlaceholder
            }
            autoFocus={textAutoFocus}
            onChange={onText}
          />
          {q.type === "text" && (
            <p className="text-muted-foreground hidden text-xs [@media(pointer:fine)]:block">
              {t.nav.shiftEnter}
            </p>
          )}
          {q.type === "email" && text && (
            <Check
              aria-hidden
              className={cn(
                "size-5 self-end transition-opacity",
                valid ? "opacity-100" : "opacity-0"
              )}
            />
          )}
        </div>
      )}
    </div>
  )
}

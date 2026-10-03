"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { useRouter } from "next/navigation"

import { i18n } from "@/components/internationalization/config"

import { forgetDraft, peekDraft, type DraftResult } from "./draft-store"

/**
 * Wizard runtime — what makes "Next" answer in the same frame.
 *
 * Before: Next awaited the step's Server Action, then `router.push`ed (often
 * without a locale, so the proxy bounced it through a redirect), then the
 * next step fetched its RSC payload — two or three serial round trips per
 * click. Now:
 *
 * - **navigate** — inside one wizard, steps switch with
 *   `window.history.pushState` (Next 16 keeps `usePathname` in sync; the
 *   layout picks the step component from the path), so no request at all.
 *   Every href gets its `/${locale}` prefix here, which kills the redirect.
 * - **advance** — starts the step's save, waits a few ms so a client-side
 *   validation failure (which rejects before any request) keeps the user on
 *   the step with its errors, then moves on while the save finishes.
 * - **saves are ordered after the draft INSERT** — a draft opened from "+"
 *   (`draft-store.ts`) is written in the background; nothing runs before it
 *   lands. Saves of the same step run in order; different steps write
 *   different columns and run side by side.
 * - **a failed save brings its step back** — the form has already toasted
 *   the reason; the step is still mounted, typed values intact.
 * - **drain** — the final Create waits for every outstanding save first.
 */

type Job = () => Promise<unknown> | unknown

interface WizardRuntimeValue {
  /** Steps switch in the browser (the layout renders them from the path). */
  clientSteps: boolean
  /** Locale-prefixed navigation; pushState within this wizard. */
  navigate: (href: string) => void
  /** Run `job` after the draft lands (and after earlier saves of `step`). */
  enqueue: (job: Job, returnTo?: string) => Promise<boolean>
  /** Start `job`, then go to `href` unless it fails validation at once. */
  advance: (href: string, job: Job) => Promise<void>
  /** Wait for every outstanding save; false if one failed — and, unless
   *  `revealFailure: false`, go back to the step that failed. */
  drain: (options?: { revealFailure?: boolean }) => Promise<boolean>
  /** Saves still in flight — drives the footer's saving indicator. */
  pending: number
  /** The background draft INSERT, when this wizard was opened from "+". */
  draftCreated: Promise<DraftResult> | null
}

const WizardRuntimeContext = createContext<WizardRuntimeValue | null>(null)

/** A rejection this soon after Next is client-side validation, not the server. */
const VALIDATION_WINDOW_MS = 50

const LOCALE_PREFIX = new RegExp(`^/(${i18n.locales.join("|")})(/|$)`)

export function withLocale(href: string, locale: string): string {
  if (/^https?:\/\//.test(href) || LOCALE_PREFIX.test(href)) return href
  return `/${locale}${href.startsWith("/") ? "" : "/"}${href}`
}

interface WizardRuntimeProviderProps {
  locale: string
  /** `/${locale}${basePath}/${entityId}` — the wizard's own URL prefix */
  scope: string | null
  steps: string[]
  clientSteps: boolean
  entityId: string | null
  children: ReactNode
}

export function WizardRuntimeProvider({
  locale,
  scope,
  steps,
  clientSteps,
  entityId,
  children,
}: WizardRuntimeProviderProps) {
  const router = useRouter()
  const [draftCreated] = useState(() => peekDraft(entityId)?.created ?? null)
  const fatalRef = useRef(false)
  // Every save waits on this; a failed draft INSERT fails them all.
  const [head] = useState<Promise<unknown>>(() =>
    draftCreated
      ? draftCreated.then((result) => {
          if (!result.success) fatalRef.current = true
        })
      : Promise.resolve()
  )
  const headRef = useRef(head)
  const chainsRef = useRef(new Map<string, Promise<unknown>>())
  const inflightRef = useRef(new Set<Promise<boolean>>())
  const failedRef = useRef<string | null>(null)
  const [pending, setPending] = useState(0)

  // The draft store has done its job once this wizard holds the promise.
  useEffect(() => {
    if (draftCreated && entityId) forgetDraft(entityId)
  }, [draftCreated, entityId])

  const navigate = useCallback(
    (href: string) => {
      const url = withLocale(href, locale)
      const path = url.split(/[?#]/)[0]
      if (typeof window !== "undefined" && window.location.pathname === path)
        return
      const isOwnStep =
        clientSteps &&
        !!scope &&
        path.startsWith(`${scope}/`) &&
        steps.includes(path.slice(scope.length + 1))
      if (isOwnStep) {
        window.history.pushState(null, "", url)
      } else {
        router.push(url)
      }
    },
    [locale, clientSteps, scope, steps, router]
  )

  const enqueue = useCallback(
    (job: Job, returnTo?: string): Promise<boolean> => {
      const key = returnTo ?? ""
      const previous = chainsRef.current.get(key) ?? headRef.current
      const run = Promise.all([headRef.current, previous]).then(
        async () => {
          if (fatalRef.current) return false
          try {
            await job()
            if (returnTo && failedRef.current === returnTo)
              failedRef.current = null
            return true
          } catch {
            if (returnTo) {
              failedRef.current ??= returnTo
              navigate(returnTo)
            }
            return false
          }
        },
        () => false
      )
      chainsRef.current.set(key, run)
      inflightRef.current.add(run)
      setPending((n) => n + 1)
      run.finally(() => {
        inflightRef.current.delete(run)
        if (chainsRef.current.get(key) === run) chainsRef.current.delete(key)
        setPending((n) => n - 1)
      })
      return run
    },
    [navigate]
  )

  const advance = useCallback(
    async (href: string, job: Job) => {
      const returnTo = window.location.pathname
      const run = enqueue(job, returnTo)
      const settledEarly = await Promise.race([
        run.then((ok) => ({ ok })),
        new Promise<null>((resolve) =>
          setTimeout(() => resolve(null), VALIDATION_WINDOW_MS)
        ),
      ])
      if (settledEarly && !settledEarly.ok) return
      navigate(href)
    },
    [enqueue, navigate]
  )

  const drain = useCallback(
    async ({ revealFailure = true }: { revealFailure?: boolean } = {}) => {
      await Promise.all([headRef.current, ...inflightRef.current])
      if (fatalRef.current) return false
      if (failedRef.current) {
        if (revealFailure) navigate(failedRef.current)
        return false
      }
      return true
    },
    [navigate]
  )

  // Closing the tab mid-save would lose the step the user just left.
  useEffect(() => {
    if (pending === 0) return
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault()
    }
    window.addEventListener("beforeunload", warn)
    return () => window.removeEventListener("beforeunload", warn)
  }, [pending])

  const value = useMemo<WizardRuntimeValue>(
    () => ({
      clientSteps,
      navigate,
      enqueue,
      advance,
      drain,
      pending,
      draftCreated,
    }),
    [clientSteps, navigate, enqueue, advance, drain, pending, draftCreated]
  )

  return (
    <WizardRuntimeContext.Provider value={value}>
      {children}
    </WizardRuntimeContext.Provider>
  )
}

/** The runtime of the enclosing WizardLayout, or null outside one. */
export function useWizardRuntime(): WizardRuntimeValue | null {
  return useContext(WizardRuntimeContext)
}

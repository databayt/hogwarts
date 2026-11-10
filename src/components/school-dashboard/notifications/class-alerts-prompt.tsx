"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useState, useSyncExternalStore } from "react"
import { BellRing } from "lucide-react"

import { cn } from "@/lib/utils"

import type { ClassAlertsLabels } from "./class-alerts-labels"
import { useWebPush } from "./use-web-push"

const DISMISS_KEY = "class-alerts-dismissed-at"
const DISMISS_DAYS = 3

// "Later" as an external store: null on the server (render nothing), the
// stored answer on the client — read during render, never set in an effect.
const listeners = new Set<() => void>()
/** Storage can be blocked (private mode); "Later" must still work this visit. */
let dismissedInMemory = false
function subscribe(onChange: () => void) {
  listeners.add(onChange)
  return () => {
    listeners.delete(onChange)
  }
}
function isDismissed(): boolean {
  if (dismissedInMemory) return true
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY) ?? 0)
    return at > 0 && Date.now() - at < DISMISS_DAYS * 86_400_000
  } catch {
    return false
  }
}
const dismissedOnServer = () => true

/**
 * "Turn on class alerts", offered where people actually are — the pre-join
 * card, the dashboard's banner, the join link's waiting page.
 *
 * The switch existed only as a card inside notification preferences, and a
 * whole school went online with not one person subscribed: every reminder was
 * written, none reached a phone. This is the same switch (`useWebPush`), one
 * tap from the class.
 *
 * It renders NOTHING when there is nothing to offer: alerts already on, a
 * browser with no Push, or a "Later" in the last three days. An iPhone outside
 * the installed app gets the one sentence that explains why there is no button.
 *
 * `tone="dark"` is for surfaces pinned dark over artwork (the title card),
 * where theme tokens would invert in light mode; `page` follows the theme.
 */
export function ClassAlertsPrompt({
  labels,
  tone = "page",
  className,
}: {
  labels: ClassAlertsLabels
  tone?: "page" | "dark"
  className?: string
}) {
  const push = useWebPush()
  const dismissed = useSyncExternalStore(
    subscribe,
    isDismissed,
    dismissedOnServer
  )
  const [outcome, setOutcome] = useState<"done" | "failed" | null>(null)

  const dark = tone === "dark"
  const quiet = dark ? "text-white/60" : "text-muted-foreground"

  if (outcome === "done") {
    return (
      <p
        role="status"
        className={cn("text-sm", dark ? "text-white/85" : quiet, className)}
      >
        {labels.done}
      </p>
    )
  }
  if (dismissed) return null
  if (
    push.state === "checking" ||
    push.state === "unsupported" ||
    push.state === "on"
  )
    return null

  const text =
    outcome === "failed"
      ? labels.failed
      : push.state === "iosInstall"
        ? labels.iosInstallFirst
        : push.state === "denied"
          ? labels.denied
          : labels.title

  const dismiss = () => {
    dismissedInMemory = true
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()))
    } catch {
      // storage blocked — the in-memory flag covers this visit
    }
    for (const l of listeners) l()
  }

  const enable = () => {
    setOutcome(null)
    void push.enable().then((result) => {
      // `denied` moves the hook's state, and the sentence follows it.
      if (result === "on") setOutcome("done")
      else if (result === "failed") setOutcome("failed")
    })
  }

  // 44px targets without growing the row: an out-of-flow ::after extends each
  // control's hit area above and below it.
  const hit =
    "relative after:absolute after:inset-x-0 after:-inset-y-2 after:content-['']"

  return (
    <div
      role="group"
      aria-label={labels.title}
      className={cn(
        "flex flex-wrap items-center gap-x-3 gap-y-2 text-start",
        className
      )}
    >
      <BellRing
        className={cn("size-4 shrink-0", dark ? "text-white/85" : quiet)}
        aria-hidden
      />
      <p
        role={outcome === "failed" ? "alert" : undefined}
        className={cn(
          "min-w-0 flex-1 basis-48 text-sm",
          dark ? "text-white/85" : quiet
        )}
      >
        {text}
      </p>
      {push.state === "off" && (
        <button
          type="button"
          onClick={enable}
          disabled={push.pending}
          className={cn(
            hit,
            "shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-opacity disabled:opacity-60",
            dark
              ? "bg-white text-black active:opacity-70"
              : "bg-foreground text-background hover:opacity-90"
          )}
        >
          {labels.enable}
        </button>
      )}
      <button
        type="button"
        onClick={dismiss}
        className={cn(
          hit,
          "shrink-0 text-sm underline-offset-4 hover:underline",
          quiet
        )}
      >
        {labels.later}
      </button>
    </div>
  )
}

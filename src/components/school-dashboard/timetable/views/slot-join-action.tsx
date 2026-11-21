"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useSyncExternalStore } from "react"

import { type Locale } from "@/components/internationalization/config"

import { JoinLinkButton } from "./join-link-button"
import { StartLiveClassButton } from "./start-live-class-button"
import { inJoinWindow } from "./use-now-ms"

/**
 * One shared 30 s clock for every cell's join control.
 *
 * The clock used to live in StudentView (`useNowMs`), so each tick re-rendered
 * the whole view and its ~50-cell grid just to re-check a handful of join
 * windows. Here it is an external store: a tick re-renders only the
 * subscribed leaves, and one interval serves them all however many there are.
 * `null` on the server and on the first client render, like `useNowMs`, so
 * nothing time-dependent renders before the clock is real.
 */
const INTERVAL_MS = 30_000
let nowMs: number | null = null
const listeners = new Set<() => void>()
let timer: ReturnType<typeof setInterval> | null = null

function tick() {
  nowMs = Date.now()
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  if (listeners.size === 1) {
    nowMs = Date.now()
    timer = setInterval(tick, INTERVAL_MS)
  }
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0 && timer) {
      clearInterval(timer)
      timer = null
    }
  }
}

function useSharedNowMs(): number | null {
  return useSyncExternalStore(
    subscribe,
    () => nowMs,
    () => null
  )
}

interface Props {
  slotId: string
  lang: Locale
  /** Today's join window for this slot (school zone); absent for other days. */
  window: { fromMs: number; untilMs: number } | undefined
  /** A room, a standing link, or an online section whose room the link opens. */
  joinable: boolean
  /** A teacher of a school that teaches live: may open an online arm. */
  canStart: boolean
  joinLabel: string
  startLabel: string
  startingLabel: string
  errorLabel: string
}

/**
 * The join/start control of one timetable cell. Cells that have no window
 * (every slot that is not today's) render nothing and never subscribe to the
 * clock.
 */
export function SlotJoinAction(props: Props) {
  if (!props.window) return null
  return <ActiveSlotJoinAction {...props} window={props.window} />
}

function ActiveSlotJoinAction({
  slotId,
  lang,
  window: w,
  joinable,
  canStart,
  joinLabel,
  startLabel,
  startingLabel,
  errorLabel,
}: Props & { window: { fromMs: number; untilMs: number } }) {
  const now = useSharedNowMs()
  // The window only exists for TODAY's slots (school zone), so this is also the
  // "is it today" check — on any device clock.
  if (!inJoinWindow(now, w)) return null
  if (joinable) {
    return <JoinLinkButton timetableId={slotId} lang={lang} label={joinLabel} />
  }
  // An in-person section of a school that teaches live: its teacher can still
  // open an online arm for this period.
  if (!canStart) return null
  return (
    <StartLiveClassButton
      timetableId={slotId}
      lang={lang}
      label={startLabel}
      startingLabel={startingLabel}
      errorLabel={errorLabel}
    />
  )
}

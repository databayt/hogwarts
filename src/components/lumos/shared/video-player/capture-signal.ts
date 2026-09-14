// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

"use client"

import { useSyncExternalStore } from "react"

/**
 * "A capture may be happening right now" — the moments the visible watermark
 * shows (Abdout, 2026-09-14: the mark should appear at recording / screenshot
 * time, not all the time).
 *
 * Read this before trusting it: **a browser never tells a page it is being
 * captured.** There is no screenshot event and no screen-recording event. What
 * a page does receive is a handful of things that tend to come right BEFORE a
 * capture, and this module turns those into one boolean:
 *
 * - **The capture chord's modifiers.** `⌘⇧3/4/5` on macOS and `Win⇧S` on
 *   Windows are eaten by the OS, but the ⌘/Win and ⇧ keydowns reach the page
 *   first, a human beat before the digit. The mark is painted by then, so a
 *   full-screen grab and every region the viewer drags afterwards carry it.
 * - **PrintScreen.** Delivered on keyUP, after the OS has the image — so it
 *   marks the NEXT capture, not that one. The protection hook separately
 *   blanks the frame and clears the clipboard for this one.
 * - **Losing the window or the tab.** Opening a snipping tool, a recorder's
 *   window, the macOS screenshot toolbar or devtools all move focus away.
 * - **A Picture-in-Picture attempt**, which the player refuses anyway.
 *
 * What it cannot see: a recording that was already running when the page
 * opened, the phone's hardware screenshot buttons, `⌘⇧3` pressed faster than
 * a frame, or another camera pointed at the screen. That is exactly why the
 * watermark also keeps a FORENSIC layer that is always on — faint enough to
 * go unnoticed while watching, recoverable from any capture. The visible mark
 * is the deterrent; the forensic one is the evidence.
 *
 * One set of listeners for the whole page, however many marks subscribe: the
 * lesson player, a material viewer and a recording can be on screen together.
 */

/** How long the visible mark lingers after the last signal. A region capture
 *  takes a few seconds of dragging; a recorder takes a moment to start. */
const LINGER_MS = 8000

let suspected = false
let lingerTimer: ReturnType<typeof setTimeout> | null = null
let windowAway = false
const subscribers = new Set<() => void>()

function publish(next: boolean) {
  if (next === suspected) return
  suspected = next
  subscribers.forEach((notify) => notify())
}

/** Show now; hide LINGER_MS after the last signal, unless the window is away. */
function flag() {
  publish(true)
  if (lingerTimer) clearTimeout(lingerTimer)
  lingerTimer = setTimeout(() => {
    lingerTimer = null
    if (!windowAway) publish(false)
  }, LINGER_MS)
}

function onKeyDown(e: KeyboardEvent) {
  // The capture chords all hold a platform modifier with Shift. Ctrl+Shift is
  // left out: it is devtools and a dozen editor shortcuts on every platform,
  // and would keep the mark up during ordinary typing.
  if (e.key === "PrintScreen" || (e.metaKey && e.shiftKey)) flag()
}

function onKeyUp(e: KeyboardEvent) {
  if (e.key === "PrintScreen") flag()
}

function onAway() {
  windowAway = true
  flag()
}

/**
 * A click into one of the page's own iframes (the room's slides) also blurs
 * the window. Focus has moved INTO the page, not away from it — so once the
 * blur settles, an iframe holding focus means nothing left.
 */
function onBlur() {
  setTimeout(() => {
    if (document.activeElement?.tagName === "IFRAME") return
    if (document.hasFocus()) return
    onAway()
  }, 0)
}

function onBack() {
  windowAway =
    document.visibilityState === "hidden" ||
    (!document.hasFocus() && document.activeElement?.tagName !== "IFRAME")
  if (!windowAway) flag() // linger once more, then settle
}

function onVisibility() {
  if (document.visibilityState === "hidden") onAway()
  else onBack()
}

function install() {
  window.addEventListener("keydown", onKeyDown, true)
  window.addEventListener("keyup", onKeyUp, true)
  window.addEventListener("blur", onBlur)
  window.addEventListener("focus", onBack)
  document.addEventListener("visibilitychange", onVisibility)
  // `enterpictureinpicture` does not bubble; capture it on the way down.
  document.addEventListener("enterpictureinpicture", flag, true)
}

function uninstall() {
  window.removeEventListener("keydown", onKeyDown, true)
  window.removeEventListener("keyup", onKeyUp, true)
  window.removeEventListener("blur", onBlur)
  window.removeEventListener("focus", onBack)
  document.removeEventListener("visibilitychange", onVisibility)
  document.removeEventListener("enterpictureinpicture", flag, true)
  if (lingerTimer) clearTimeout(lingerTimer)
  lingerTimer = null
  windowAway = false
  suspected = false
}

function subscribe(notify: () => void): () => void {
  if (subscribers.size === 0) install()
  subscribers.add(notify)
  return () => {
    subscribers.delete(notify)
    if (subscribers.size === 0) uninstall()
  }
}

const getSnapshot = () => suspected
// The server never suspects anything; the mark hydrates hidden.
const getServerSnapshot = () => false

/** True while a capture may be happening. Subscribing installs the listeners. */
export function useCaptureSuspected(enabled = true): boolean {
  const value = useSyncExternalStore(
    enabled ? subscribe : noopSubscribe,
    getSnapshot,
    getServerSnapshot
  )
  return enabled && value
}

function noopSubscribe(): () => void {
  return () => {}
}

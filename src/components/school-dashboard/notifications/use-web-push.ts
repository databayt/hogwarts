"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useCallback, useEffect, useState, useTransition } from "react"

import {
  isWebPushSubscribed,
  subscribeWebPush,
  unsubscribeWebPush,
} from "./push-actions"

export type WebPushState =
  | "checking"
  | "unsupported"
  | "iosInstall"
  | "denied"
  | "off"
  | "on"

export interface WebPush {
  state: WebPushState
  pending: boolean
  /** Ask for permission and subscribe this browser. Must be called from a
   *  user gesture. `on` — this device now receives pushes; `denied` — the
   *  person (or the browser's settings) said no; `failed` — anything else. */
  enable: () => Promise<"on" | "denied" | "failed">
  disable: () => Promise<boolean>
}

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4)
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/")
  const raw = window.atob(b64)
  return Uint8Array.from(raw, (c) => c.charCodeAt(0))
}

/**
 * Whether THIS browser receives the school's pushes, and the two moves that
 * change it. One implementation for every surface that offers the switch — the
 * preferences card and the "turn on class alerts" prompt people meet where
 * they join a class. It lived inside the preferences card alone, which is why
 * a whole school could go online with nobody subscribed.
 *
 * iOS (16.4+) exposes the Push API only to an app installed on the Home
 * Screen — in Safari proper `PushManager` is simply absent — so that case is
 * its own state ("install first") rather than a dead button.
 */
export function useWebPush(): WebPush {
  const [state, setState] = useState<WebPushState>("checking")
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    let cancelled = false
    async function probe() {
      if (typeof window === "undefined") return
      const ua = navigator.userAgent
      const isIos = /iPhone|iPad|iPod/.test(ua)
      const standalone =
        (typeof window.matchMedia === "function" &&
          window.matchMedia("(display-mode: standalone)").matches) ||
        (navigator as unknown as { standalone?: boolean }).standalone === true
      const supported =
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        "Notification" in window
      if (!supported) {
        if (!cancelled)
          setState(isIos && !standalone ? "iosInstall" : "unsupported")
        return
      }
      if (Notification.permission === "denied") {
        if (!cancelled) setState("denied")
        return
      }
      try {
        const reg = await navigator.serviceWorker.getRegistration()
        const sub = await reg?.pushManager.getSubscription()
        if (!sub) {
          if (!cancelled) setState("off")
          return
        }
        const known = await isWebPushSubscribed({ endpoint: sub.endpoint })
        if (!cancelled) setState(known ? "on" : "off")
      } catch {
        if (!cancelled) setState("off")
      }
    }
    void probe()
    return () => {
      cancelled = true
    }
  }, [])

  const enable = useCallback(
    () =>
      new Promise<"on" | "denied" | "failed">((resolve) => {
        startTransition(async () => {
          try {
            const permission = await Notification.requestPermission()
            if (permission !== "granted") {
              setState("denied")
              resolve("denied")
              return
            }
            const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
            if (!key) throw new Error("VAPID public key missing")
            const reg =
              (await navigator.serviceWorker.getRegistration()) ??
              (await navigator.serviceWorker.register("/service-worker.js"))
            await navigator.serviceWorker.ready
            const sub =
              (await reg.pushManager.getSubscription()) ??
              (await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(
                  key
                ) as BufferSource,
              }))
            const json = sub.toJSON()
            const res = await subscribeWebPush({
              endpoint: sub.endpoint,
              keys: { p256dh: json.keys?.p256dh, auth: json.keys?.auth },
              userAgent: navigator.userAgent.slice(0, 512),
            })
            if (!res.success) throw new Error(res.error)
            setState("on")
            resolve("on")
          } catch (err) {
            console.error("[web-push] subscribe failed", err)
            resolve("failed")
          }
        })
      }),
    []
  )

  const disable = useCallback(
    () =>
      new Promise<boolean>((resolve) => {
        startTransition(async () => {
          try {
            const reg = await navigator.serviceWorker.getRegistration()
            const sub = await reg?.pushManager.getSubscription()
            if (sub) {
              await unsubscribeWebPush({ endpoint: sub.endpoint })
              await sub.unsubscribe()
            }
            setState("off")
            resolve(true)
          } catch (err) {
            console.error("[web-push] unsubscribe failed", err)
            resolve(false)
          }
        })
      }),
    []
  )

  return { state, pending, enable, disable }
}

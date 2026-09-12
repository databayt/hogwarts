"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useState, useTransition } from "react"
import { BellRing, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"

import {
  isWebPushSubscribed,
  subscribeWebPush,
  unsubscribeWebPush,
} from "./push-actions"

export interface WebPushLabels {
  title: string
  description: string
  enable: string
  disable: string
  enabled: string
  denied: string
  unsupported: string
  iosInstallFirst: string
  failed: string
}

type State =
  | "checking"
  | "unsupported"
  | "iosInstall"
  | "denied"
  | "off"
  | "on"

/**
 * The one switch that turns this browser into a push recipient. Permission
 * must be asked from a user gesture, so the whole flow hangs off the button.
 *
 * iOS (16.4+) exposes the Push API only to an app installed on the Home
 * Screen — in Safari proper `PushManager` is simply absent — so the card says
 * "install first" there instead of a dead button.
 */
export function WebPushToggle({ labels }: { labels: WebPushLabels }) {
  const [state, setState] = useState<State>("checking")
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    let cancelled = false
    async function probe() {
      if (typeof window === "undefined") return
      const ua = navigator.userAgent
      const isIos = /iPhone|iPad|iPod/.test(ua)
      const standalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (navigator as unknown as { standalone?: boolean }).standalone === true
      const supported =
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        "Notification" in window
      if (!supported) {
        setState(isIos && !standalone ? "iosInstall" : "unsupported")
        return
      }
      if (Notification.permission === "denied") {
        setState("denied")
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

  function urlBase64ToUint8Array(base64: string): Uint8Array {
    const padding = "=".repeat((4 - (base64.length % 4)) % 4)
    const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/")
    const raw = window.atob(b64)
    return Uint8Array.from(raw, (c) => c.charCodeAt(0))
  }

  function enable() {
    startTransition(async () => {
      try {
        const permission = await Notification.requestPermission()
        if (permission !== "granted") {
          setState("denied")
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
            applicationServerKey: urlBase64ToUint8Array(key) as BufferSource,
          }))
        const json = sub.toJSON()
        const res = await subscribeWebPush({
          endpoint: sub.endpoint,
          keys: { p256dh: json.keys?.p256dh, auth: json.keys?.auth },
          userAgent: navigator.userAgent.slice(0, 512),
        })
        if (!res.success) throw new Error(res.error)
        setState("on")
      } catch (err) {
        console.error("[web-push] subscribe failed", err)
        toast({ title: labels.failed, variant: "destructive" })
      }
    })
  }

  function disable() {
    startTransition(async () => {
      try {
        const reg = await navigator.serviceWorker.getRegistration()
        const sub = await reg?.pushManager.getSubscription()
        if (sub) {
          await unsubscribeWebPush({ endpoint: sub.endpoint })
          await sub.unsubscribe()
        }
        setState("off")
      } catch (err) {
        console.error("[web-push] unsubscribe failed", err)
        toast({ title: labels.failed, variant: "destructive" })
      }
    })
  }

  const note =
    state === "unsupported"
      ? labels.unsupported
      : state === "iosInstall"
        ? labels.iosInstallFirst
        : state === "denied"
          ? labels.denied
          : state === "on"
            ? labels.enabled
            : null

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <BellRing className="text-muted-foreground h-5 w-5" />
          <CardTitle className="text-lg">{labels.title}</CardTitle>
        </div>
        <CardDescription>{labels.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-muted-foreground text-sm">{note ?? ""}</p>
        {state === "off" && (
          <Button onClick={enable} disabled={pending} size="sm">
            {pending && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
            {labels.enable}
          </Button>
        )}
        {state === "on" && (
          <Button onClick={disable} disabled={pending} size="sm" variant="outline">
            {pending && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
            {labels.disable}
          </Button>
        )}
        {state === "checking" && (
          <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
        )}
      </CardContent>
    </Card>
  )
}

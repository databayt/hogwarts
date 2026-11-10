"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
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

import { useWebPush } from "./use-web-push"

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

/**
 * The one switch that turns this browser into a push recipient. Permission
 * must be asked from a user gesture, so the whole flow hangs off the button.
 * The logic is `useWebPush` — shared with the "turn on class alerts" prompt.
 */
export function WebPushToggle({ labels }: { labels: WebPushLabels }) {
  const { state, pending, enable: turnOn, disable: turnOff } = useWebPush()

  const enable = () => {
    void turnOn().then((result) => {
      if (result === "failed")
        toast({ title: labels.failed, variant: "destructive" })
    })
  }
  const disable = () => {
    void turnOff().then((ok) => {
      if (!ok) toast({ title: labels.failed, variant: "destructive" })
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

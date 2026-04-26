// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { ComponentProps } from "react"
import { Info, Lightbulb, OctagonAlert, TriangleAlert } from "lucide-react"

import { cn } from "@/lib/utils"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

type CalloutType = "info" | "warning" | "danger" | "tip"

interface CalloutProps extends Omit<ComponentProps<typeof Alert>, "title"> {
  type?: CalloutType
  title?: string
}

const ICONS: Record<CalloutType, typeof Info> = {
  info: Info,
  warning: TriangleAlert,
  danger: OctagonAlert,
  tip: Lightbulb,
}

const VARIANT_CLASSES: Record<CalloutType, string> = {
  info: "border-border bg-muted/40 [&>svg]:text-foreground/70",
  warning:
    "border-amber-500/30 bg-amber-500/5 [&>svg]:text-amber-600 dark:[&>svg]:text-amber-500",
  danger: "border-destructive/30 bg-destructive/5 [&>svg]:text-destructive",
  tip: "border-primary/30 bg-primary/5 [&>svg]:text-primary",
}

export function Callout({
  type = "info",
  title,
  className,
  children,
  ...props
}: CalloutProps) {
  const Icon = ICONS[type]
  return (
    <Alert
      className={cn("not-prose my-6", VARIANT_CLASSES[type], className)}
      {...props}
    >
      <Icon />
      {title && <AlertTitle>{title}</AlertTitle>}
      <AlertDescription>{children}</AlertDescription>
    </Alert>
  )
}

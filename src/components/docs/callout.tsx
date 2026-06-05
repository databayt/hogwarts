// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { ComponentProps, ReactNode } from "react"

import { cn } from "@/lib/utils"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// Mirrors ui.shadcn.com/docs <Callout> exactly: one neutral surface for every
// callout — the box never tints. An icon renders ONLY when explicitly passed in
// MDX. The legacy `type` prop is still accepted (existing content) but no longer
// drives color or an auto icon; it only maps onto shadcn's `data-variant` hook.
interface CalloutProps extends Omit<
  ComponentProps<typeof Alert>,
  "title" | "variant"
> {
  title?: string
  icon?: ReactNode
  variant?: "default" | "info" | "warning"
  /** @deprecated visual no-op — kept so existing `<Callout type=…>` content compiles */
  type?: "info" | "warning" | "danger" | "tip"
}

export function Callout({
  title,
  icon,
  variant,
  type,
  className,
  children,
  ...props
}: CalloutProps) {
  const dataVariant =
    variant ??
    (type === "warning" ? "warning" : type === "info" ? "info" : "default")

  return (
    <Alert
      data-variant={dataVariant}
      className={cn(
        "not-prose border-surface bg-surface text-surface-foreground mt-6 w-auto rounded-xl md:-mx-1 **:[code]:border",
        className
      )}
      {...props}
    >
      {icon}
      {title && <AlertTitle>{title}</AlertTitle>}
      <AlertDescription className="text-card-foreground/80">
        {children}
      </AlertDescription>
    </Alert>
  )
}

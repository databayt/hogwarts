// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Apple-Settings-style inset grouped list: one rounded container, hairline
 * dividers between rows, label on the start side and the control on the end
 * side. Every simplified configuration page builds from these two pieces so
 * the editors read as one system instead of a stack of bordered cards.
 */
import { cn } from "@/lib/utils"

interface SettingsGroupProps {
  title?: React.ReactNode
  footer?: React.ReactNode
  className?: string
  children: React.ReactNode
}

export function SettingsGroup({
  title,
  footer,
  className,
  children,
}: SettingsGroupProps) {
  return (
    <section className={cn("space-y-2", className)}>
      {title ? (
        <h3 className="text-muted-foreground px-4 text-xs font-medium">
          {title}
        </h3>
      ) : null}
      <div className="bg-card divide-border/60 divide-y overflow-hidden rounded-2xl border">
        {children}
      </div>
      {footer ? (
        <p className="text-muted-foreground px-4 text-xs leading-relaxed">
          {footer}
        </p>
      ) : null}
    </section>
  )
}

interface SettingsRowProps {
  label: React.ReactNode
  description?: React.ReactNode
  icon?: React.ReactNode
  children?: React.ReactNode
  className?: string
  /** Stack the control under the label on narrow screens. */
  stack?: boolean
}

export function SettingsRow({
  label,
  description,
  icon,
  children,
  className,
  stack,
}: SettingsRowProps) {
  return (
    <div
      className={cn(
        "flex min-h-12 items-center gap-3 px-4 py-3",
        stack && "flex-col items-stretch sm:flex-row sm:items-center",
        className
      )}
    >
      {icon ? (
        <span className="text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-lg [&_svg]:size-4">
          {icon}
        </span>
      ) : null}
      <div className="min-w-0 flex-1 text-start">
        <div className="text-sm font-medium">{label}</div>
        {description ? (
          <div className="text-muted-foreground mt-0.5 text-xs leading-relaxed">
            {description}
          </div>
        ) : null}
      </div>
      {children ? <div className="shrink-0">{children}</div> : null}
    </div>
  )
}

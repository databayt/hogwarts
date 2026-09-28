// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

/**
 * Suspense fallback for the auth forms (login, new-password, verification,
 * error). Mirrors their shared frame — a borderless 350px card with a centred
 * header, `grid gap-6` of label + input pairs, then the primary button and a
 * footer link — so the swap to the real form does not jump.
 */
export function AuthFormSkeleton({
  fields = 2,
  buttons = 1,
  buttonClassName = "h-9",
  label,
  className,
}: {
  /** label + input pairs */
  fields?: number
  /** stacked full-width buttons (the demo role picker renders one per role) */
  buttons?: number
  buttonClassName?: string
  /** Translated "Loading…" for screen readers. */
  label?: string
  className?: string
}) {
  return (
    <div
      role="status"
      aria-busy="true"
      className={cn(
        "flex w-full min-w-[280px] flex-col gap-6 p-6 md:min-w-[350px]",
        className
      )}
    >
      <span className="sr-only">{label ?? "Loading…"}</span>
      <div className="flex flex-col items-center gap-2">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-56 max-w-full" />
      </div>
      {fields > 0 && (
        <div className="grid gap-6">
          {Array.from({ length: fields }).map((_, i) => (
            <div key={i} className="grid gap-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-9 w-full" />
            </div>
          ))}
        </div>
      )}
      <div className="grid gap-4">
        {Array.from({ length: buttons }).map((_, i) => (
          <Skeleton key={i} className={cn("w-full", buttonClassName)} />
        ))}
      </div>
      <Skeleton className="mx-auto h-4 w-32" />
    </div>
  )
}

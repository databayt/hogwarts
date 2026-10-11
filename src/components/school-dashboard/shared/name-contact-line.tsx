// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import type { ReactNode } from "react"

import type { NameContact } from "@/lib/name-utils"
import { cn } from "@/lib/utils"

/**
 * The line under a person's name in a listing — the school picks email or
 * phone (School → Configuration → Contact under name). When the picked value
 * is empty the other one fills in; `empty` shows only when both are missing.
 */
export function NameContactLine({
  email,
  phone,
  prefer,
  empty,
  className,
}: {
  email: string | null
  phone: string | null
  prefer: NameContact
  empty?: ReactNode
  className?: string
}) {
  const showPhone = prefer === "phone" ? !!phone : !email && !!phone
  return (
    <span className={cn("text-muted-foreground text-xs", className)}>
      {/* bdi, not dir on the span: the line stays start-aligned under the
          name while "+249…" keeps its plus in front in Arabic. */}
      {showPhone ? (
        <bdi dir="ltr" className="tabular-nums">
          {phone}
        </bdi>
      ) : email ? (
        <bdi dir="ltr">{email}</bdi>
      ) : (
        empty
      )}
    </span>
  )
}

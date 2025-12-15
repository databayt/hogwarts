import React from "react"
import Link from "next/link"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface Props {
  primaryLabel: string
  primaryHref: string
  secondaryLabel: string
  secondaryHref: string
  className?: string
}

export function TwoButtons({
  primaryLabel,
  primaryHref,
  secondaryLabel,
  secondaryHref,
  className,
}: Props) {
  return (
    <div className={cn("flex flex-wrap gap-4", className)}>
      <Button asChild>
        <Link href={primaryHref}>{primaryLabel}</Link>
      </Button>
      <Button variant="ghost" asChild>
        <Link href={secondaryHref}>{secondaryLabel}</Link>
      </Button>
    </div>
  )
}

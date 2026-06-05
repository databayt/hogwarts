// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { ComponentProps, ReactNode } from "react"
import Link from "next/link"

import { cn } from "@/lib/utils"

type CardGridCols = 1 | 2 | 3 | 4

interface CardGridProps extends ComponentProps<"div"> {
  cols?: CardGridCols
}

const COLS: Record<CardGridCols, string> = {
  1: "md:grid-cols-1",
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
  4: "md:grid-cols-2 lg:grid-cols-4",
}

export function CardGrid({
  cols = 2,
  className,
  children,
  ...props
}: CardGridProps) {
  return (
    <div
      className={cn(
        "not-prose my-6 grid grid-cols-1 gap-4",
        COLS[cols],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

interface DocCardProps {
  title: string
  href?: string
  description?: ReactNode
  children?: ReactNode
  className?: string
}

export function DocCard({
  title,
  href,
  description,
  children,
  className,
}: DocCardProps) {
  const body = (
    <>
      <h3 className="mb-2 text-base font-medium tracking-tight">{title}</h3>
      {description && (
        <p className="text-muted-foreground text-sm leading-relaxed">
          {description}
        </p>
      )}
      {children && (
        <div className="text-muted-foreground text-sm leading-relaxed">
          {children}
        </div>
      )}
    </>
  )

  const baseClass = cn(
    "block rounded-xl bg-surface p-6 text-surface-foreground transition-colors",
    href && "hover:bg-surface/80",
    className
  )

  if (href) {
    return (
      <Link href={href} className={baseClass}>
        {body}
      </Link>
    )
  }

  return <div className={baseClass}>{body}</div>
}

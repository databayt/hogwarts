// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { forwardRef } from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

export const variantThumbnailVariants = cva(
  "relative overflow-hidden rounded-md border bg-white transition-all dark:bg-zinc-950",
  {
    variants: {
      state: {
        idle: "border-border hover:border-primary/50 hover:shadow-sm",
        selected: "border-primary ring-2 ring-primary/20",
      },
      size: {
        sm: "h-20 w-14",
        md: "h-28 w-20",
        lg: "h-36 w-26",
      },
    },
    defaultVariants: { state: "idle", size: "md" },
  }
)

interface VariantThumbnailProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof variantThumbnailVariants> {
  label?: string
}

export const VariantThumbnail = forwardRef<
  HTMLButtonElement,
  VariantThumbnailProps
>(({ className, state, size, label, children, ...props }, ref) => (
  <button
    ref={ref}
    type="button"
    className={cn(
      variantThumbnailVariants({ state, size }),
      "cursor-pointer",
      className
    )}
    {...props}
  >
    <div className="flex h-full w-full flex-col">{children}</div>
    {label && (
      <span className="bg-background/80 absolute inset-x-0 bottom-0 truncate px-1 py-0.5 text-center text-[8px]">
        {label}
      </span>
    )}
  </button>
))
VariantThumbnail.displayName = "VariantThumbnail"

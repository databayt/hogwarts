// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { forwardRef } from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

export const galleryCardVariants = cva(
  "group relative overflow-hidden rounded-xl border transition-all cursor-pointer",
  {
    variants: {
      state: {
        idle: "border-border hover:border-primary/40 hover:shadow-md",
        selected: "border-primary ring-2 ring-primary/30 shadow-md",
      },
      size: {
        sm: "w-40",
        md: "w-56",
        lg: "w-72",
      },
    },
    defaultVariants: { state: "idle", size: "md" },
  }
)

interface GalleryCardProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof galleryCardVariants> {}

export const GalleryCard = forwardRef<HTMLDivElement, GalleryCardProps>(
  ({ className, state, size, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(galleryCardVariants({ state, size }), className)}
      {...props}
    />
  )
)
GalleryCard.displayName = "GalleryCard"

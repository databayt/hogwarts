"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React from "react"

import { cn } from "@/lib/utils"

interface PageHeadingProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  description?: string
}

const PageHeading = React.forwardRef<HTMLDivElement, PageHeadingProps>(
  ({ title, description, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex w-full flex-col gap-2", className)}
        {...props}
      >
        {/* On phones the heading takes the DISPLAY face ("thmanyah sans"),
            matching the /live and /lumos heroes; from `md` up it keeps the
            serif text face every dashboard page has always used. `--font-heading`
            resolves to `fontThmanyahText` under `:root[dir="rtl"]`, so this is an
            override rather than a token change — deliberately scoped to the one
            breakpoint that asked for it. The @font-face lives in
            `styles/thmanyah-clone.css`, which the ROOT layout imports, so the
            family is available on every page without a new font load. */}
        <h1 className="scroll-m-20 text-4xl font-semibold tracking-tight max-md:[font-family:'thmanyah_sans',sans-serif] sm:text-3xl xl:text-4xl">
          {title}
        </h1>
        {description && (
          <p className="text-muted-foreground text-lg text-balance sm:text-base">
            {description}
          </p>
        )}
      </div>
    )
  }
)

PageHeading.displayName = "PageHeading"

export default PageHeading

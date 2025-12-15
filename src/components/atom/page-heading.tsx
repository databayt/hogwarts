"use client"

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
        <h1 className="scroll-m-20 text-4xl font-semibold tracking-tight sm:text-3xl xl:text-4xl">
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

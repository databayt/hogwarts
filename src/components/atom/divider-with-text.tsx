"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface DividerWithTextProps extends React.ComponentProps<"div"> {
  text?: string
}

export function DividerWithText({
  text = "Or continue with",
  className,
  ...props
}: DividerWithTextProps) {
  return (
    <div data-slot="divider-with-text" className={cn("relative", className)} {...props}>
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t" />
      </div>
      <div className="relative flex justify-center text-xs uppercase">
        <span className="bg-card px-2 text-muted-foreground">{text}</span>
      </div>
    </div>
  )
}

"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface CodeBlockWrapperProps extends React.HTMLAttributes<HTMLDivElement> {
  expandButtonTitle?: string
}

export function CodeBlockWrapper({
  expandButtonTitle = "View Code",
  className,
  children,
  ...props
}: CodeBlockWrapperProps) {
  const [isOpened, setIsOpened] = React.useState(false)

  return (
    <div className={cn("relative", className)} {...props}>
      <pre className={cn("mb-4 mt-6 max-h-[650px] overflow-x-auto rounded-lg border bg-muted px-4 py-4", {
        "max-h-none": isOpened,
      })}>
        {children}
      </pre>
      <div className={cn("flex items-center justify-end px-4", {
        "hidden": isOpened,
      })}>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setIsOpened(!isOpened)}
          className="h-8 text-xs"
        >
          {expandButtonTitle}
        </Button>
      </div>
    </div>
  )
} 
"use client"

import * as React from "react"
import { IconCheck, IconCopy } from "@tabler/icons-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { getDictionary } from "@/components/internationalization/dictionaries"

type Dictionary = Awaited<ReturnType<typeof getDictionary>>

export function copyToClipboardWithMeta(value: string, meta?: any) {
  navigator.clipboard.writeText(value)
  // meta parameter is for analytics tracking (not implemented yet)
}

export function CopyButton({
  value,
  className,
  variant = "ghost",
  dictionary,
  ...props
}: React.ComponentProps<typeof Button> & {
  value: string
  dictionary?: Dictionary
}) {
  const [hasCopied, setHasCopied] = React.useState(false)

  const copyText = dictionary?.docs?.copy || "Copy"
  const copiedText = dictionary?.docs?.copied || "Copied"
  const copyToClipboardText =
    dictionary?.docs?.copyToClipboard || "Copy to Clipboard"

  React.useEffect(() => {
    setTimeout(() => {
      setHasCopied(false)
    }, 2000)
  }, [hasCopied])

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          data-slot="copy-button"
          data-copied={hasCopied}
          size="icon"
          variant={variant}
          className={cn(
            "bg-code absolute end-2 top-3 z-10 size-7 hover:opacity-100 focus-visible:opacity-100",
            className
          )}
          onClick={() => {
            copyToClipboardWithMeta(value)
            setHasCopied(true)
          }}
          {...props}
        >
          <span className="sr-only">{copyText}</span>
          {hasCopied ? <IconCheck /> : <IconCopy />}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {hasCopied ? copiedText : copyToClipboardText}
      </TooltipContent>
    </Tooltip>
  )
}

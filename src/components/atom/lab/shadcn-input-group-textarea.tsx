"use client"

import { Copy, CornerDownLeft, FileCode, RotateCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

/**
 * ShadcnInputGroupTextarea - Code editor interface
 *
 * Textarea with code editor styling and action buttons.
 *
 * @example
 * ```tsx
 * <ShadcnInputGroupTextarea />
 * ```
 */
export function ShadcnInputGroupTextarea() {
  return (
    <div className="w-full max-w-md">
      <div className="border-border relative overflow-hidden rounded-lg border">
        {/* Header */}
        <div className="border-border bg-muted/50 flex items-center justify-between border-b px-3 py-2">
          <div className="flex items-center gap-2 font-mono text-sm font-medium">
            <FileCode className="size-4" />
            script.js
          </div>
          <div className="flex items-center gap-1">
            <Button size="icon" variant="ghost" className="size-8">
              <RotateCw className="size-4" />
            </Button>
            <Button size="icon" variant="ghost" className="size-8">
              <Copy className="size-4" />
            </Button>
          </div>
        </div>

        {/* Code Area */}
        <Textarea
          id="textarea-code"
          placeholder="console.log('Hello, world!');"
          className="min-h-[180px] resize-none border-0 font-mono text-sm focus-visible:ring-0"
        />

        {/* Footer */}
        <div className="border-border bg-muted/50 flex items-center justify-between border-t px-3 py-2">
          <span className="text-muted-foreground text-sm">
            Line 1, Column 1
          </span>
          <Button size="sm">
            Run <CornerDownLeft className="ms-1 size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

"use client"

import * as React from "react"
import { Check, Clipboard } from "lucide-react"

import { cn } from "@/lib/utils"
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { getDictionary } from "@/components/internationalization/dictionaries"

type Dictionary = Awaited<ReturnType<typeof getDictionary>>

interface AtomPreviewProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: "center" | "start" | "end"
  code?: string
  showCode?: boolean
  dictionary?: Dictionary
}

export function AtomPreview({
  children,
  className,
  align = "center",
  code,
  showCode = true,
  dictionary,
  ...props
}: AtomPreviewProps) {
  const { copyToClipboard, isCopied } = useCopyToClipboard()
  const previewText = dictionary?.docs?.preview || "Preview"
  const codeText = dictionary?.docs?.code || "Code"

  if (!showCode) {
    return (
      <div
        className={cn(
          "relative my-4 flex min-h-[350px] w-full justify-center rounded-md border p-10",
          {
            "items-center": align === "center",
            "items-start": align === "start",
            "items-end": align === "end",
          },
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }

  return (
    <div
      className={cn("relative my-4 flex flex-col space-y-2", className)}
      {...props}
    >
      <Tabs defaultValue="preview" className="relative me-auto w-full">
        <div className="flex items-center justify-between pb-3">
          <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
            <TabsTrigger
              value="preview"
              className="text-muted-foreground data-[state=active]:border-b-primary data-[state=active]:text-foreground relative h-9 rounded-none border-b-2 border-b-transparent bg-transparent px-4 pt-2 pb-3 shadow-none transition-none data-[state=active]:shadow-none"
            >
              {previewText}
            </TabsTrigger>
            <TabsTrigger
              value="code"
              className="text-muted-foreground data-[state=active]:border-b-primary data-[state=active]:text-foreground relative h-9 rounded-none border-b-2 border-b-transparent bg-transparent px-4 pt-2 pb-3 shadow-none transition-none data-[state=active]:shadow-none"
            >
              {codeText}
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="preview" className="relative rounded-md border">
          <div
            className={cn("flex min-h-[350px] w-full justify-center p-10", {
              "items-center": align === "center",
              "items-start": align === "start",
              "items-end": align === "end",
            })}
          >
            {children}
          </div>
        </TabsContent>
        <TabsContent value="code" className="relative">
          <div className="flex flex-col space-y-4">
            <div className="relative w-full rounded-md border">
              {code && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute end-4 top-4 h-7 w-7"
                  onClick={() => copyToClipboard(code)}
                >
                  {isCopied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Clipboard className="h-4 w-4" />
                  )}
                </Button>
              )}
              <pre className="max-h-[350px] overflow-auto p-4 text-sm">
                <code>{code}</code>
              </pre>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// @ts-nocheck
"use client"

import { memo, useEffect, useRef, useState, type ComponentProps } from "react"
import { AlertCircle, CheckCircle2, Loader2, XCircle } from "lucide-react"
import rehypeKatex from "rehype-katex"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"
import { Streamdown } from "streamdown"

import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

type ResponseStatus = "streaming" | "done" | "failed" | "rejected" | null

type ResponseProps = ComponentProps<typeof Streamdown> & {
  status?: ResponseStatus
  onStatusChange?: (status: ResponseStatus) => void
  streamDelay?: number // Milliseconds between characters for streaming effect
}

export const Response = memo(
  ({
    className,
    children,
    parseIncompleteMarkdown = true,
    allowedImagePrefixes = ["*"],
    allowedLinkPrefixes = ["*"],
    remarkPlugins = [remarkGfm, remarkMath],
    rehypePlugins = [rehypeKatex],
    status = null,
    onStatusChange,
    streamDelay = 10, // Default 10ms between characters
    ...props
  }: ResponseProps) => {
    const [displayedContent, setDisplayedContent] = useState("")
    const [currentStatus, setCurrentStatus] = useState<ResponseStatus>(status)
    const { toast } = useToast()
    const content = String(children || "")
    const containerRef = useRef<HTMLDivElement>(null)

    // Simulate streaming effect
    useEffect(() => {
      if (!content) {
        setDisplayedContent("")
        return
      }

      // If we have full content and status is not streaming, show it all
      if (status !== "streaming") {
        setDisplayedContent(content)
        return
      }

      // Streaming simulation - letter by letter
      let currentIndex = 0
      setDisplayedContent("")
      setCurrentStatus("streaming")

      const streamInterval = setInterval(() => {
        if (currentIndex < content.length) {
          // Add one character at a time for true letter-by-letter effect
          setDisplayedContent((prev) => prev + content.charAt(currentIndex))
          currentIndex++
        } else {
          clearInterval(streamInterval)
          setCurrentStatus("done")
          onStatusChange?.("done")

          // Show success notification
          toast({
            title: "Response Complete",
            description: "AI has finished generating the response",
            duration: 2000,
          })
        }
      }, streamDelay)

      return () => clearInterval(streamInterval)
    }, [content, status, streamDelay, onStatusChange, toast])

    // Auto-scroll effect - scroll whenever displayedContent changes
    useEffect(() => {
      // Find the response container by ID or class
      const scrollContainer =
        document.getElementById("ai-response-container") ||
        document.querySelector(".overflow-y-auto")

      if (scrollContainer && currentStatus === "streaming") {
        // Smooth scroll to bottom
        scrollContainer.scrollTo({
          top: scrollContainer.scrollHeight,
          behavior: "smooth",
        })
      }
    }, [displayedContent, currentStatus])

    // Update status from props
    useEffect(() => {
      if (status && status !== currentStatus) {
        setCurrentStatus(status)

        // Show status notifications
        if (status === "done") {
          toast({
            title: "Success",
            description: "Response generated successfully",
            duration: 2000,
          })
        } else if (status === "failed") {
          toast({
            title: "Failed",
            description: "Failed to generate response",
            variant: "destructive",
            duration: 3000,
          })
        } else if (status === "rejected") {
          toast({
            title: "Rejected",
            description: "Response was rejected",
            variant: "destructive",
            duration: 3000,
          })
        }
      }
    }, [status, currentStatus, toast])

    return (
      <div className="relative" ref={containerRef}>
        {/* Status indicator */}
        {currentStatus && (
          <div className="absolute -top-2 -right-2 z-10">
            {currentStatus === "streaming" && (
              <div className="text-primary flex animate-pulse items-center gap-1 text-xs">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Generating...</span>
              </div>
            )}
            {currentStatus === "done" && (
              <div className="flex items-center gap-1 text-xs text-green-600">
                <CheckCircle2 className="h-3 w-3" />
                <span>Complete</span>
              </div>
            )}
            {currentStatus === "failed" && (
              <div className="text-destructive flex items-center gap-1 text-xs">
                <XCircle className="h-3 w-3" />
                <span>Failed</span>
              </div>
            )}
            {currentStatus === "rejected" && (
              <div className="flex items-center gap-1 text-xs text-orange-600">
                <AlertCircle className="h-3 w-3" />
                <span>Rejected</span>
              </div>
            )}
          </div>
        )}

        <Streamdown
          className={cn(
            "size-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
            "prose prose-sm dark:prose-invert max-w-none",
            "prose-headings:font-semibold prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg",
            "prose-p:leading-relaxed prose-p:text-muted-foreground",
            "prose-strong:text-foreground prose-strong:font-semibold",
            "prose-code:text-xs prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md",
            "prose-code:bg-muted prose-code:text-foreground prose-code:font-mono",
            "prose-pre:bg-muted prose-pre:text-foreground prose-pre:rounded-lg",
            "prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground",
            "prose-ul:list-disc prose-ol:list-decimal",
            "prose-li:text-muted-foreground prose-li:marker:text-primary",
            "prose-a:text-primary prose-a:no-underline hover:prose-a:underline",
            "text-left", // Ensure text is aligned to start
            className
          )}
          parseIncompleteMarkdown={parseIncompleteMarkdown}
          allowedImagePrefixes={allowedImagePrefixes}
          allowedLinkPrefixes={allowedLinkPrefixes}
          remarkPlugins={remarkPlugins}
          rehypePlugins={rehypePlugins}
          {...props}
        >
          {displayedContent}
        </Streamdown>
      </div>
    )
  },
  (prevProps, nextProps) =>
    prevProps.children === nextProps.children &&
    prevProps.status === nextProps.status
)

Response.displayName = "Response"

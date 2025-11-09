"use client"

import { useState } from "react"
import { AudioLines, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

/**
 * ButtonGroupInputGroup - Messaging interface with voice mode
 *
 * Combines button groups with input field and toggleable voice mode.
 *
 * @example
 * ```tsx
 * <ButtonGroupInputGroup />
 * ```
 */
export function ButtonGroupInputGroup() {
  const [voiceEnabled, setVoiceEnabled] = useState(false)

  return (
    <TooltipProvider>
      <div className="flex w-full max-w-lg items-center gap-2 rounded-full border border-border p-1">
        <Button size="icon" variant="outline" className="rounded-full" aria-label="Add">
          <Plus className="size-4" />
        </Button>

        <div className="relative flex-1">
          <Input
            placeholder={
              voiceEnabled ? "Record and send audio..." : "Send a message..."
            }
            disabled={voiceEnabled}
            className="border-0 bg-transparent pr-10 focus-visible:ring-0"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => setVoiceEnabled(!voiceEnabled)}
                  size="icon"
                  variant={voiceEnabled ? "default" : "ghost"}
                  className="size-7 rounded-full"
                  aria-pressed={voiceEnabled}
                  aria-label="Voice Mode"
                >
                  <AudioLines className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Voice Mode</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}

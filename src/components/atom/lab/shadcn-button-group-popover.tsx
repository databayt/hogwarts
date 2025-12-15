"use client"

import { Bot, ChevronDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"

/**
 * ShadcnButtonGroupPopover - AI assistant interface
 *
 * Button group with popover for AI-assisted task configuration.
 *
 * @example
 * ```tsx
 * <ShadcnButtonGroupPopover />
 * ```
 */
export function ShadcnButtonGroupPopover() {
  return (
    <div className="flex gap-1">
      <Button variant="outline">
        <Bot className="mr-2 size-4" />
        Copilot
      </Button>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="icon">
            <ChevronDown className="size-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-80 rounded-xl p-0">
          <div className="space-y-4 p-4">
            <div className="font-medium">Agent Tasks</div>
            <Textarea
              placeholder="Describe your task in natural language."
              className="min-h-[100px]"
            />
            <p className="text-muted-foreground text-sm">
              The Copilot will run in the background and create a pull request
              for you to review.
            </p>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

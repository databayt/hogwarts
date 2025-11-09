"use client"

import { Search, ArrowUpIcon, Plus, InfoIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Separator } from "@/components/ui/separator"
import { Check } from "lucide-react"

/**
 * InputGroupDemo - Demonstrates various input group patterns
 *
 * Shows different input configurations:
 * - Search with results counter
 * - URL input with protocol prefix
 * - Textarea with action buttons
 * - Verified input with status indicator
 *
 * @example
 * ```tsx
 * <InputGroupDemo />
 * ```
 */
export function InputGroupDemo() {
  return (
    <TooltipProvider>
      <div className="grid w-full max-w-sm gap-6">
        {/* Search Input with Results */}
        <div className="relative">
          <Input placeholder="Search..." className="pr-24" />
          <div className="absolute inset-y-0 right-0 flex items-center gap-2 pr-3">
            <Search className="size-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">12 results</span>
          </div>
        </div>

        {/* URL Input with Protocol */}
        <div className="relative">
          <Input placeholder="example.com" className="pl-20 pr-10" />
          <div className="absolute inset-y-0 left-0 flex items-center pl-3">
            <span className="text-sm text-muted-foreground">https://</span>
          </div>
          <div className="absolute inset-y-0 right-0 flex items-center pr-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-7 rounded-full"
                  aria-label="Info"
                >
                  <InfoIcon className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>This is content in a tooltip.</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Textarea with Actions */}
        <div className="relative">
          <Textarea
            placeholder="Ask, Search or Chat..."
            className="min-h-[100px] pr-3 pb-12"
          />
          <div className="absolute bottom-0 left-0 right-0 flex items-center gap-2 border-t border-border bg-background p-2">
            <Button
              size="icon"
              variant="outline"
              className="size-7 rounded-full"
              aria-label="Add"
            >
              <Plus className="size-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  Auto
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start">
                <DropdownMenuItem>Auto</DropdownMenuItem>
                <DropdownMenuItem>Agent</DropdownMenuItem>
                <DropdownMenuItem>Manual</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <span className="ml-auto text-sm text-muted-foreground">52% used</span>
            <Separator orientation="vertical" className="h-4" />
            <Button size="icon" className="size-7 rounded-full">
              <ArrowUpIcon className="size-4" />
              <span className="sr-only">Send</span>
            </Button>
          </div>
        </div>

        {/* Verified Input */}
        <div className="relative">
          <Input placeholder="@shadcn" className="pr-10" />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <div className="flex size-4 items-center justify-center rounded-full bg-primary">
              <Check className="size-3 text-primary-foreground" />
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}

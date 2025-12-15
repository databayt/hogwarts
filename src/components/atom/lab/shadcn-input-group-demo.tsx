"use client"

import { ArrowUpIcon, Check, InfoIcon, Plus, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

/**
 * ShadcnInputGroupDemo - Demonstrates various input group patterns
 *
 * Shows different input configurations:
 * - Search with results counter
 * - URL input with protocol prefix
 * - Textarea with action buttons
 * - Verified input with status indicator
 *
 * @example
 * ```tsx
 * <ShadcnInputGroupDemo />
 * ```
 */
export function ShadcnInputGroupDemo() {
  return (
    <TooltipProvider>
      <div className="grid w-full max-w-sm gap-6">
        {/* Search Input with Results */}
        <div className="relative">
          <Input placeholder="Search..." className="pr-24" />
          <div className="absolute inset-y-0 right-0 flex items-center gap-2 pr-3">
            <Search className="text-muted-foreground size-4" />
            <span className="text-muted-foreground text-sm">12 results</span>
          </div>
        </div>

        {/* URL Input with Protocol */}
        <div className="relative">
          <Input placeholder="example.com" className="pr-10 pl-20" />
          <div className="absolute inset-y-0 left-0 flex items-center pl-3">
            <span className="text-muted-foreground text-sm">https://</span>
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
          <div className="border-border bg-background absolute right-0 bottom-0 left-0 flex items-center gap-2 border-t p-2">
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
            <span className="text-muted-foreground ml-auto text-sm">
              52% used
            </span>
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
            <div className="bg-primary flex size-4 items-center justify-center rounded-full">
              <Check className="text-primary-foreground size-3" />
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}

"use client"

import { useState } from "react"
import {
  Archive,
  ArrowLeft,
  CalendarPlus,
  Clock,
  ListPlus,
  MailCheck,
  MoreHorizontal,
  Tag,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

/**
 * ButtonGroupDemo - Email-like interface with grouped actions
 *
 * Demonstrates button grouping with dropdown menus and nested options.
 *
 * @example
 * ```tsx
 * <ButtonGroupDemo />
 * ```
 */
export function ButtonGroupDemo() {
  const [label, setLabel] = useState("personal")

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Back Button (Hidden on Mobile) */}
      <div className="hidden sm:flex">
        <Button variant="outline" size="icon" aria-label="Go Back">
          <ArrowLeft className="size-4" />
        </Button>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-1">
        <Button variant="outline" size="sm">
          Archive
        </Button>
        <Button variant="outline" size="sm">
          Report
        </Button>
      </div>

      {/* Snooze with More Options */}
      <div className="flex gap-1">
        <Button variant="outline" size="sm">
          Snooze
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" aria-label="More Options">
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <MailCheck className="mr-2 size-4" />
                Mark as Read
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Archive className="mr-2 size-4" />
                Archive
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <Clock className="mr-2 size-4" />
                Snooze
              </DropdownMenuItem>
              <DropdownMenuItem>
                <CalendarPlus className="mr-2 size-4" />
                Add to Calendar
              </DropdownMenuItem>
              <DropdownMenuItem>
                <ListPlus className="mr-2 size-4" />
                Add to List
              </DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Tag className="mr-2 size-4" />
                  Label As...
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuRadioGroup value={label} onValueChange={setLabel}>
                    <DropdownMenuRadioItem value="personal">
                      Personal
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="work">
                      Work
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="other">
                      Other
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem className="text-destructive">
                <Trash2 className="mr-2 size-4" />
                Trash
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

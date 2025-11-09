"use client"

import { useState } from "react"
import { InfoIcon, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

/**
 * ShadcnInputGroupButton - Input with action buttons
 *
 * Secure URL input with info popover and favorite toggle.
 *
 * @example
 * ```tsx
 * <ShadcnInputGroupButton />
 * ```
 */
export function ShadcnInputGroupButton() {
  const [isFavorite, setIsFavorite] = useState(false)

  return (
    <div className="w-full max-w-sm">
      <Label htmlFor="input-secure" className="sr-only">
        Input Secure
      </Label>
      <div className="relative flex items-center rounded-full border border-border">
        <div className="flex items-center pl-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                size="icon"
                variant="secondary"
                className="size-7 rounded-full"
                aria-label="Info"
              >
                <InfoIcon className="size-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" alignOffset={10} className="rounded-xl text-sm">
              <p className="font-medium">Your connection is not secure.</p>
              <p className="text-muted-foreground">
                You should not enter any sensitive information on this site.
              </p>
            </PopoverContent>
          </Popover>
        </div>
        <span className="pl-2 text-sm text-muted-foreground">https://</span>
        <Input
          id="input-secure"
          className="flex-1 border-0 bg-transparent focus-visible:ring-0"
        />
        <div className="flex items-center pr-2">
          <Button
            onClick={() => setIsFavorite(!isFavorite)}
            size="icon"
            variant="ghost"
            className="size-7 rounded-full"
            aria-label="Favorite"
          >
            <Star
              className={`size-4 ${
                isFavorite ? "fill-primary stroke-primary" : ""
              }`}
            />
          </Button>
        </div>
      </div>
    </div>
  )
}

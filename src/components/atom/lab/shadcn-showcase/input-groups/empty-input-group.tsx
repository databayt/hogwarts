"use client"

import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"

/**
 * EmptyInputGroup - 404 error state with search
 *
 * Empty state component featuring search input for 404 pages.
 *
 * @example
 * ```tsx
 * <EmptyInputGroup />
 * ```
 */
export function EmptyInputGroup() {
  return (
    <div className="flex flex-col items-center justify-center space-y-6 rounded-lg border border-border p-12 text-center">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold">404 - Not Found</h2>
        <p className="text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist. Try searching for
          what you need below.
        </p>
      </div>

      <div className="w-full max-w-md space-y-4">
        <div className="relative">
          <Input placeholder="Try searching for pages..." className="pr-20" />
          <div className="absolute inset-y-0 right-0 flex items-center gap-2 pr-3">
            <Search className="size-4 text-muted-foreground" />
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-xs font-medium text-muted-foreground">
              /
            </kbd>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">
          Need help?{" "}
          <a href="#" className="underline underline-offset-4 hover:text-foreground">
            Contact support
          </a>
        </p>
      </div>
    </div>
  )
}

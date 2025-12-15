"use client"

import { Search } from "lucide-react"

import { Input } from "@/components/ui/input"

/**
 * ShadcnEmptyInputGroup - 404 error state with search
 *
 * Empty state component featuring search input for 404 pages.
 *
 * @example
 * ```tsx
 * <ShadcnEmptyInputGroup />
 * ```
 */
export function ShadcnEmptyInputGroup() {
  return (
    <div className="border-border flex flex-col items-center justify-center space-y-6 rounded-lg border p-12 text-center">
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
            <Search className="text-muted-foreground size-4" />
            <kbd className="border-border bg-muted text-muted-foreground pointer-events-none inline-flex h-5 items-center gap-1 rounded border px-1.5 font-mono text-xs font-medium select-none">
              /
            </kbd>
          </div>
        </div>

        <p className="text-muted-foreground text-sm">
          Need help?{" "}
          <a
            href="#"
            className="hover:text-foreground underline underline-offset-4"
          >
            Contact support
          </a>
        </p>
      </div>
    </div>
  )
}

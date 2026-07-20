"use client"

import { Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useTableTranslations } from "@/components/table/use-table-translations"

interface SeeMoreProps {
  hasMore: boolean
  isLoading?: boolean
  onClick: () => void
  /** Overrides the locale-aware default ("Load more" / "تحميل المزيد"). */
  label?: string
  className?: string
}

export function SeeMore({
  hasMore,
  isLoading,
  onClick,
  label,
  className,
}: SeeMoreProps) {
  // Defaulted through the shared hook rather than a literal so call sites that
  // pass no label still render in the active locale instead of English.
  const t = useTableTranslations(label ? { loadMore: label } : undefined)

  if (!hasMore) return null

  return (
    <div className={cn("flex justify-center", className)}>
      <Button
        variant="ghost"
        className="hover:bg-transparent hover:underline"
        onClick={onClick}
        disabled={isLoading}
        aria-busy={isLoading}
      >
        {isLoading ? <Loader2 className="me-2 size-4 animate-spin" /> : null}
        {isLoading ? t.loading : t.loadMore}
      </Button>
    </div>
  )
}

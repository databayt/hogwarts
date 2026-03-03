"use client"

import { Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface SeeMoreProps {
  hasMore: boolean
  isLoading?: boolean
  onClick: () => void
  label?: string
  className?: string
}

export function SeeMore({
  hasMore,
  isLoading,
  onClick,
  label = "See More",
  className,
}: SeeMoreProps) {
  if (!hasMore) return null

  return (
    <div className={cn("flex justify-center", className)}>
      <Button
        variant="ghost"
        className="hover:bg-transparent hover:underline"
        onClick={onClick}
        disabled={isLoading}
      >
        {isLoading ? <Loader2 className="me-2 size-4 animate-spin" /> : null}
        {label}
      </Button>
    </div>
  )
}

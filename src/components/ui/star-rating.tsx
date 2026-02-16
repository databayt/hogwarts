"use client"

import { useState } from "react"
import { Star } from "lucide-react"

import { cn } from "@/lib/utils"

interface StarRatingProps {
  rating: number
  maxStars?: number
  size?: "sm" | "md" | "lg"
  interactive?: boolean
  onRate?: (rating: number) => void
  showCount?: boolean
  count?: number
  className?: string
}

const sizeMap = {
  sm: "h-3.5 w-3.5",
  md: "h-4 w-4",
  lg: "h-5 w-5",
}

export function StarRating({
  rating,
  maxStars = 5,
  size = "md",
  interactive = false,
  onRate,
  showCount = false,
  count,
  className,
}: StarRatingProps) {
  const [hovered, setHovered] = useState(0)

  const displayRating = hovered || rating

  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      {Array.from({ length: maxStars }, (_, i) => {
        const starValue = i + 1
        const filled = displayRating >= starValue
        const halfFilled = !filled && displayRating >= starValue - 0.5

        return (
          <button
            key={i}
            type="button"
            disabled={!interactive}
            className={cn(
              "relative",
              interactive &&
                "cursor-pointer transition-transform hover:scale-110",
              !interactive && "cursor-default"
            )}
            onMouseEnter={() => interactive && setHovered(starValue)}
            onMouseLeave={() => interactive && setHovered(0)}
            onClick={() => interactive && onRate?.(starValue)}
          >
            <Star
              className={cn(
                sizeMap[size],
                filled
                  ? "fill-yellow-400 text-yellow-400"
                  : halfFilled
                    ? "fill-yellow-400/50 text-yellow-400"
                    : "text-muted-foreground/40 fill-none"
              )}
            />
          </button>
        )
      })}
      {showCount && count !== undefined && (
        <span className="text-muted-foreground ml-1 text-xs">({count})</span>
      )}
    </div>
  )
}

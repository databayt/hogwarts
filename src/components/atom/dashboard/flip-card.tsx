'use client'

import * as React from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import type { CardSize } from "./types"

interface FlipCardProps {
  /**
   * Front side content
   */
  front: React.ReactNode
  /**
   * Back side content (revealed on hover)
   */
  back: React.ReactNode
  /**
   * Card size variant
   * @default "md"
   */
  size?: CardSize
  /**
   * Enable click to flip (instead of hover)
   * @default false
   */
  clickToFlip?: boolean
  /**
   * Additional CSS classes
   */
  className?: string
}

/**
 * FlipCard - Interactive 3D flip card with front/back
 *
 * Perfect for stat cards with additional details, interactive dashboards,
 * or showcasing data with context. Inspired by modern dashboard trends.
 *
 * @example
 * ```tsx
 * <FlipCard
 *   front={
 *     <div>
 *       <StatValue value="4,812" size="xl" />
 *       <StatLabel label="Total Students" />
 *     </div>
 *   }
 *   back={
 *     <BarChart data={studentsByGrade} height={120} />
 *   }
 *   size="lg"
 * />
 * ```
 */
export function FlipCard({
  front,
  back,
  size = "md",
  clickToFlip = false,
  className,
}: FlipCardProps) {
  const [isFlipped, setIsFlipped] = React.useState(false)

  const sizeClasses = {
    sm: "h-32",
    md: "h-48",
    lg: "h-64",
    xl: "h-80",
  }

  const handleInteraction = () => {
    if (clickToFlip) {
      setIsFlipped(!isFlipped)
    }
  }

  return (
    <div
      className={cn(
        "group perspective-1000",
        sizeClasses[size],
        clickToFlip && "cursor-pointer",
        className
      )}
      onClick={handleInteraction}
    >
      <div
        className={cn(
          "relative w-full h-full transition-transform duration-500 transform-style-3d",
          !clickToFlip && "group-hover:rotate-y-180",
          clickToFlip && isFlipped && "rotate-y-180"
        )}
      >
        {/* Front */}
        <Card className="absolute w-full h-full backface-hidden">
          <CardContent className="flex items-center justify-center h-full p-6">
            {front}
          </CardContent>
        </Card>

        {/* Back */}
        <Card className="absolute w-full h-full backface-hidden rotate-y-180">
          <CardContent className="flex items-center justify-center h-full p-6">
            {back}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

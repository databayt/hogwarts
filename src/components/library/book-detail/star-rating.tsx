// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Star, StarHalf } from "lucide-react"

interface StarRatingProps {
  rating: number
  max?: number
}

export function StarRating({ rating, max = 5 }: StarRatingProps) {
  const stars = []

  for (let i = 1; i <= max; i++) {
    if (i <= Math.floor(rating)) {
      stars.push(
        <Star key={i} className="size-5 fill-amber-400 text-amber-400" />
      )
    } else if (i - 0.5 <= rating) {
      stars.push(
        <StarHalf key={i} className="size-5 fill-amber-400 text-amber-400" />
      )
    } else {
      stars.push(<Star key={i} className="text-muted-foreground/30 size-5" />)
    }
  }

  return <div className="flex items-center gap-1">{stars}</div>
}

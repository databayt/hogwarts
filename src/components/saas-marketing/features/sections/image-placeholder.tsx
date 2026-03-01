// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { ImageIcon } from "lucide-react"

import { cn } from "@/lib/utils"

interface Props {
  className?: string
  aspectRatio?: "video" | "square" | "wide"
}

const ratioClasses = {
  video: "aspect-video",
  square: "aspect-square",
  wide: "aspect-[2/1]",
}

export function ImagePlaceholder({ className, aspectRatio = "video" }: Props) {
  return (
    <div
      className={cn(
        "bg-muted flex items-center justify-center rounded-lg",
        ratioClasses[aspectRatio],
        className
      )}
    >
      <ImageIcon className="text-muted-foreground h-10 w-10" />
    </div>
  )
}

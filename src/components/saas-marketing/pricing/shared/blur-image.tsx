"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useState } from "react"
import type { ComponentProps } from "react"
import Image from "next/image"

import { cn } from "@/lib/utils"

export default function BlurImage(props: ComponentProps<typeof Image>) {
  const [isLoading, setLoading] = useState(true)

  return (
    <Image
      {...props}
      alt={props.alt}
      className={cn(
        props.className,
        "duration-500 ease-in-out",
        isLoading ? "blur-sm" : "blur-0"
      )}
      onLoad={() => setLoading(false)}
    />
  )
}

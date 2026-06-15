"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useState } from "react"
import Lottie from "lottie-react"

interface LibraryAnimationProps {
  className?: string
}

export function LibraryAnimation({ className }: LibraryAnimationProps) {
  const [animationData, setAnimationData] = useState<object | null>(null)

  useEffect(() => {
    fetch(
      `https://${process.env.NEXT_PUBLIC_CDN_DOMAIN || "cdn.databayt.org"}/anthropic/claude-for-excel.json`
    )
      .then((res) => res.json())
      .then((data) => setAnimationData(data))
      .catch(console.error)
  }, [])

  if (!animationData) {
    return (
      <div className={`${className} flex items-center justify-center`}>
        <div className="border-primary/20 border-t-primary h-16 w-16 animate-spin rounded-full border-4" />
      </div>
    )
  }

  return (
    <div className={className}>
      <Lottie
        animationData={animationData}
        loop={true}
        autoplay={true}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  )
}

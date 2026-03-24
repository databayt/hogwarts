"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useState } from "react"
import Lottie from "lottie-react"

import { asset } from "@/lib/asset-url"

interface EducationAnimationProps {
  className?: string
}

export function EducationAnimation({ className }: EducationAnimationProps) {
  const [animationData, setAnimationData] = useState<object | null>(null)

  useEffect(() => {
    fetch(asset("/animations/education.json"))
      .then((res) => res.json())
      .then((data) => setAnimationData(data))
      .catch(console.error)
  }, [])

  return (
    <div className={className}>
      {animationData && (
        <Lottie
          animationData={animationData}
          loop={true}
          autoplay={true}
          style={{ width: "100%", height: "100%" }}
        />
      )}
    </div>
  )
}

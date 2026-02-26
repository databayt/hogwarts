"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import Lottie from "lottie-react"

import animationData from "../../../../public/stream/education-animation.json"

interface EducationAnimationProps {
  className?: string
}

export function EducationAnimation({ className }: EducationAnimationProps) {
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

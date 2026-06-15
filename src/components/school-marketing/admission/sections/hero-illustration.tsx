"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useState } from "react"
import Lottie from "lottie-react"

// Same animation as Claude API page — served from the unified asset CDN
const ANIMATION_URL = `https://${process.env.NEXT_PUBLIC_CDN_DOMAIN || "cdn.databayt.org"}/anthropic/api.json`

export function AdmissionHeroIllustration() {
  const [animationData, setAnimationData] = useState<unknown>(null)

  useEffect(() => {
    fetch(ANIMATION_URL)
      .then((res) => res.json())
      .then(setAnimationData)
      .catch(console.error)
  }, [])

  if (!animationData) {
    return (
      <div className="relative h-[300px] w-[300px] sm:h-[350px] sm:w-[350px] lg:h-[450px] lg:w-[450px]">
        <div className="bg-muted/20 h-full w-full animate-pulse rounded-full" />
      </div>
    )
  }

  return (
    <div className="relative h-[300px] w-[300px] sm:h-[350px] sm:w-[350px] lg:h-[450px] lg:w-[450px]">
      <Lottie
        animationData={animationData}
        loop={true}
        autoplay={true}
        style={{
          width: "100%",
          height: "100%",
        }}
      />
    </div>
  )
}

export default AdmissionHeroIllustration

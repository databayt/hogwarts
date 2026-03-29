"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useState } from "react"
import Lottie from "lottie-react"

export function HeroIllustration() {
  const [animationData, setAnimationData] = useState<object | null>(null)

  useEffect(() => {
    fetch("/animations/anthropic-hero.json")
      .then((res) => res.json())
      .then((data) => setAnimationData(data))
      .catch(console.error)
  }, [])

  return (
    <div className="relative h-[200px] w-[200px] sm:h-[280px] sm:w-[280px] md:h-[320px] md:w-[320px] lg:h-[400px] lg:w-[400px] xl:h-[480px] xl:w-[480px]">
      {/* In dark mode: invert (black→white, orange→blue) then hue-rotate 180° (blue→orange) */}
      <div className="h-full w-full dark:[filter:invert(1)_hue-rotate(180deg)]">
        {animationData && (
          <Lottie
            animationData={animationData}
            loop={true}
            autoplay={true}
            style={{
              width: "100%",
              height: "100%",
            }}
          />
        )}
      </div>
    </div>
  )
}

export default HeroIllustration

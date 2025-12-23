"use client"

import animationData from "@/../public/animations/anthropic-hero.json"
import Lottie from "lottie-react"

export function HeroIllustration() {
  return (
    <div className="relative h-[200px] w-[200px] sm:h-[280px] sm:w-[280px] md:h-[320px] md:w-[320px] lg:h-[400px] lg:w-[400px] xl:h-[480px] xl:w-[480px]">
      {/* In dark mode: invert (black→white, orange→blue) then hue-rotate 180° (blue→orange) */}
      <div className="h-full w-full dark:[filter:invert(1)_hue-rotate(180deg)]">
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
    </div>
  )
}

export default HeroIllustration

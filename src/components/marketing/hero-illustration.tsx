"use client"

import animationData from "@/../public/animations/anthropic-hero.json"
import Lottie from "lottie-react"

export function HeroIllustration() {
  return (
    <div className="relative h-[300px] w-[300px] sm:h-[350px] sm:w-[350px] lg:h-[450px] lg:w-[450px]">
      {/* Apply dark mode inversion filter to the hand portion of the animation */}
      <div className="h-full w-full dark:mix-blend-difference dark:[filter:invert(1)_hue-rotate(180deg)]">
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

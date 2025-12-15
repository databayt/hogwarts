"use client"

import animationData from "@/../public/animations/anthropic-hero.json"
import Lottie from "lottie-react"

export function HeroIllustration() {
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

export default HeroIllustration

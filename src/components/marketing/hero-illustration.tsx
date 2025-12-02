"use client"

import Lottie from "lottie-react"
import animationData from "@/../public/animations/anthropic-hero.json"

export function HeroIllustration() {
  return (
    <div className="relative w-[300px] h-[300px] sm:w-[350px] sm:h-[350px] lg:w-[450px] lg:h-[450px]">
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

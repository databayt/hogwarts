"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useState } from "react"
import dynamic from "next/dynamic"

// lottie-web is large (~hundreds of KB). It only renders below the hero CTA
// and isn't LCP-critical, so defer its parse with a client-side dynamic import
// (ssr:false is valid here because this file is already a client component).
const Lottie = dynamic(() => import("lottie-react"), { ssr: false })

interface EducationAnimationProps {
  className?: string
}

export function EducationAnimation({ className }: EducationAnimationProps) {
  const [animationData, setAnimationData] = useState<object | null>(null)

  useEffect(() => {
    fetch("/animations/education.json")
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

import React from "react"

import { GradientAnimation } from "@/components/atom/gradient-animation"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import Clock from "./clock"

interface TimeProps {
  dictionary: Dictionary
}

const Time = ({ dictionary }: TimeProps) => {
  const timeDict = (dictionary as any).time || {
    title: "Time",
    subtitle: "We sell the origin of value.",
  }

  return (
    <section>
      <GradientAnimation
        height="h-[280px] md:h-[240px]"
        containerClassName="!w-full rounded-xl overflow-hidden"
      >
        <div className="absolute inset-0 z-40 flex items-center">
          <div className="flex w-full flex-col items-center justify-between gap-8 px-8 md:flex-row md:px-16">
            <div className="flex flex-col text-center md:text-start">
              <h2 className="font-heading mb-3 text-5xl font-black tracking-tight text-white md:text-7xl">
                {timeDict.title}
              </h2>
              <p className="font-heading text-lg text-white/90 md:text-xl">
                {timeDict.subtitle}
              </p>
            </div>
            <div className="flex-shrink-0">
              <Clock />
            </div>
          </div>
        </div>
      </GradientAnimation>
    </section>
  )
}

export default Time

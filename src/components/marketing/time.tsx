import React from "react"

import { GradientAnimation } from "@/components/atom/gradient-animation"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import Clock from "./clock"

interface TimeProps {
  dictionary: Dictionary
  lang?: Locale
}

const Time = ({ dictionary, lang }: TimeProps) => {
  const isRTL = lang === "ar"
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const timeDict = (dictionary?.marketing as any)?.time ||
    (dictionary as any).time || {
      title: "Time",
      subtitle: "We sell the origin of value.",
    }

  return (
    <section className="py-8 md:py-0" dir={isRTL ? "rtl" : "ltr"}>
      <GradientAnimation
        height="h-[320px] md:h-[240px]"
        containerClassName="!w-full rounded-xl overflow-hidden"
        gradientBackgroundStart="rgb(186, 230, 253)"
        gradientBackgroundEnd="rgb(125, 211, 252)"
        firstColor="56, 189, 248"
        secondColor="14, 165, 233"
        thirdColor="186, 230, 253"
        fourthColor="125, 211, 252"
        fifthColor="56, 189, 248"
        pointerColor="14, 165, 233"
      >
        <div className="absolute inset-0 z-40 flex items-center">
          <div className="flex w-full flex-col items-center justify-between gap-8 px-8 md:flex-row md:px-16">
            <div className="flex flex-col text-center md:text-start">
              <h2 className="font-heading mb-3 text-5xl font-black tracking-tight text-slate-900 md:text-7xl">
                {timeDict.title}
              </h2>
              <p className="font-heading text-lg text-slate-700 md:text-xl">
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

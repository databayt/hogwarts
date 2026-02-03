import React from "react"

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
    <section className="py-24 md:py-0" dir={isRTL ? "rtl" : "ltr"}>
      <div className="flex h-[320px] w-full items-center overflow-hidden rounded-xl bg-[rgb(106,155,204)] md:h-[240px]">
        <div className="flex w-full flex-col items-center justify-between gap-8 px-8 md:flex-row md:px-16">
          <div className="flex flex-col text-center md:text-start">
            <h2 className="font-heading mb-3 text-5xl font-black tracking-tight text-black md:text-7xl">
              {timeDict.title}
            </h2>
            <p className="font-heading text-lg text-black/80 md:text-xl">
              {timeDict.subtitle}
            </p>
          </div>
          <div className="flex-shrink-0">
            <Clock />
          </div>
        </div>
      </div>
    </section>
  )
}

export default Time

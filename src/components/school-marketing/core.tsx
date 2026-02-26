"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import Image from "next/image"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import SectionHeading from "../atom/section-heading"

const coreIcons = [
  { src: "/anthropic/claude-code-best-practices.svg", alt: "Courage" },
  { src: "/anthropic/category-06.svg", alt: "Wisdom" },
  { src: "/anthropic/think-tool.svg", alt: "Loyalty" },
  { src: "/anthropic/category-03.svg", alt: "Ambition" },
]

const bgColors = [
  "bg-[#D97757]",
  "bg-[#6A9BCC]",
  "bg-[#CBCADB]",
  "bg-[#BCD1CA]",
]

export function Core() {
  const { dictionary } = useDictionary()
  const t = dictionary?.marketing?.site?.core

  const fallbackValues = [
    {
      title: "Courage",
      description: "Be brave, take risks, and stand up for what's right.",
    },
    {
      title: "Wisdom",
      description: "Reflect deeply and pursue understanding beyond facts.",
    },
    {
      title: "Loyalty",
      description: "Support each other and stay committed to shared goals.",
    },
    {
      title: "Ambition",
      description: "Excel, innovate, and make positive changes in the world.",
    },
  ]

  const items = t?.items || fallbackValues

  return (
    <section className="py-16 md:py-24">
      {/* Header */}
      <SectionHeading
        title={t?.title || "Core"}
        description={
          t?.description || "These values guide everything we do at our school."
        }
      />

      {/* Core Values */}
      <div className="grid grid-cols-1 gap-8 pt-14 md:grid-cols-2 lg:grid-cols-4">
        {(items as Array<Record<string, unknown>>).map(
          (value: Record<string, unknown>, index: number) => (
            <Card
              key={index}
              className="group relative rounded-md border-none shadow-none"
            >
              <div className="border-animation pointer-events-none absolute inset-0">
                <span className="absolute inset-0"></span>
                <div className="start-top absolute start-0 top-0"></div>
                <div className="start-bottom absolute start-0 bottom-0"></div>
                <div className="end-top absolute end-0 top-0"></div>
                <div className="end-bottom absolute end-0 bottom-0"></div>
              </div>
              <CardHeader className="text-center">
                <div className="flex justify-center">
                  <div
                    className={`h-24 w-24 ${bgColors[index]} flex items-center justify-center rounded-2xl`}
                  >
                    <Image
                      src={coreIcons[index].src}
                      alt={coreIcons[index].alt}
                      width={64}
                      height={64}
                      className="dark:invert"
                    />
                  </div>
                </div>
                <CardTitle className="pt-4 text-xl font-bold">
                  {String(value.title || fallbackValues[index]?.title)}
                </CardTitle>
              </CardHeader>
              <CardContent className="-mt-2 pt-0">
                <CardDescription className="text-center leading-relaxed">
                  {String(
                    value.description || fallbackValues[index]?.description
                  )}
                </CardDescription>
              </CardContent>
            </Card>
          )
        )}
      </div>
    </section>
  )
}

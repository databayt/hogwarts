"use client"

import Image from "next/image"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import SectionHeading from "../atom/section-heading"

export function Core() {
  const coreValues = [
    {
      icon: (
        <Image
          src="/anthropic/claude-code-best-practices.svg"
          alt="Network Nodes - Courage"
          width={64}
          height={64}
          className="dark:invert"
        />
      ),
      title: "Courage",
      description: "Be brave, take risks, and stand up for what's right.",
      bgColor: "bg-[#D97757]", // Anthropic terracotta
    },
    {
      icon: (
        <Image
          src="/anthropic/category-06.svg"
          alt="Growth Flourish - Wisdom"
          width={64}
          height={64}
          className="dark:invert"
        />
      ),
      title: "Wisdom",
      description: "Reflect deeply and pursue understanding beyond facts.",
      bgColor: "bg-[#6A9BCC]", // Anthropic blue
    },
    {
      icon: (
        <Image
          src="/anthropic/think-tool.svg"
          alt="Frame Boundary - Loyalty"
          width={64}
          height={64}
          className="dark:invert"
        />
      ),
      title: "Loyalty",
      description: "Support each other and stay committed to shared goals.",
      bgColor: "bg-[#CBCADB]", // Anthropic lavender
    },
    {
      icon: (
        <Image
          src="/anthropic/category-03.svg"
          alt="Reaching Ascent - Ambition"
          width={64}
          height={64}
          className="dark:invert"
        />
      ),
      title: "Ambition",
      description: "Excel, innovate, and make positive changes in the world.",
      bgColor: "bg-[#BCD1CA]", // Anthropic sage
    },
  ]

  return (
    <section className="py-16 md:py-24">
      {/* Header */}
      <SectionHeading
        title="Core"
        description="These values guide everything we do at our school."
      />

      {/* Core Values */}
      <div className="grid grid-cols-1 gap-8 pt-14 md:grid-cols-2 lg:grid-cols-4">
        {coreValues.map((value, index) => (
          <Card
            key={index}
            className="group relative rounded-md border-none shadow-none"
          >
            <div className="border-animation pointer-events-none absolute inset-0">
              <span className="absolute inset-0"></span>
              <div className="left-top absolute top-0 left-0"></div>
              <div className="left-bottom absolute bottom-0 left-0"></div>
              <div className="right-top absolute top-0 right-0"></div>
              <div className="right-bottom absolute right-0 bottom-0"></div>
            </div>
            <CardHeader className="text-center">
              <div className="flex justify-center">
                <div
                  className={`h-24 w-24 ${value.bgColor} flex items-center justify-center rounded-2xl`}
                >
                  {value.icon}
                </div>
              </div>
              <CardTitle className="pt-4 text-xl font-bold">
                {value.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="-mt-2 pt-0">
              <CardDescription className="text-center leading-relaxed">
                {value.description}
              </CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}

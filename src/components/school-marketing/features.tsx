"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import Image from "next/image"
import { Crown, Star, Trophy, Users } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import SectionHeading from "../atom/section-heading"

const featureIcons = [
  { src: "/site/teleport.png", alt: "Learning" },
  { src: "/site/tent.png", alt: "Curriculum" },
  { src: "/site/community.png", alt: "Community" },
  { src: "/site/champion.png", alt: "Champions" },
  { src: "/site/world.png", alt: "World" },
  { src: "/site/light-bulb.png", alt: "Innovation" },
]

const statIcons = [
  <Crown key="crown" className="h-6 w-6" />,
  <Users key="users" className="h-6 w-6" />,
  <Star key="star" className="h-6 w-6" />,
  <Trophy key="trophy" className="h-6 w-6" />,
]

export function Features() {
  const { dictionary } = useDictionary()
  const t = dictionary?.marketing?.site?.features

  const fallbackFeatures = [
    {
      title: "Immersive Learning",
      description:
        "Interactive and immersive education that transforms traditional learning into an enchanting adventure.",
    },
    {
      title: "Dynamic Programs",
      description:
        "Carefully crafted programs that blend core academics with creative thinking and real-world applications.",
    },
    {
      title: "House Community",
      description:
        "Close-knit learning communities that foster friendship, collaboration, and mutual support among students.",
    },
    {
      title: "Champions League",
      description:
        "Academic competitions, sports tournaments, and creative challenges that celebrate every student's unique talents.",
    },
    {
      title: "Worldwide Adventures",
      description:
        "Global exchange programs and virtual international collaborations that expand horizons beyond our castle walls.",
    },
    {
      title: "Innovation Potions",
      description:
        "STEAM laboratories and maker spaces where students concoct creative solutions to real-world challenges.",
    },
  ]

  const fallbackStats = [
    { number: "98%", label: "Graduation Rate" },
    { number: "15:1", label: "Student-Teacher Ratio" },
    { number: "40+", label: "Magical Programs" },
    { number: "25", label: "Years of Excellence" },
  ]

  const featureItems = t?.items || fallbackFeatures
  const statsItems = t?.stats || fallbackStats

  return (
    <>
      <section className="py-16 md:py-24">
        {/* Header */}
        <SectionHeading
          title={t?.title || "Features"}
          description={t?.description || "What makes us special"}
        />

        {/* Features Grid */}
        <div className="grid grid-cols-1 gap-8 pt-10 pb-20 md:grid-cols-2 lg:grid-cols-3">
          {(featureItems as Array<Record<string, unknown>>).map(
            (feature: Record<string, unknown>, index: number) => (
              <Card key={index} className="rounded-md shadow-none">
                <CardHeader className="flex flex-col items-center text-center">
                  <div className="mb-4">
                    <Image
                      src={featureIcons[index].src}
                      alt={featureIcons[index].alt}
                      width={32}
                      height={32}
                      className="dark:invert"
                    />
                  </div>
                  <CardTitle className="mb-2 text-xl font-bold">
                    {String(feature.title || fallbackFeatures[index]?.title)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <CardDescription className="text-center leading-relaxed">
                    {String(
                      feature.description ||
                        fallbackFeatures[index]?.description
                    )}
                  </CardDescription>
                </CardContent>
              </Card>
            )
          )}
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 md:py-24">
        <div className="pb-12 text-center">
          <h2 className="font-heading mb-4 text-4xl font-extrabold md:text-5xl">
            {t?.numbersTitle || "Numbers"}
          </h2>
          <p className="text-muted-foreground mx-auto max-w-2xl">
            {t?.numbersDescription ||
              "Numbers that reflect our commitment to excellence and the magical transformations happening in our classrooms every day."}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {(statsItems as Array<Record<string, unknown>>).map(
            (achievement: Record<string, unknown>, index: number) => (
              <div key={index} className="text-center">
                <div className="flex justify-center pb-3">
                  <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-full">
                    <div className="text-primary">{statIcons[index]}</div>
                  </div>
                </div>
                <div className="pb-2 text-3xl font-bold md:text-4xl">
                  {String(achievement.number || fallbackStats[index]?.number)}
                </div>
                <div className="text-muted-foreground font-medium">
                  {String(achievement.label || fallbackStats[index]?.label)}
                </div>
              </div>
            )
          )}
        </div>
      </section>
    </>
  )
}

"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import Autoplay from "embla-carousel-autoplay"
import { ArrowRight, Users } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel"

import type { StreamContentProps } from "../types"

const skills = [
  {
    title: "Generative AI",
    image: "/stream/skills/generative-ai.png",
    href: "/stream/courses?category=ai",
    learners: "1.7M+",
  },
  {
    title: "IT Certifications",
    image: "/stream/skills/it-certifications.png",
    href: "/stream/courses?category=it",
    learners: "14M+",
  },
  {
    title: "Data Science",
    image: "/stream/skills/data-science.png",
    href: "/stream/courses?category=data-science",
    learners: "8.1M+",
  },
]

export function SkillsSection({
  dictionary,
  lang,
}: Omit<StreamContentProps, "schoolId">) {
  const isRTL = lang === "ar"
  const [api, setApi] = React.useState<CarouselApi>()
  const [current, setCurrent] = React.useState(0)
  const [count, setCount] = React.useState(0)

  const plugin = React.useRef(
    Autoplay({ delay: 3000, stopOnInteraction: false, stopOnMouseEnter: true })
  )

  React.useEffect(() => {
    if (!api) return

    setCount(api.scrollSnapList().length)
    setCurrent(api.selectedScrollSnap())

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap())
    })
  }, [api])

  const scrollTo = React.useCallback(
    (index: number) => {
      api?.scrollTo(index)
    },
    [api]
  )

  return (
    <section className="py-16 md:py-24">
      <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
        {/* Left: Heading (3 cols) with more padding */}
        <div
          className={`lg:col-span-3 ${isRTL ? "text-right lg:order-2" : ""}`}
        >
          <h2 className="text-2xl leading-tight font-bold md:text-[28px]">
            {dictionary?.skills?.title ||
              "Learn essential career and life skills"}
          </h2>
          <p className="text-muted-foreground mt-4 text-[15px] leading-relaxed">
            {dictionary?.skills?.description ||
              "Hogwarts helps you build in-demand skills fast and advance your career in a changing job market."}
          </p>
        </div>

        {/* Right: Carousel (9 cols) */}
        <div className={`lg:col-span-9 ${isRTL ? "lg:order-1" : ""}`}>
          <Carousel
            setApi={setApi}
            opts={{
              align: "start",
              loop: true,
              direction: isRTL ? "rtl" : "ltr",
            }}
            plugins={[plugin.current]}
            className="w-full"
          >
            <CarouselContent className="-ml-4">
              {skills.map((skill) => (
                <CarouselItem
                  key={skill.title}
                  className="basis-full pl-4 sm:basis-1/2 lg:basis-1/3"
                >
                  <Link href={`/${lang}${skill.href}`} className="group block">
                    {/* Card - Hogwarts style */}
                    <div className="relative h-[400px] overflow-hidden rounded-2xl shadow-sm transition-all duration-300 hover:shadow-xl">
                      {/* Image as full background */}
                      <Image
                        src={skill.image}
                        alt={skill.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />

                      {/* Info Section - White box at bottom with padding on sides */}
                      <div className="bg-card absolute right-2 bottom-2 left-2 flex flex-col gap-2 rounded-xl p-3">
                        {/* Learner Count Badge */}
                        <div className="border-border text-muted-foreground inline-flex w-fit items-center gap-1 rounded-full border px-2 py-0.5 text-xs">
                          <Users className="h-3 w-3" />
                          <span>{skill.learners}</span>
                        </div>

                        {/* Title with Arrow */}
                        <div className="flex w-full flex-col gap-2">
                          <h4
                            className={cn(
                              "text-foreground text-base font-medium",
                              isRTL && "text-right"
                            )}
                          >
                            {skill.title}
                          </h4>
                          <div
                            className={cn(
                              "flex",
                              isRTL ? "justify-start" : "justify-end"
                            )}
                          >
                            <ArrowRight
                              className={cn(
                                "text-muted-foreground h-5 w-5 transition-transform duration-300",
                                "group-hover:translate-x-1",
                                isRTL && "rotate-180 group-hover:-translate-x-1"
                              )}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </CarouselItem>
              ))}
            </CarouselContent>

            {/* Dot Indicators Only - No arrows */}
            <div className="mt-8 flex items-center justify-center">
              <div className="flex items-center gap-2">
                {Array.from({ length: count }).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => scrollTo(index)}
                    className={cn(
                      "rounded-full transition-all duration-300",
                      current === index
                        ? "bg-primary h-2.5 w-6"
                        : "bg-muted-foreground/30 hover:bg-muted-foreground/50 h-2.5 w-2.5"
                    )}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </Carousel>
        </div>
      </div>
    </section>
  )
}

"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Users } from "lucide-react"
import Autoplay from "embla-carousel-autoplay"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel"
import { cn } from "@/lib/utils"
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

export function SkillsSection({ dictionary, lang }: Omit<StreamContentProps, 'schoolId'>) {
  const isRTL = lang === "ar"
  const [api, setApi] = React.useState<CarouselApi>()
  const [current, setCurrent] = React.useState(0)
  const [count, setCount] = React.useState(0)

  const plugin = React.useRef(
    Autoplay({ delay: 4000, stopOnInteraction: true })
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
      <div className="grid gap-8 lg:grid-cols-12 lg:gap-12 items-start">
        {/* Left: Heading (3 cols) */}
        <div className={`lg:col-span-3 ${isRTL ? "lg:order-2 text-right" : ""}`}>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
            {dictionary?.skills?.title || "Learn essential career and life skills"}
          </h2>
          <p className="mt-4 text-muted-foreground">
            {dictionary?.skills?.description ||
              "Udemy helps you build in-demand skills fast and advance your career in a changing job market."}
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
            onMouseEnter={plugin.current.stop}
            onMouseLeave={plugin.current.reset}
          >
            <CarouselContent className="-ml-4">
              {skills.map((skill) => (
                <CarouselItem
                  key={skill.title}
                  className="pl-4 basis-full sm:basis-1/2 lg:basis-1/3"
                >
                  <Link href={`/${lang}${skill.href}`} className="block group">
                    {/* Card Container */}
                    <div className="relative overflow-hidden rounded-2xl bg-card shadow-sm hover:shadow-lg transition-shadow">
                      {/* Image Section - Background style like Udemy */}
                      <div className="relative h-56 sm:h-64 overflow-hidden">
                        <Image
                          src={skill.image}
                          alt={skill.title}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>

                      {/* Info Section - White bottom area */}
                      <div className="p-4 bg-card">
                        {/* Learner Count Badge */}
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 mb-3 rounded-full bg-muted text-xs font-medium text-muted-foreground">
                          <Users className="h-3.5 w-3.5" />
                          <span>{skill.learners}</span>
                        </div>

                        {/* Title with Arrow */}
                        <div className={`flex items-center justify-between ${isRTL ? "flex-row-reverse" : ""}`}>
                          <h4 className="font-semibold text-foreground">
                            {skill.title}
                          </h4>
                          <ArrowRight className={`h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 ${isRTL ? "rotate-180 group-hover:-translate-x-1" : ""}`} />
                        </div>
                      </div>
                    </div>
                  </Link>
                </CarouselItem>
              ))}
            </CarouselContent>

            {/* Navigation Controls */}
            <div className="flex items-center justify-center gap-4 mt-6">
              <CarouselPrevious
                className="static translate-y-0 h-10 w-10 rounded-full border-2"
              />

              {/* Dot Indicators */}
              <div className="flex items-center gap-2">
                {Array.from({ length: count }).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => scrollTo(index)}
                    className={cn(
                      "h-2.5 w-2.5 rounded-full transition-all",
                      current === index
                        ? "bg-primary w-6"
                        : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                    )}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>

              <CarouselNext
                className="static translate-y-0 h-10 w-10 rounded-full border-2"
              />
            </div>
          </Carousel>
        </div>
      </div>
    </section>
  )
}

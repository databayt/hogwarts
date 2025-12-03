"use client"

import Image from "next/image"
import Link from "next/link"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { Card, CardContent } from "@/components/ui/card"
import type { StreamContentProps } from "../types"

const skills = [
  {
    title: "Generative AI",
    image: "/stream/skills/generative-ai.png",
    href: "/stream/courses?category=ai",
  },
  {
    title: "IT Certifications",
    image: "/stream/skills/it-certifications.png",
    href: "/stream/courses?category=it",
  },
  {
    title: "Data Science",
    image: "/stream/skills/data-science.png",
    href: "/stream/courses?category=data-science",
  },
]

export function SkillsSection({ dictionary, lang }: Omit<StreamContentProps, 'schoolId'>) {
  const isRTL = lang === "ar"

  return (
    <section className="py-16 md:py-24">
      <div className="grid gap-8 lg:grid-cols-12 lg:gap-12 items-center">
        {/* Left: Heading (4 cols) */}
        <div className={`lg:col-span-4 ${isRTL ? "lg:order-2 text-right" : ""}`}>
          <h2 className="scroll-m-20 text-2xl md:text-3xl font-semibold tracking-tight">
            {dictionary?.skills?.title || "Learn essential career and life skills"}
          </h2>
          <p className="mt-4 text-muted-foreground">
            {dictionary?.skills?.description ||
              "Udemy helps you build in-demand skills fast and advance your career in a changing job market."}
          </p>
        </div>

        {/* Right: Carousel (8 cols) */}
        <div className={`lg:col-span-8 ${isRTL ? "lg:order-1" : ""}`}>
          <Carousel
            opts={{
              align: "start",
              direction: isRTL ? "rtl" : "ltr",
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-4">
              {skills.map((skill) => (
                <CarouselItem
                  key={skill.title}
                  className="pl-4 basis-full sm:basis-1/2 lg:basis-1/3"
                >
                  <Link href={`/${lang}${skill.href}`}>
                    <Card className="overflow-hidden hover:shadow-lg transition-shadow border-0">
                      <CardContent className="p-0">
                        <div className="relative aspect-[4/3] bg-muted rounded-lg overflow-hidden">
                          <Image
                            src={skill.image}
                            alt={skill.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="py-4">
                          <p className={`font-medium ${isRTL ? "text-right" : ""}`}>
                            {skill.title}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden sm:flex -left-4" />
            <CarouselNext className="hidden sm:flex -right-4" />
          </Carousel>
        </div>
      </div>
    </section>
  )
}

"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React from "react"
import Image from "next/image"

import { InfiniteMovingCards } from "@/components/atom/infinite-cards"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import SectionHeading from "../atom/section-heading"

const statIcons = [
  { src: "/anthropic/star-outline.svg", alt: "Satisfaction" },
  { src: "/anthropic/graduation-cap.svg", alt: "Acceptance" },
  { src: "/anthropic/users.svg", alt: "Families" },
  { src: "/anthropic/check-circle.svg", alt: "Trust" },
]

const fallbackTestimonials = [
  {
    quote:
      "This school didn't just teach me subjects\u2014it taught me to believe in magic, both in learning and in myself. The teachers here don't just educate; they inspire and transform.",
    name: "Emily Harrison",
    title: "Class of 2023, Gryffindor Academy",
  },
  {
    quote:
      "The innovation labs here are incredible! I've been able to work on real research projects and even present at science fairs. It's like having access to a magical laboratory.",
    name: "Michael Chen",
    title: "Current Student, Ravenclaw Institute",
  },
  {
    quote:
      "Watching my daughter flourish here has been magical. She's gained confidence, made lifelong friends, and discovered passions I never knew she had. The community feeling is extraordinary.",
    name: "Sarah Martinez",
    title: "Parent of Sofia Martinez",
  },
  {
    quote:
      "The arts program here is phenomenal. I discovered my love for theater and creative writing, and the teachers supported every creative endeavor. It truly felt like Hogwarts for artists.",
    name: "James Wilson",
    title: "Class of 2022, Hufflepuff College",
  },
  {
    quote:
      "As an educator myself, I was impressed by the innovative teaching methods and genuine care for each student's individual growth. The house system creates such meaningful connections.",
    name: "Dr. Patricia Kumar",
    title: "Parent of Arjun Kumar",
  },
  {
    quote:
      "The business and entrepreneurship program opened my eyes to possibilities I never imagined. I've already started my own small venture with guidance from our amazing teachers!",
    name: "Olivia Thompson",
    title: "Current Student, Slytherin School",
  },
]

export function Testimonials() {
  const { dictionary } = useDictionary()
  const t = dictionary?.marketing?.site?.testimonials

  const fallbackStats = [
    { value: "4.9/5", label: "Parent Satisfaction" },
    { value: "98%", label: "College Acceptance" },
    { value: "500+", label: "Happy Families" },
    { value: "25+", label: "Years of Trust" },
  ]

  const stats = t?.stats || fallbackStats
  const testimonialItems = (t?.items || fallbackTestimonials) as Array<{
    quote: string
    name: string
    title: string
  }>

  return (
    <section className="py-16 md:py-24">
      {/* Header */}
      <SectionHeading
        title={t?.title || "Testimonials"}
        description={
          t?.description ||
          "Hear from our students, alumni, and parents about the transformative power of education and the magical moments that happen within our school community every day."
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-6 py-14 md:grid-cols-4">
        {(stats as Array<Record<string, unknown>>).map(
          (stat: Record<string, unknown>, index: number) => (
            <div
              key={index}
              className="border-card-border rounded-md border p-6 text-center"
            >
              <div className="flex justify-center pb-3">
                <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-full">
                  <Image
                    src={statIcons[index].src}
                    alt={statIcons[index].alt}
                    width={24}
                    height={24}
                  />
                </div>
              </div>
              <div className="pb-1 text-2xl font-bold">
                {String(stat.value || fallbackStats[index]?.value)}
              </div>
              <div className="text-sm">
                {String(stat.label || fallbackStats[index]?.label)}
              </div>
            </div>
          )
        )}
      </div>

      {/* Infinite Moving Testimonials */}
      <div className="pb-14">
        <InfiniteMovingCards
          items={testimonialItems}
          direction="right"
          speed="slow"
          className="pb-8"
        />
      </div>
    </section>
  )
}

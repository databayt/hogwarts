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

export function Testimonials() {
  const { dictionary, isLoading } = useDictionary()
  const t = dictionary?.marketing?.site?.testimonials

  // Don't render until dictionary is loaded to avoid flash of English fallback
  // that causes stale DOM clones in InfiniteMovingCards
  if (isLoading || !t) return null

  const stats = (t.stats || []) as Array<{ value: string; label: string }>
  const testimonialItems = (t.items || []) as Array<{
    quote: string
    name: string
    title: string
  }>

  if (testimonialItems.length === 0) return null

  return (
    <section className="py-16 md:py-24">
      {/* Header */}
      <SectionHeading title={t.title} description={t.description} />

      {/* Stats */}
      {stats.length > 0 && (
        <div className="grid grid-cols-2 gap-6 py-14 md:grid-cols-4">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="border-card-border rounded-md border p-6 text-center"
            >
              <div className="flex justify-center pb-3">
                <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-full">
                  {statIcons[index] && (
                    <Image
                      src={statIcons[index].src}
                      alt={statIcons[index].alt}
                      width={24}
                      height={24}
                    />
                  )}
                </div>
              </div>
              <div className="pb-1 text-2xl font-bold">{stat.value}</div>
              <div className="text-sm">{stat.label}</div>
            </div>
          ))}
        </div>
      )}

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

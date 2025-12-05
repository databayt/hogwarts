"use client"

import type { StreamContentProps } from "../types"
import { cn } from "@/lib/utils"

const reasons = [
  {
    image: "/stream/teach.jpg",
    title: "Teach your way",
    description: "Publish the course you want, in the way you want, and always have control of your own content.",
  },
  {
    image: "/stream/inspire.jpg",
    title: "Inspire learners",
    description: "Teach what you know and help learners explore their interests, gain new skills, and advance their careers.",
  },
  {
    image: "/stream/reward.jpg",
    title: "Get rewarded",
    description: "Expand your professional network, build your expertise, and earn money on each paid enrollment.",
  },
]

export function ReasonsSection({ dictionary, lang }: Omit<StreamContentProps, 'schoolId'>) {
  const isRTL = lang === "ar"

  return (
    <section className="py-16 md:py-24">
      {/* Title */}
      <div className="text-center mb-12 md:mb-16">
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold">
          {dictionary?.reasons?.title || "So many reasons to start"}
        </h2>
      </div>

      {/* Reasons Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 lg:gap-16">
        {reasons.map((reason, index) => (
          <div
            key={index}
            className={cn(
              "flex flex-col items-center text-center",
              isRTL && "md:text-right md:items-end"
            )}
          >
            {/* Icon Image */}
            <div className="mb-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={reason.image}
                alt={reason.title}
                width={100}
                height={100}
                className="object-contain"
              />
            </div>

            {/* Title */}
            <h3 className="text-lg md:text-xl font-bold mb-3">
              {dictionary?.reasons?.[`title${index + 1}`] || reason.title}
            </h3>

            {/* Description */}
            <p className="text-muted-foreground text-sm md:text-base leading-relaxed max-w-xs">
              {dictionary?.reasons?.[`description${index + 1}`] || reason.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}

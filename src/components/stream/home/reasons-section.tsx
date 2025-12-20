"use client"

import { cn } from "@/lib/utils"

import type { StreamContentProps } from "../types"

const reasons = [
  {
    image: "/stream/teach.jpg",
    title: "Teach your way",
    description:
      "Publish the course you want, in the way you want, and always have control of your own content.",
  },
  {
    image: "/stream/inspire.jpg",
    title: "Inspire learners",
    description:
      "Teach what you know and help learners explore their interests, gain new skills, and advance their careers.",
  },
  {
    image: "/stream/reward.jpg",
    title: "Get rewarded",
    description:
      "Expand your professional network, build your expertise, and earn money on each paid enrollment.",
  },
]

export function ReasonsSection({
  dictionary,
  lang,
}: Omit<StreamContentProps, "schoolId">) {
  return (
    <section className="py-16 sm:py-20 md:py-24">
      {/* Title */}
      <div className="mb-12 text-center md:mb-16">
        <h2 className="text-2xl font-bold md:text-3xl lg:text-4xl">
          {dictionary?.reasons?.title || "So many reasons to start"}
        </h2>
      </div>

      {/* Reasons Grid */}
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-3 md:gap-12 lg:gap-16">
        {reasons.map((reason, index) => (
          <div
            key={index}
            className="flex flex-col items-center text-center rtl:md:items-end rtl:md:text-end"
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
            <h3 className="mb-3 text-lg font-bold md:text-xl">
              {dictionary?.reasons?.[`title${index + 1}`] || reason.title}
            </h3>

            {/* Description */}
            <p className="text-muted-foreground max-w-xs text-sm leading-relaxed md:text-base">
              {dictionary?.reasons?.[`description${index + 1}`] ||
                reason.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}

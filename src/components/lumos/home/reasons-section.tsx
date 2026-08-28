// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { asset } from "@/lib/asset-url"

import type { LumosContentProps } from "../types"

// The follow-up to the teaching hero: three reasons to become an instructor.
// Dropped 2026-07-19 with the home restructure, restored on request 2026-08-15.
//
// Same caveat the teaching hero carries: this is Udemy-derived marketing copy,
// so replace it before the page is shown to a real tenant. (How-to-begin
// deliberately went the other way and now describes OUR propose → review → live
// flow — that rewrite is intentional and is not undone here.)
//
// The art is the same line-drawing set the section originally used, served from
// our own CDN. asset() keeps only the basename, so the source subdir is
// cosmetic — the objects live flat at cdn.databayt.org/hogwarts/<file>.
const reasons = [
  {
    image: asset("/illustrations/teach.jpg"),
    title: "Teach your way",
    description:
      "Publish the course you want, in the way you want, and always have control of your own content.",
  },
  {
    image: asset("/illustrations/inspire.jpg"),
    title: "Inspire learners",
    description:
      "Teach what you know and help learners explore their interests, gain new skills, and advance their careers.",
  },
  {
    image: asset("/illustrations/reward.jpg"),
    title: "Get rewarded",
    description:
      "Expand your professional network, build your expertise, and earn money on each paid enrollment.",
  },
]

export function ReasonsSection({
  dictionary,
}: Omit<LumosContentProps, "schoolId">) {
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
          <div key={index} className="flex flex-col items-center text-center">
            {/* Icon Image — decorative; the heading below names the reason. */}
            <div className="mb-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={reason.image}
                alt=""
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

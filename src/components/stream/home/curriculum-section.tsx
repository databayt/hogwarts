// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { Award, ListChecks, PlayCircle, TrendingUp } from "lucide-react"

import type { StreamContentProps } from "../types"

// School-LMS value props, each mapped to a real block feature (video lessons,
// lesson quizzes, LessonProgress, SubjectCertificate). Icons are lucide (bundled)
// — no external hotlinks. Copy is dictionary-driven; these are only fallbacks.
const features = [
  {
    Icon: PlayCircle,
    title: "Video lessons",
    description: "Watch every lesson taught on video, at your own pace.",
  },
  {
    Icon: ListChecks,
    title: "Practice quizzes",
    description:
      "Check what you understood after each lesson with a quick quiz.",
  },
  {
    Icon: TrendingUp,
    title: "Progress tracking",
    description: "See how far you've come across every course and lesson.",
  },
  {
    Icon: Award,
    title: "Certificates",
    description: "Earn a certificate the moment you complete a course.",
  },
]

export function CurriculumSection({
  dictionary,
}: Omit<StreamContentProps, "schoolId">) {
  return (
    <section className="mb-16 rounded-xl bg-[#6A9BCC] py-16">
      <div className="px-6 text-white">
        <div className="flex flex-col items-start gap-12 md:flex-row">
          {/* Title Section */}
          <div className="text-start md:w-1/2">
            <h2 className="mb-4 text-4xl leading-tight font-bold">
              {dictionary?.curriculum?.title || "Everything you need to learn"}
            </h2>
            <p className="max-w-[70%] text-lg leading-relaxed text-white/80">
              {dictionary?.curriculum?.description ||
                "Video lessons, practice quizzes, progress tracking, and certificates — all in one place."}
            </p>
          </div>

          {/* Icons Grid 2x2 */}
          <div className="grid grid-cols-2 gap-10 md:w-1/2">
            {features.map((feature, index) => {
              const Icon = feature.Icon
              return (
                <div key={index} className="text-start">
                  {/* Icon */}
                  <div className="mb-4 flex h-14 items-end">
                    <Icon
                      className="h-10 w-10"
                      strokeWidth={1.5}
                      aria-hidden="true"
                    />
                  </div>

                  {/* Title */}
                  <h3 className="mb-3 text-lg font-semibold">
                    {dictionary?.curriculum?.[`feature${index + 1}Title`] ||
                      feature.title}
                  </h3>

                  {/* Description */}
                  <p className="text-sm leading-relaxed text-white/70">
                    {dictionary?.curriculum?.[`feature${index + 1}Desc`] ||
                      feature.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

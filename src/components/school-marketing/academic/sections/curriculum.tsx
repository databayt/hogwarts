// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { AnthropicIcons } from "@/components/icons"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { SectionContainer } from "../../admission/shared/section-container"

interface AcademicCurriculumProps {
  lang: Locale
  dictionary?: Dictionary
}

export function AcademicCurriculum({
  lang,
  dictionary,
}: AcademicCurriculumProps) {
  const curriculum = dictionary?.marketing?.site?.academic?.curriculum

  const levels = [
    {
      title: curriculum?.earlyYears?.title || "Early Years (K-5)",
      description:
        curriculum?.earlyYears?.description ||
        "Foundation building with hands-on learning, literacy development, and social skills through play-based education.",
      features: [
        curriculum?.earlyYears?.features?.phonics || "Phonics & Reading",
        curriculum?.earlyYears?.features?.math || "Math Foundations",
        curriculum?.earlyYears?.features?.science || "Science Exploration",
        curriculum?.earlyYears?.features?.social || "Social Studies",
        curriculum?.earlyYears?.features?.arts || "Arts & Music",
      ],
      icon: AnthropicIcons.Sparkle,
    },
    {
      title: curriculum?.middleSchool?.title || "Middle School (6-8)",
      description:
        curriculum?.middleSchool?.description ||
        "Transitional years focusing on critical thinking, independent learning, and preparation for advanced studies.",
      features: [
        curriculum?.middleSchool?.features?.math || "Advanced Mathematics",
        curriculum?.middleSchool?.features?.literature || "Literature Analysis",
        curriculum?.middleSchool?.features?.science || "Scientific Method",
        curriculum?.middleSchool?.features?.history || "World History",
        curriculum?.middleSchool?.features?.technology || "Technology Skills",
      ],
      icon: AnthropicIcons.Book,
    },
    {
      title: curriculum?.highSchool?.title || "High School (9-12)",
      description:
        curriculum?.highSchool?.description ||
        "College preparatory curriculum with specialized tracks, AP courses, and career exploration opportunities.",
      features: [
        curriculum?.highSchool?.features?.prep || "College Prep Courses",
        curriculum?.highSchool?.features?.honors || "AP & Honors Classes",
        curriculum?.highSchool?.features?.career || "Career Pathways",
        curriculum?.highSchool?.features?.research || "Research Projects",
        curriculum?.highSchool?.features?.leadership ||
          "Leadership Development",
      ],
      icon: AnthropicIcons.Archive,
    },
  ]

  return (
    <SectionContainer id="curriculum">
      <div className="mb-16 text-center">
        <p className="eyebrow band-muted mb-3">
          {lang === "ar" ? "المناهج الدراسية" : "Curriculum Structure"}
        </p>
        <h2 className="font-heading mb-4 text-3xl font-bold text-neutral-900 md:text-4xl">
          {curriculum?.title || "Curriculum Overview"}
        </h2>
        <p className="band-muted mx-auto max-w-2xl text-lg">
          {curriculum?.subtitle ||
            "Our progressive curriculum is designed to build knowledge systematically while fostering critical thinking and creativity at every stage."}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
        {levels.map((level, index) => (
          <div key={index} className="relative rounded-3xl bg-white p-6 md:p-8">
            <span className="absolute end-6 top-6 text-4xl font-light text-neutral-200">
              {index + 1}
            </span>
            <level.icon className="mb-4 h-8 w-8 text-neutral-900" />
            <h3 className="font-heading mb-2 text-lg font-semibold text-neutral-900">
              {level.title}
            </h3>
            <p className="mb-4 text-sm text-neutral-600">{level.description}</p>
            <ul className="space-y-2">
              {level.features.map((feature, featureIndex) => (
                <li
                  key={featureIndex}
                  className="flex items-start gap-3 text-sm text-neutral-600"
                >
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-neutral-900" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </SectionContainer>
  )
}

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { SectionContainer } from "../../admission/shared/section-container"

interface AcademicProgramsProps {
  lang: Locale
  dictionary?: Dictionary
}

export function AcademicPrograms({ lang, dictionary }: AcademicProgramsProps) {
  const programsData = dictionary?.marketing?.site?.academic?.programs

  const programs = [
    {
      number: "01",
      title: programsData?.items?.core?.title || "Core Academic Excellence",
      description:
        programsData?.items?.core?.description ||
        "Rigorous curriculum in Mathematics, Sciences, Literature, and Humanities that builds strong foundational knowledge.",
    },
    {
      number: "02",
      title: programsData?.items?.steam?.title || "STEAM Innovation",
      description:
        programsData?.items?.steam?.description ||
        "Science, Technology, Engineering, Arts, and Mathematics programs that foster creativity and problem-solving skills.",
    },
    {
      number: "03",
      title: programsData?.items?.global?.title || "Global Studies",
      description:
        programsData?.items?.global?.description ||
        "International perspectives, language learning, and cultural exchange programs that prepare students for a connected world.",
    },
    {
      number: "04",
      title: programsData?.items?.ap?.title || "Advanced Placement",
      description:
        programsData?.items?.ap?.description ||
        "College-level courses that challenge high-achieving students and provide college credit opportunities.",
    },
    {
      number: "05",
      title: programsData?.items?.arts?.title || "Arts & Creativity",
      description:
        programsData?.items?.arts?.description ||
        "Comprehensive arts education including music, visual arts, drama, and creative writing to nurture artistic expression.",
    },
    {
      number: "06",
      title: programsData?.items?.character?.title || "Character Education",
      description:
        programsData?.items?.character?.description ||
        "Values-based learning that develops integrity, leadership, and social responsibility in every student.",
    },
  ]

  return (
    <SectionContainer id="programs">
      <div className="mb-16 text-center">
        <p className="eyebrow band-muted mb-3">
          {lang === "ar" ? "مسارات التعليم" : "Educational Pathways"}
        </p>
        <h2 className="font-heading mb-4 text-3xl font-bold text-neutral-900 md:text-4xl">
          {programsData?.title || "Academic Programs"}
        </h2>
        <p className="band-muted mx-auto max-w-2xl text-lg">
          {programsData?.subtitle ||
            "Comprehensive educational pathways designed to unlock every student's potential and prepare them for future success."}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
        {programs.map((program) => (
          <div
            key={program.number}
            className="flex min-h-48 flex-col justify-between rounded-3xl bg-white p-6 md:p-8"
          >
            <div>
              <span className="mb-3 block text-sm font-medium text-neutral-400">
                {program.number}
              </span>
              <h3 className="font-heading mb-2 text-lg font-semibold text-neutral-900 md:text-xl">
                {program.title}
              </h3>
            </div>
            <p className="text-sm leading-relaxed text-neutral-600">
              {program.description}
            </p>
          </div>
        ))}
      </div>
    </SectionContainer>
  )
}

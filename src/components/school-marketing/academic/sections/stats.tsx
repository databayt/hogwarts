// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { AnthropicIcons } from "@/components/icons"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { SectionContainer } from "../../admission/shared/section-container"

interface AcademicStatsProps {
  lang: Locale
  dictionary?: Dictionary
}

export function AcademicStats({ lang, dictionary }: AcademicStatsProps) {
  const isRTL = lang === "ar"

  const stats = [
    {
      number: isRTL ? "٩٥٪" : "95%",
      label:
        dictionary?.marketing?.site?.academic?.stats?.collegeAcceptance ||
        "College Acceptance Rate",
      icon: AnthropicIcons.Archive,
    },
    {
      number: isRTL ? "١٢:١" : "12:1",
      label:
        dictionary?.marketing?.site?.academic?.stats?.studentTeacherRatio ||
        "Student-Teacher Ratio",
      icon: AnthropicIcons.Users,
    },
    {
      number: isRTL ? "+٢٥" : "25+",
      label:
        dictionary?.marketing?.site?.academic?.stats?.apCourses ||
        "AP Courses Offered",
      icon: AnthropicIcons.Book,
    },
    {
      number: isRTL ? "٩٨٪" : "98%",
      label:
        dictionary?.marketing?.site?.academic?.stats?.graduationRate ||
        "Graduation Rate",
      icon: AnthropicIcons.Checklist,
    },
  ]

  return (
    <SectionContainer id="stats" className="py-10 md:py-14 lg:py-16">
      <div className="mb-12 text-center">
        <p className="eyebrow band-muted mb-3">
          {lang === "ar" ? "أرقامنا" : "By the numbers"}
        </p>
        <h2 className="font-heading mb-4 text-3xl font-bold text-neutral-900 md:text-4xl">
          {dictionary?.marketing?.site?.academic?.stats?.title ||
            "Academic Excellence"}
        </h2>
        <p className="band-muted mx-auto max-w-2xl text-lg">
          {dictionary?.marketing?.site?.academic?.stats?.subtitle ||
            "Numbers that reflect our commitment to academic excellence and the transformative impact of our educational programs."}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
        {stats.map((stat, index) => (
          <div key={index} className="text-center">
            <div className="font-heading text-4xl font-bold text-neutral-900 md:text-5xl">
              {stat.number}
            </div>
            <div className="band-muted mt-2 text-sm font-medium">
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </SectionContainer>
  )
}

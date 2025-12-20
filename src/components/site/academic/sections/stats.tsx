import { AnthropicIcons } from "@/components/icons/anthropic"
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
    <SectionContainer id="stats">
      <div className="mb-16 text-center">
        <h2 className="font-heading mb-4 text-3xl font-bold md:text-4xl">
          {dictionary?.marketing?.site?.academic?.stats?.title ||
            "Academic Excellence"}
        </h2>
        <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
          {dictionary?.marketing?.site?.academic?.stats?.subtitle ||
            "Numbers that reflect our commitment to academic excellence and the transformative impact of our educational programs."}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
        {stats.map((stat, index) => (
          <div key={index} className="text-center">
            <div className="bg-muted mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full">
              <stat.icon className="h-6 w-6" />
            </div>
            <div className="text-3xl font-bold md:text-4xl">{stat.number}</div>
            <div className="text-muted-foreground text-sm font-medium">
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </SectionContainer>
  )
}

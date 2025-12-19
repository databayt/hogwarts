import { AnthropicIcons } from "@/components/icons/anthropic"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { SectionContainer } from "../../admission/shared/section-container"

interface AcademicStatsProps {
  lang: Locale
  dictionary?: Dictionary
}

export function AcademicStats({ lang }: AcademicStatsProps) {
  const isRTL = lang === "ar"

  const stats = [
    {
      number: isRTL ? "٩٥٪" : "95%",
      label: isRTL ? "معدل القبول الجامعي" : "College Acceptance Rate",
      icon: AnthropicIcons.Archive,
    },
    {
      number: isRTL ? "١٢:١" : "12:1",
      label: isRTL ? "نسبة الطلاب للمعلم" : "Student-Teacher Ratio",
      icon: AnthropicIcons.Users,
    },
    {
      number: isRTL ? "+٢٥" : "25+",
      label: isRTL ? "دورات متقدمة" : "AP Courses Offered",
      icon: AnthropicIcons.Book,
    },
    {
      number: isRTL ? "٩٨٪" : "98%",
      label: isRTL ? "معدل التخرج" : "Graduation Rate",
      icon: AnthropicIcons.Checklist,
    },
  ]

  return (
    <SectionContainer id="stats" className="bg-primary text-primary-foreground">
      <div className="mb-16 text-center">
        <h2 className="font-heading mb-4 text-3xl font-bold md:text-4xl">
          {isRTL ? "التميز الأكاديمي" : "Academic Excellence"}
        </h2>
        <p className="mx-auto max-w-2xl text-lg opacity-90">
          {isRTL
            ? "أرقام تعكس التزامنا بالتميز الأكاديمي وتأثير برامجنا التعليمية التحويلي."
            : "Numbers that reflect our commitment to academic excellence and the transformative impact of our educational programs."}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
        {stats.map((stat, index) => (
          <div key={index} className="text-center">
            <div className="bg-primary-foreground/10 mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full">
              <stat.icon className="h-6 w-6" />
            </div>
            <div className="text-3xl font-bold md:text-4xl">{stat.number}</div>
            <div className="text-primary-foreground/80 text-sm font-medium">
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </SectionContainer>
  )
}

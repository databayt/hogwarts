import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { FeatureCard } from "../../shared/feature-card"
import { SectionContainer } from "../shared/section-container"

interface AdmissionValuesProps {
  lang: Locale
  dictionary?: Dictionary
}

export function AdmissionValues({ lang }: AdmissionValuesProps) {
  const isRTL = lang === "ar"

  const values = [
    {
      number: "01",
      title: isRTL ? "التميز الأكاديمي" : "Academic Excellence",
      borderColor: "border-blue-500",
      strokeColor: "#3b82f6",
    },
    {
      number: "02",
      title: isRTL ? "منظور عالمي" : "Global Perspective",
      borderColor: "border-cyan-500",
      strokeColor: "#06b6d4",
    },
    {
      number: "03",
      title: isRTL ? "بيئة رعاية" : "Nurturing Environment",
      borderColor: "border-teal-500",
      strokeColor: "#14b8a6",
    },
    {
      number: "04",
      title: isRTL ? "بناء الشخصية" : "Character Development",
      borderColor: "border-emerald-500",
      strokeColor: "#10b981",
    },
  ]

  return (
    <SectionContainer>
      <h2 className="font-heading mb-16 text-3xl font-bold md:text-4xl">
        {isRTL ? "لماذا تختارنا" : "Why Choose Us"}
      </h2>

      <div className="grid grid-cols-2 items-center gap-6 md:grid-cols-2 lg:grid-cols-4">
        {values.map((value) => (
          <FeatureCard
            key={value.number}
            number={value.number}
            title={value.title}
            borderColor={value.borderColor}
            strokeColor={value.strokeColor}
          />
        ))}
      </div>
    </SectionContainer>
  )
}

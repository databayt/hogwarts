import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

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
      description: isRTL
        ? "معايير أكاديمية عالية مع سجل حافل بنجاح الطلاب وتحقيق أعلى الدرجات"
        : "High academic standards with proven student success track record and top achievements",
    },
    {
      number: "02",
      title: isRTL ? "منظور عالمي" : "Global Perspective",
      description: isRTL
        ? "مناهج دولية وبرامج تبادل ثقافي تعد الطلاب للعالم المعاصر"
        : "International curriculum and cultural exchange programs preparing students for the modern world",
    },
    {
      number: "03",
      title: isRTL ? "بيئة رعاية" : "Nurturing Environment",
      description: isRTL
        ? "مجتمع داعم يشعر فيه كل طالب بالتقدير والتشجيع على التميز"
        : "Supportive community where every student feels valued and encouraged to excel",
    },
    {
      number: "04",
      title: isRTL ? "بناء الشخصية" : "Character Development",
      description: isRTL
        ? "تعليم قائم على القيم ينمي النزاهة والقيادة والمسؤولية الاجتماعية"
        : "Values-based education developing integrity, leadership, and social responsibility",
    },
  ]

  return (
    <SectionContainer className="bg-muted/30">
      <h2 className="font-heading mb-16 text-3xl font-bold md:text-4xl">
        {isRTL ? "لماذا تختارنا" : "Why Choose Us"}
      </h2>

      <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:gap-16">
        {values.map((value) => (
          <div key={value.number} className="group">
            <span className="text-muted-foreground/20 group-hover:text-primary/20 mb-4 block text-6xl font-light transition-colors lg:text-7xl">
              {value.number}
            </span>
            <h3 className="font-heading mb-3 text-xl font-semibold">
              {value.title}
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              {value.description}
            </p>
          </div>
        ))}
      </div>
    </SectionContainer>
  )
}

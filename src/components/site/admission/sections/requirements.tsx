import { AnthropicIcons } from "@/components/icons/anthropic"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { SectionContainer } from "../shared/section-container"

interface AdmissionRequirementsProps {
  lang: Locale
  dictionary?: Dictionary
}

export function AdmissionRequirements({ lang }: AdmissionRequirementsProps) {
  const isRTL = lang === "ar"

  const categories = [
    {
      title: isRTL ? "السجلات الأكاديمية" : "Academic Records",
      icon: AnthropicIcons.Archive,
      items: [
        isRTL ? "الشهادات الرسمية" : "Official transcripts",
        isRTL ? "درجات الاختبارات (إن وجدت)" : "Test scores (if applicable)",
        isRTL ? "توصيات المعلمين" : "Teacher recommendations",
      ],
    },
    {
      title: isRTL ? "المعلومات الشخصية" : "Personal Information",
      icon: AnthropicIcons.Checklist,
      items: [
        isRTL ? "شهادة الميلاد" : "Birth certificate",
        isRTL ? "سجلات التطعيم" : "Immunization records",
        isRTL ? "جهات الاتصال للطوارئ" : "Emergency contacts",
      ],
    },
    {
      title: isRTL ? "نماذج الطلب" : "Application Forms",
      icon: AnthropicIcons.Book,
      items: [
        isRTL ? "استمارة التقديم المكتملة" : "Completed application form",
        isRTL ? "استبيان الوالدين" : "Parent questionnaire",
        isRTL ? "رسوم التقديم" : "Application fee",
      ],
    },
  ]

  return (
    <SectionContainer className="bg-muted/30">
      <h2 className="font-heading mb-16 text-3xl font-bold md:text-4xl">
        {isRTL ? "متطلبات القبول" : "Admission Requirements"}
      </h2>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {categories.map((category, index) => (
          <div
            key={index}
            className="bg-card border-border rounded-lg border p-6"
          >
            <category.icon className="text-primary mb-4 h-8 w-8" />
            <h3 className="font-heading mb-4 text-lg font-semibold">
              {category.title}
            </h3>
            <ul className="space-y-3">
              {category.items.map((item, i) => (
                <li
                  key={i}
                  className="text-muted-foreground flex items-start gap-3 text-sm"
                >
                  <span className="bg-primary mt-2 h-1.5 w-1.5 shrink-0 rounded-full" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </SectionContainer>
  )
}

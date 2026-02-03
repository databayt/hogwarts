import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { SectionContainer } from "../shared/section-container"

interface AdmissionDatesProps {
  lang: Locale
  dictionary?: Dictionary
}

export function AdmissionDates({ lang }: AdmissionDatesProps) {
  const isRTL = lang === "ar"

  const dates = [
    {
      date: isRTL ? "1 سبتمبر" : "Sept 1",
      title: isRTL ? "بدء التقديم" : "Applications Open",
      description: isRTL
        ? "ابدأ طلبك عبر الإنترنت"
        : "Begin your online application",
    },
    {
      date: isRTL ? "15 نوفمبر" : "Nov 15",
      title: isRTL ? "الموعد النهائي المبكر" : "Early Deadline",
      description: isRTL
        ? "آخر موعد للقرار المبكر"
        : "Last date for early decision applications",
    },
    {
      date: isRTL ? "15 يناير" : "Jan 15",
      title: isRTL ? "الموعد النهائي العادي" : "Regular Deadline",
      description: isRTL
        ? "آخر موعد للتقديم العادي"
        : "Final deadline for regular admission",
    },
    {
      date: isRTL ? "1 مارس" : "Mar 1",
      title: isRTL ? "إعلان القرارات" : "Decisions Released",
      description: isRTL
        ? "إرسال إشعارات القبول"
        : "Admission notifications sent to applicants",
    },
  ]

  return (
    <SectionContainer>
      <h2 className="font-heading mb-16 text-3xl font-bold md:text-4xl">
        {isRTL ? "التواريخ المهمة" : "Key Dates"}
      </h2>

      <div className="relative">
        {/* Timeline line - visible on md+ */}
        <div className="bg-border absolute start-8 top-0 bottom-0 hidden w-px md:block" />

        <div className="space-y-8 md:space-y-12">
          {dates.map((item, index) => (
            <div key={index} className="flex items-start gap-6 md:gap-8">
              {/* Date badge */}
              <div className="bg-primary text-primary-foreground z-10 flex h-16 w-16 shrink-0 items-center justify-center rounded-full">
                <span className="px-1 text-center text-xs leading-tight font-semibold">
                  {item.date}
                </span>
              </div>

              {/* Content */}
              <div className="pt-3">
                <h3 className="font-heading mb-1 text-lg font-semibold">
                  {item.title}
                </h3>
                <p className="text-muted-foreground">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </SectionContainer>
  )
}

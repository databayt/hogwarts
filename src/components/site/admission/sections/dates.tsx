import { SectionContainer } from "../shared/section-container";
import type { Dictionary } from "@/components/internationalization/dictionaries";
import type { Locale } from "@/components/internationalization/config";

interface AdmissionDatesProps {
  lang: Locale;
  dictionary?: Dictionary;
}

export function AdmissionDates({ lang }: AdmissionDatesProps) {
  const isRTL = lang === "ar";

  const dates = [
    {
      date: isRTL ? "1 سبتمبر" : "Sept 1",
      title: isRTL ? "بدء التقديم" : "Applications Open",
      description: isRTL
        ? "ابدأ طلبك عبر الإنترنت"
        : "Begin your online application"
    },
    {
      date: isRTL ? "15 نوفمبر" : "Nov 15",
      title: isRTL ? "الموعد النهائي المبكر" : "Early Deadline",
      description: isRTL
        ? "آخر موعد للقرار المبكر"
        : "Last date for early decision applications"
    },
    {
      date: isRTL ? "15 يناير" : "Jan 15",
      title: isRTL ? "الموعد النهائي العادي" : "Regular Deadline",
      description: isRTL
        ? "آخر موعد للتقديم العادي"
        : "Final deadline for regular admission"
    },
    {
      date: isRTL ? "1 مارس" : "Mar 1",
      title: isRTL ? "إعلان القرارات" : "Decisions Released",
      description: isRTL
        ? "إرسال إشعارات القبول"
        : "Admission notifications sent to applicants"
    }
  ];

  return (
    <SectionContainer>
      <h2 className="font-heading font-bold text-3xl md:text-4xl mb-16">
        {isRTL ? "التواريخ المهمة" : "Key Dates"}
      </h2>

      <div className="relative">
        {/* Timeline line - visible on md+ */}
        <div className="absolute start-8 top-0 bottom-0 w-px bg-border hidden md:block" />

        <div className="space-y-8 md:space-y-12">
          {dates.map((item, index) => (
            <div key={index} className="flex gap-6 md:gap-8 items-start">
              {/* Date badge */}
              <div className="shrink-0 w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center z-10">
                <span className="text-xs font-semibold text-center leading-tight px-1">
                  {item.date}
                </span>
              </div>

              {/* Content */}
              <div className="pt-3">
                <h3 className="font-heading font-semibold text-lg mb-1">
                  {item.title}
                </h3>
                <p className="text-muted-foreground">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </SectionContainer>
  );
}

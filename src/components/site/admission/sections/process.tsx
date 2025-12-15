import { AnthropicIcons } from "@/components/icons/anthropic"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { SectionContainer } from "../shared/section-container"

interface AdmissionProcessProps {
  lang: Locale
  dictionary?: Dictionary
}

export function AdmissionProcess({ lang }: AdmissionProcessProps) {
  const isRTL = lang === "ar"

  const steps = [
    {
      icon: AnthropicIcons.Book,
      title: isRTL ? "تقديم الطلب" : "Submit Application",
      description: isRTL
        ? "أكمل استمارة التقديم عبر الإنترنت مع جميع المستندات المطلوبة"
        : "Complete our online application form with all required documents",
    },
    {
      icon: AnthropicIcons.Checklist,
      title: isRTL ? "جولة في الحرم" : "Campus Tour",
      description: isRTL
        ? "استكشف مرافقنا المذهلة في جولة إرشادية شاملة"
        : "Experience our amazing facilities with a guided tour",
    },
    {
      icon: AnthropicIcons.Chat,
      title: isRTL ? "لقاء التعارف" : "Meet & Greet",
      description: isRTL
        ? "تواصل مع فريق القبول وأعضاء هيئة التدريس"
        : "Connect with our admissions team and faculty members",
    },
    {
      icon: AnthropicIcons.Sparkle,
      title: isRTL ? "انضم للعائلة" : "Join Family",
      description: isRTL
        ? "أكمل التسجيل وابدأ رحلتك التعليمية معنا"
        : "Complete enrollment and begin your educational journey with us",
    },
  ]

  return (
    <SectionContainer>
      <div className="mb-16">
        <h2 className="font-heading mb-4 text-3xl font-bold md:text-4xl">
          {isRTL ? "عملية القبول" : "Admission Process"}
        </h2>
        <p className="text-muted-foreground max-w-2xl text-lg">
          {isRTL
            ? "أربع خطوات بسيطة للانضمام إلى مجتمعنا التعليمي"
            : "Four simple steps to join our educational community"}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, index) => (
          <div
            key={index}
            className="group border-border bg-card hover:border-primary/50 relative rounded-lg border p-6 transition-all duration-200 hover:shadow-lg"
          >
            {/* Step Number */}
            <span className="text-muted-foreground/20 group-hover:text-primary/20 absolute end-4 top-4 text-4xl font-light transition-colors">
              {index + 1}
            </span>

            {/* Icon */}
            <step.icon className="text-primary mb-4 h-8 w-8" />

            {/* Content */}
            <h3 className="font-heading mb-2 text-lg font-semibold">
              {step.title}
            </h3>
            <p className="text-muted-foreground text-sm">{step.description}</p>
          </div>
        ))}
      </div>
    </SectionContainer>
  )
}

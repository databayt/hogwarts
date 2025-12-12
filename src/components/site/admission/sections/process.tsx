import { SectionContainer } from "../shared/section-container";
import { AnthropicIcons } from "@/components/icons/anthropic";
import type { Dictionary } from "@/components/internationalization/dictionaries";
import type { Locale } from "@/components/internationalization/config";

interface AdmissionProcessProps {
  lang: Locale;
  dictionary?: Dictionary;
}

export function AdmissionProcess({ lang }: AdmissionProcessProps) {
  const isRTL = lang === "ar";

  const steps = [
    {
      icon: AnthropicIcons.Book,
      title: isRTL ? "تقديم الطلب" : "Submit Application",
      description: isRTL
        ? "أكمل استمارة التقديم عبر الإنترنت مع جميع المستندات المطلوبة"
        : "Complete our online application form with all required documents"
    },
    {
      icon: AnthropicIcons.Checklist,
      title: isRTL ? "جولة في الحرم" : "Campus Tour",
      description: isRTL
        ? "استكشف مرافقنا المذهلة في جولة إرشادية شاملة"
        : "Experience our amazing facilities with a guided tour"
    },
    {
      icon: AnthropicIcons.Chat,
      title: isRTL ? "لقاء التعارف" : "Meet & Greet",
      description: isRTL
        ? "تواصل مع فريق القبول وأعضاء هيئة التدريس"
        : "Connect with our admissions team and faculty members"
    },
    {
      icon: AnthropicIcons.Sparkle,
      title: isRTL ? "انضم للعائلة" : "Join Family",
      description: isRTL
        ? "أكمل التسجيل وابدأ رحلتك التعليمية معنا"
        : "Complete enrollment and begin your educational journey with us"
    }
  ];

  return (
    <SectionContainer>
      <div className="mb-16">
        <h2 className="font-heading font-bold text-3xl md:text-4xl mb-4">
          {isRTL ? "عملية القبول" : "Admission Process"}
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl">
          {isRTL
            ? "أربع خطوات بسيطة للانضمام إلى مجتمعنا التعليمي"
            : "Four simple steps to join our educational community"}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {steps.map((step, index) => (
          <div
            key={index}
            className="group relative p-6 rounded-lg border border-border bg-card hover:border-primary/50 hover:shadow-lg transition-all duration-200"
          >
            {/* Step Number */}
            <span className="absolute top-4 end-4 text-4xl font-light text-muted-foreground/20 group-hover:text-primary/20 transition-colors">
              {index + 1}
            </span>

            {/* Icon */}
            <step.icon className="w-8 h-8 text-primary mb-4" />

            {/* Content */}
            <h3 className="font-heading font-semibold text-lg mb-2">
              {step.title}
            </h3>
            <p className="text-sm text-muted-foreground">
              {step.description}
            </p>
          </div>
        ))}
      </div>
    </SectionContainer>
  );
}

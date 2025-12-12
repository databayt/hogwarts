import { SectionContainer } from "../shared/section-container";
import { AnthropicIcons } from "@/components/icons/anthropic";
import type { Dictionary } from "@/components/internationalization/dictionaries";
import type { Locale } from "@/components/internationalization/config";

interface AdmissionRequirementsProps {
  lang: Locale;
  dictionary?: Dictionary;
}

export function AdmissionRequirements({ lang }: AdmissionRequirementsProps) {
  const isRTL = lang === "ar";

  const categories = [
    {
      title: isRTL ? "السجلات الأكاديمية" : "Academic Records",
      icon: AnthropicIcons.Archive,
      items: [
        isRTL ? "الشهادات الرسمية" : "Official transcripts",
        isRTL ? "درجات الاختبارات (إن وجدت)" : "Test scores (if applicable)",
        isRTL ? "توصيات المعلمين" : "Teacher recommendations"
      ]
    },
    {
      title: isRTL ? "المعلومات الشخصية" : "Personal Information",
      icon: AnthropicIcons.Checklist,
      items: [
        isRTL ? "شهادة الميلاد" : "Birth certificate",
        isRTL ? "سجلات التطعيم" : "Immunization records",
        isRTL ? "جهات الاتصال للطوارئ" : "Emergency contacts"
      ]
    },
    {
      title: isRTL ? "نماذج الطلب" : "Application Forms",
      icon: AnthropicIcons.Book,
      items: [
        isRTL ? "استمارة التقديم المكتملة" : "Completed application form",
        isRTL ? "استبيان الوالدين" : "Parent questionnaire",
        isRTL ? "رسوم التقديم" : "Application fee"
      ]
    }
  ];

  return (
    <SectionContainer className="bg-muted/30">
      <h2 className="font-heading font-bold text-3xl md:text-4xl mb-16">
        {isRTL ? "متطلبات القبول" : "Admission Requirements"}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {categories.map((category, index) => (
          <div
            key={index}
            className="p-6 rounded-lg bg-card border border-border"
          >
            <category.icon className="w-8 h-8 text-primary mb-4" />
            <h3 className="font-heading font-semibold text-lg mb-4">
              {category.title}
            </h3>
            <ul className="space-y-3">
              {category.items.map((item, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 text-sm text-muted-foreground"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </SectionContainer>
  );
}

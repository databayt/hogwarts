import { SectionContainer } from "../shared/section-container";
import type { Dictionary } from "@/components/internationalization/dictionaries";
import type { Locale } from "@/components/internationalization/config";

interface AdmissionValuesProps {
  lang: Locale;
  dictionary?: Dictionary;
}

export function AdmissionValues({ lang }: AdmissionValuesProps) {
  const isRTL = lang === "ar";

  const values = [
    {
      number: "01",
      title: isRTL ? "التميز الأكاديمي" : "Academic Excellence",
      description: isRTL
        ? "معايير أكاديمية عالية مع سجل حافل بنجاح الطلاب وتحقيق أعلى الدرجات"
        : "High academic standards with proven student success track record and top achievements"
    },
    {
      number: "02",
      title: isRTL ? "منظور عالمي" : "Global Perspective",
      description: isRTL
        ? "مناهج دولية وبرامج تبادل ثقافي تعد الطلاب للعالم المعاصر"
        : "International curriculum and cultural exchange programs preparing students for the modern world"
    },
    {
      number: "03",
      title: isRTL ? "بيئة رعاية" : "Nurturing Environment",
      description: isRTL
        ? "مجتمع داعم يشعر فيه كل طالب بالتقدير والتشجيع على التميز"
        : "Supportive community where every student feels valued and encouraged to excel"
    },
    {
      number: "04",
      title: isRTL ? "بناء الشخصية" : "Character Development",
      description: isRTL
        ? "تعليم قائم على القيم ينمي النزاهة والقيادة والمسؤولية الاجتماعية"
        : "Values-based education developing integrity, leadership, and social responsibility"
    }
  ];

  return (
    <SectionContainer className="bg-muted/30">
      <h2 className="font-heading font-bold text-3xl md:text-4xl mb-16">
        {isRTL ? "لماذا تختارنا" : "Why Choose Us"}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16">
        {values.map((value) => (
          <div key={value.number} className="group">
            <span className="text-6xl lg:text-7xl font-light text-muted-foreground/20 mb-4 block transition-colors group-hover:text-primary/20">
              {value.number}
            </span>
            <h3 className="font-heading font-semibold text-xl mb-3">
              {value.title}
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              {value.description}
            </p>
          </div>
        ))}
      </div>
    </SectionContainer>
  );
}

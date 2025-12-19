import { AnthropicIcons } from "@/components/icons/anthropic"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { SectionContainer } from "../../admission/shared/section-container"

interface AcademicCurriculumProps {
  lang: Locale
  dictionary?: Dictionary
}

export function AcademicCurriculum({ lang }: AcademicCurriculumProps) {
  const isRTL = lang === "ar"

  const levels = [
    {
      title: isRTL ? "السنوات المبكرة (K-5)" : "Early Years (K-5)",
      description: isRTL
        ? "بناء الأساس من خلال التعلم العملي وتطوير القراءة والكتابة والمهارات الاجتماعية من خلال التعليم القائم على اللعب."
        : "Foundation building with hands-on learning, literacy development, and social skills through play-based education.",
      features: isRTL
        ? [
            "الصوتيات والقراءة",
            "أسس الرياضيات",
            "استكشاف العلوم",
            "الدراسات الاجتماعية",
            "الفنون والموسيقى",
          ]
        : [
            "Phonics & Reading",
            "Math Foundations",
            "Science Exploration",
            "Social Studies",
            "Arts & Music",
          ],
      icon: AnthropicIcons.Sparkle,
    },
    {
      title: isRTL ? "المرحلة المتوسطة (6-8)" : "Middle School (6-8)",
      description: isRTL
        ? "سنوات انتقالية تركز على التفكير النقدي والتعلم المستقل والإعداد للدراسات المتقدمة."
        : "Transitional years focusing on critical thinking, independent learning, and preparation for advanced studies.",
      features: isRTL
        ? [
            "الرياضيات المتقدمة",
            "تحليل الأدب",
            "المنهج العلمي",
            "تاريخ العالم",
            "مهارات التكنولوجيا",
          ]
        : [
            "Advanced Mathematics",
            "Literature Analysis",
            "Scientific Method",
            "World History",
            "Technology Skills",
          ],
      icon: AnthropicIcons.Book,
    },
    {
      title: isRTL ? "المرحلة الثانوية (9-12)" : "High School (9-12)",
      description: isRTL
        ? "منهج إعدادي للكلية مع مسارات متخصصة ودورات AP وفرص استكشاف المهنة."
        : "College preparatory curriculum with specialized tracks, AP courses, and career exploration opportunities.",
      features: isRTL
        ? [
            "دورات التحضير للجامعة",
            "فصول AP والشرف",
            "المسارات المهنية",
            "مشاريع البحث",
            "تطوير القيادة",
          ]
        : [
            "College Prep Courses",
            "AP & Honors Classes",
            "Career Pathways",
            "Research Projects",
            "Leadership Development",
          ],
      icon: AnthropicIcons.Archive,
    },
  ]

  return (
    <SectionContainer id="curriculum">
      <div className="mb-16">
        <h2 className="font-heading mb-4 text-3xl font-bold md:text-4xl">
          {isRTL ? "نظرة عامة على المنهج" : "Curriculum Overview"}
        </h2>
        <p className="text-muted-foreground max-w-3xl text-lg">
          {isRTL
            ? "منهجنا التدريجي مصمم لبناء المعرفة بشكل منهجي مع تعزيز التفكير النقدي والإبداع في كل مرحلة."
            : "Our progressive curriculum is designed to build knowledge systematically while fostering critical thinking and creativity at every stage."}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {levels.map((level, index) => (
          <div
            key={index}
            className="border-border bg-card hover:border-primary/50 group relative rounded-lg border p-6 transition-all hover:-translate-y-1 hover:shadow-lg"
          >
            <span className="text-muted-foreground/20 group-hover:text-primary/20 absolute end-4 top-4 text-4xl font-light transition-colors">
              {index + 1}
            </span>
            <level.icon className="text-primary mb-4 h-8 w-8" />
            <h3 className="font-heading mb-2 text-lg font-semibold">
              {level.title}
            </h3>
            <p className="text-muted-foreground mb-4 text-sm">
              {level.description}
            </p>
            <ul className="space-y-2">
              {level.features.map((feature, featureIndex) => (
                <li
                  key={featureIndex}
                  className="text-muted-foreground flex items-start gap-3 text-sm"
                >
                  <span className="bg-primary mt-2 h-1.5 w-1.5 shrink-0 rounded-full" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </SectionContainer>
  )
}

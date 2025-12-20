import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { SectionContainer } from "../../admission/shared/section-container"
import { FeatureCard } from "../../shared/feature-card"

interface AcademicProgramsProps {
  lang: Locale
  dictionary?: Dictionary
}

export function AcademicPrograms({ lang }: AcademicProgramsProps) {
  const isRTL = lang === "ar"

  const programs = [
    {
      number: "01",
      title: isRTL ? "التميز الأكاديمي الأساسي" : "Core Academic Excellence",
      description: isRTL
        ? "منهج صارم في الرياضيات والعلوم والأدب والعلوم الإنسانية يبني معرفة أساسية قوية."
        : "Rigorous curriculum in Mathematics, Sciences, Literature, and Humanities that builds strong foundational knowledge.",
    },
    {
      number: "02",
      title: isRTL ? "ابتكار STEAM" : "STEAM Innovation",
      description: isRTL
        ? "برامج العلوم والتكنولوجيا والهندسة والفنون والرياضيات التي تعزز الإبداع ومهارات حل المشكلات."
        : "Science, Technology, Engineering, Arts, and Mathematics programs that foster creativity and problem-solving skills.",
    },
    {
      number: "03",
      title: isRTL ? "الدراسات العالمية" : "Global Studies",
      description: isRTL
        ? "وجهات نظر دولية وتعلم اللغات وبرامج التبادل الثقافي التي تعد الطلاب لعالم متصل."
        : "International perspectives, language learning, and cultural exchange programs that prepare students for a connected world.",
    },
    {
      number: "04",
      title: isRTL ? "التعليم المتقدم" : "Advanced Placement",
      description: isRTL
        ? "دورات على مستوى الكلية تتحدى الطلاب المتفوقين وتوفر فرص الحصول على رصيد جامعي."
        : "College-level courses that challenge high-achieving students and provide college credit opportunities.",
    },
    {
      number: "05",
      title: isRTL ? "الفنون والإبداع" : "Arts & Creativity",
      description: isRTL
        ? "تعليم فني شامل يشمل الموسيقى والفنون البصرية والدراما والكتابة الإبداعية لتنمية التعبير الفني."
        : "Comprehensive arts education including music, visual arts, drama, and creative writing to nurture artistic expression.",
    },
    {
      number: "06",
      title: isRTL ? "تربية الشخصية" : "Character Education",
      description: isRTL
        ? "تعليم قائم على القيم يطور النزاهة والقيادة والمسؤولية الاجتماعية في كل طالب."
        : "Values-based learning that develops integrity, leadership, and social responsibility in every student.",
    },
  ]

  return (
    <SectionContainer id="programs" className="mt-16 md:mt-24">
      <h2 className="font-heading mb-8 text-3xl font-bold md:text-4xl">
        {isRTL ? "البرامج الأكاديمية" : "Academic Programs"}
      </h2>
      <p className="text-muted-foreground mb-16 max-w-3xl text-lg">
        {isRTL
          ? "مسارات تعليمية شاملة مصممة لإطلاق إمكانات كل طالب وإعدادهم للنجاح المستقبلي."
          : "Comprehensive educational pathways designed to unlock every student's potential and prepare them for future success."}
      </p>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {programs.map((program) => (
          <FeatureCard
            key={program.number}
            number={program.number}
            title={program.title}
            description={program.description}
            variant="muted"
          />
        ))}
      </div>
    </SectionContainer>
  )
}

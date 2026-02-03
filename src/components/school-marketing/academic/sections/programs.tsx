import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { SectionContainer } from "../../admission/shared/section-container"
import { FeatureCard } from "../../shared/feature-card"

interface AcademicProgramsProps {
  lang: Locale
  dictionary?: Dictionary
}

export function AcademicPrograms({ dictionary }: AcademicProgramsProps) {
  const programsData = dictionary?.marketing?.site?.academic?.programs

  const programs = [
    {
      number: "01",
      title: programsData?.items?.core?.title || "Core Academic Excellence",
      description:
        programsData?.items?.core?.description ||
        "Rigorous curriculum in Mathematics, Sciences, Literature, and Humanities that builds strong foundational knowledge.",
    },
    {
      number: "02",
      title: programsData?.items?.steam?.title || "STEAM Innovation",
      description:
        programsData?.items?.steam?.description ||
        "Science, Technology, Engineering, Arts, and Mathematics programs that foster creativity and problem-solving skills.",
    },
    {
      number: "03",
      title: programsData?.items?.global?.title || "Global Studies",
      description:
        programsData?.items?.global?.description ||
        "International perspectives, language learning, and cultural exchange programs that prepare students for a connected world.",
    },
    {
      number: "04",
      title: programsData?.items?.ap?.title || "Advanced Placement",
      description:
        programsData?.items?.ap?.description ||
        "College-level courses that challenge high-achieving students and provide college credit opportunities.",
    },
    {
      number: "05",
      title: programsData?.items?.arts?.title || "Arts & Creativity",
      description:
        programsData?.items?.arts?.description ||
        "Comprehensive arts education including music, visual arts, drama, and creative writing to nurture artistic expression.",
    },
    {
      number: "06",
      title: programsData?.items?.character?.title || "Character Education",
      description:
        programsData?.items?.character?.description ||
        "Values-based learning that develops integrity, leadership, and social responsibility in every student.",
    },
  ]

  return (
    <SectionContainer id="programs" className="mt-16 md:mt-24">
      <h2 className="font-heading mb-8 text-3xl font-bold md:text-4xl">
        {programsData?.title || "Academic Programs"}
      </h2>
      <p className="text-muted-foreground mb-16 max-w-3xl text-lg">
        {programsData?.subtitle ||
          "Comprehensive educational pathways designed to unlock every student's potential and prepare them for future success."}
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

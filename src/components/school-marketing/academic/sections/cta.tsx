import Link from "next/link"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { AnthropicIcons } from "@/components/icons"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { SectionContainer } from "../../admission/shared/section-container"

interface AcademicCTAProps {
  lang: Locale
  dictionary?: Dictionary
}

export function AcademicCTA({ lang, dictionary }: AcademicCTAProps) {
  // Get translations with fallbacks
  const t = dictionary?.marketing?.site?.academic?.cta

  return (
    <SectionContainer>
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="font-heading mb-6 text-3xl font-bold md:text-4xl">
          {t?.title || "Ready to Begin?"}
        </h2>
        <p className="text-muted-foreground mb-8 text-lg md:text-xl">
          {t?.subtitle ||
            "Explore our rigorous academic programs designed to prepare students for success in higher education and beyond."}
        </p>

        <div className="flex flex-col justify-center gap-4 sm:flex-row rtl:sm:flex-row-reverse">
          <Link
            href={`/${lang}/apply`}
            className={cn(buttonVariants({ size: "lg" }), "gap-2")}
          >
            {t?.scheduleVisit || "Schedule a Visit"}
            <AnthropicIcons.ArrowRight className="h-4 w-4 rtl:rotate-180" />
          </Link>
          <Link
            href={`/${lang}/inquiry`}
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "gap-2"
            )}
          >
            <AnthropicIcons.Chat className="h-4 w-4" />
            {t?.contactAdmissions || "Contact Admissions"}
          </Link>
        </div>
      </div>
    </SectionContainer>
  )
}

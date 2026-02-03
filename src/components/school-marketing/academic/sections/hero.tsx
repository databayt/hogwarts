import Link from "next/link"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { AnthropicIcons } from "@/components/icons"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { AcademicHeroIllustration } from "./hero-illustration"

interface AcademicHeroProps {
  lang: Locale
  dictionary?: Dictionary
}

export function AcademicHero({ lang, dictionary }: AcademicHeroProps) {
  // Get translations with fallbacks
  const t = dictionary?.marketing?.site?.academic?.hero

  // Parse title to handle newlines
  const titleParts = t?.title?.split("\n") || ["Academic", "Excellence"]

  return (
    <section id="hero" className="bg-background min-h-[calc(100vh-3.5rem)]">
      <div className="grid min-h-[calc(100vh-3.5rem)] grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-16">
        {/* Left: Content */}
        <div className="space-y-6 py-12 lg:py-0 rtl:lg:order-2">
          <h1 className="font-heading text-5xl font-black tracking-tight sm:text-6xl lg:text-7xl xl:text-8xl">
            <span className="block">{titleParts[0]}</span>
            <span className="block">{titleParts[1]}</span>
          </h1>

          <p className="text-muted-foreground max-w-md text-lg">
            {t?.subtitle ||
              "Discover your potential through rigorous academics and innovative learning. Our comprehensive programs are designed to unlock every student's capabilities."}
          </p>

          <div className="flex flex-col gap-3 sm:flex-row rtl:sm:flex-row-reverse">
            <Link
              href={`/${lang}/apply`}
              className={cn(buttonVariants({ size: "lg" }), "w-full sm:w-auto")}
            >
              {t?.explorePrograms || "Explore Programs"}
            </Link>
            <Link
              href={`/${lang}/curriculum`}
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "group w-full sm:w-auto"
              )}
            >
              {t?.viewCurriculum || "View Curriculum"}
              <AnthropicIcons.ArrowRight className="ms-2 h-4 w-4 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
            </Link>
          </div>
        </div>

        {/* Right: Illustration - hidden on mobile/tablet for performance */}
        <div className="hidden items-center justify-center lg:flex lg:justify-end rtl:lg:order-1 rtl:lg:justify-start">
          <AcademicHeroIllustration />
        </div>
      </div>
    </section>
  )
}

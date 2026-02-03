import Link from "next/link"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { AnthropicIcons } from "@/components/icons"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { SectionContainer } from "../shared/section-container"

interface AdmissionCTAProps {
  lang: Locale
  dictionary?: Dictionary
}

export function AdmissionCTA({ lang, dictionary }: AdmissionCTAProps) {
  return (
    <SectionContainer className="bg-primary text-primary-foreground">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="font-heading mb-6 text-3xl font-bold md:text-4xl">
          {dictionary?.marketing?.site?.admission?.cta?.title ||
            "Ready to Begin Your Journey?"}
        </h2>
        <p className="mb-8 text-lg opacity-90 md:text-xl">
          {dictionary?.marketing?.site?.admission?.cta?.subtitle ||
            "Join thousands of students who have discovered their potential with us"}
        </p>

        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          <Link
            href={`/${lang}/apply`}
            className={cn(
              buttonVariants({ size: "lg" }),
              "bg-background text-foreground hover:bg-background/90 gap-2"
            )}
          >
            {dictionary?.marketing?.site?.admission?.cta?.startApplication ||
              "Start Application"}
            <AnthropicIcons.ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href={`/${lang}/inquiry`}
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 gap-2"
            )}
          >
            <AnthropicIcons.Chat className="h-4 w-4" />
            {dictionary?.marketing?.site?.admission?.cta?.contactAdmissions ||
              "Contact Admissions"}
          </Link>
        </div>
      </div>
    </SectionContainer>
  )
}

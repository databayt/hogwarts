import Link from "next/link"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { AnthropicIcons } from "@/components/icons/anthropic"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { SectionContainer } from "../../admission/shared/section-container"

interface AcademicCTAProps {
  lang: Locale
  dictionary?: Dictionary
}

export function AcademicCTA({ lang }: AcademicCTAProps) {
  const isRTL = lang === "ar"

  return (
    <SectionContainer className="bg-primary text-primary-foreground">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="font-heading mb-6 text-3xl font-bold md:text-4xl">
          {isRTL
            ? "مستعد لبدء رحلتك الأكاديمية؟"
            : "Ready to Begin Your Academic Journey?"}
        </h2>
        <p className="mb-8 text-lg opacity-90 md:text-xl">
          {isRTL
            ? "انضم إلى مجتمعنا من المتعلمين واكتشف كيف يمكن لبرامجنا الأكاديمية أن تحول مستقبلك."
            : "Join our community of learners and discover how our academic programs can transform your future."}
        </p>

        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          <Link
            href={`/${lang}/apply`}
            className={cn(
              buttonVariants({ size: "lg" }),
              "bg-background text-foreground hover:bg-background/90 gap-2"
            )}
          >
            {isRTL ? "حدد موعد زيارة" : "Schedule a Visit"}
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
            {isRTL ? "تواصل مع القبول" : "Contact Admissions"}
          </Link>
        </div>
      </div>
    </SectionContainer>
  )
}

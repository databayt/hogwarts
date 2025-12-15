import Link from "next/link"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { AnthropicIcons } from "@/components/icons/anthropic"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { SectionContainer } from "../shared/section-container"

interface AdmissionCTAProps {
  lang: Locale
  dictionary?: Dictionary
}

export function AdmissionCTA({ lang }: AdmissionCTAProps) {
  const isRTL = lang === "ar"

  return (
    <SectionContainer className="bg-primary text-primary-foreground">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="font-heading mb-6 text-3xl font-bold md:text-4xl">
          {isRTL ? "مستعد لبدء رحلتك؟" : "Ready to Begin Your Journey?"}
        </h2>
        <p className="mb-8 text-lg opacity-90 md:text-xl">
          {isRTL
            ? "انضم إلى آلاف الطلاب الذين اكتشفوا إمكاناتهم معنا"
            : "Join thousands of students who have discovered their potential with us"}
        </p>

        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          <Link
            href={`/${lang}/apply`}
            className={cn(
              buttonVariants({ size: "lg" }),
              "bg-background text-foreground hover:bg-background/90 gap-2"
            )}
          >
            {isRTL ? "ابدأ التقديم" : "Start Application"}
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
            {isRTL ? "تواصل معنا" : "Contact Admissions"}
          </Link>
        </div>
      </div>
    </SectionContainer>
  )
}

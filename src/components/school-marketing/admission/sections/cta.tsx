// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

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

// Zenda's closing move: a large rounded charcoal panel laid on the cream
// (its .cta_wrap), not a full-bleed color band. Button colors are explicit
// fixed values -- theme tokens would flip in dark mode against a panel that
// never does (the old outline button rendered white-on-white).
export function AdmissionCTA({ lang, dictionary }: AdmissionCTAProps) {
  return (
    <SectionContainer>
      <div className="band-charcoal rounded-[2.5rem] px-6 py-16 md:px-16 md:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-heading mb-6 text-3xl font-bold md:text-4xl">
            {dictionary?.marketing?.site?.admission?.cta?.title ||
              "Ready to Begin Your Journey?"}
          </h2>
          <p className="band-muted mb-8 text-lg md:text-xl">
            {dictionary?.marketing?.site?.admission?.cta?.subtitle ||
              "Join thousands of students who have discovered their potential with us"}
          </p>

          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href={`/${lang}/application`}
              className={cn(
                buttonVariants({ size: "lg" }),
                "gap-2 bg-white text-neutral-900 hover:bg-white/90"
              )}
            >
              {dictionary?.marketing?.site?.admission?.cta?.startApplication ||
                "Start Application"}
              <AnthropicIcons.ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </Link>
            <Link
              href={`/${lang}/inquiry`}
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "gap-2 border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white"
              )}
            >
              <AnthropicIcons.Chat className="h-4 w-4" />
              {dictionary?.marketing?.site?.admission?.cta?.contactAdmissions ||
                "Contact Admissions"}
            </Link>
          </div>
        </div>
      </div>
    </SectionContainer>
  )
}

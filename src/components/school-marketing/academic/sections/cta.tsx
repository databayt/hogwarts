// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { SectionContainer } from "../../admission/shared/section-container"
import { ZendaButton } from "../../admission/shared/zenda-button"

interface AcademicCTAProps {
  lang: Locale
  dictionary?: Dictionary
}

// Zenda's closing move: a large rounded charcoal panel laid on the cream
// (its .cta_wrap), not a full-bleed color band. Button colors are explicit
// fixed values -- theme tokens would flip in dark mode against a panel that
// never does (the old outline button rendered white-on-white).
export function AcademicCTA({ lang, dictionary }: AcademicCTAProps) {
  // Get translations with fallbacks
  const t = dictionary?.marketing?.site?.academic?.cta

  return (
    <SectionContainer>
      <div className="band-charcoal rounded-[2.5rem] px-6 py-16 md:px-16 md:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="zenda-heading is-section is-inverse mb-6">
            {t?.title || "Ready to Begin Your Academic Journey?"}
          </h2>
          <p className="band-muted mb-8 text-lg md:text-xl">
            {t?.subtitle ||
              "Explore our rigorous academic programs designed to prepare students for success in higher education and beyond."}
          </p>

          {/* Both pills are zenda's EXPLORE button so the page closes in the
           * same language the hero opens in. `alternate` is zenda's own
           * white/purple inverse, which is what reads on the charcoal panel. */}
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <ZendaButton
              href={`/${lang}/tour`}
              label={t?.scheduleVisit || "Schedule a Visit"}
              variant="alternate"
            />
            <ZendaButton
              href={`/${lang}/inquiry`}
              label={t?.contactAdmissions || "Contact Admissions"}
            />
          </div>
        </div>
      </div>
    </SectionContainer>
  )
}

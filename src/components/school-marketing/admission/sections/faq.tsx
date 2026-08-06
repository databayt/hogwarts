// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { SectionContainer } from "../shared/section-container"
import { FaqAccordion } from "./faq-accordion"

interface AdmissionFaqProps {
  lang: Locale
  dictionary?: Dictionary
}

/*
 * Zenda's FAQ section (centered header over a narrow column of accordion rows).
 *
 * The copy is NOT new: `marketing.site.faqs` already holds six bilingual
 * admissions questions -- when enrolment opens, whether applying costs
 * anything, mid-year joining, documents, progress reporting, transport. They
 * were written for the old homepage template (`school-marketing/content.tsx` ->
 * `faqs.tsx`), which the zenda clone replaced on 2026-08-03, so from then until
 * now nothing rendered them. This is where they belong anyway: every question
 * in the set is an admissions question.
 *
 * That homepage FAQ component still exists and still reads the same keys -- if
 * the old template is ever restored, the two will render the same content on
 * two pages. Decide then; don't fork the copy.
 *
 * Extraction happens here, on the server, so only the six strings cross into
 * the client bundle rather than the whole dictionary.
 */
export function AdmissionFaq({ dictionary }: AdmissionFaqProps) {
  const t = dictionary?.marketing?.site?.faqs
  const items = (t?.questions ?? []).filter((q) => q?.question && q?.answer)

  // A school whose dictionary has no FAQ set renders no section at all, rather
  // than an empty header over nothing.
  if (items.length === 0) return null

  return (
    <SectionContainer>
      <div className="mx-auto mb-12 max-w-[30rem] text-center md:mb-16">
        <p className="eyebrow band-muted mb-3">{t?.eyebrow || "FAQ"}</p>
        <h2 className="font-heading text-3xl font-bold text-neutral-900 md:text-4xl">
          {t?.title || "Questions we get asked"}
        </h2>
        {t?.subtitle && <p className="band-muted mt-3">{t.subtitle}</p>}
      </div>

      {/* zenda's `container-medium` -- an FAQ column reads badly at full width */}
      <div className="mx-auto max-w-3xl">
        <FaqAccordion items={items} />
      </div>
    </SectionContainer>
  )
}

export default AdmissionFaq

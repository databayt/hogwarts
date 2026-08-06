// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

interface AcademicIntroProps {
  lang: Locale
  dictionary?: Dictionary
}

/*
 * zenda's "Zenda for schools" card -- and, structurally, the reason the hero's
 * building has anywhere to go. `[data-hero-art-target]` is the slot the merge
 * controller lerps the illustration into; without this section the building
 * would fly to nowhere and simply stay in the hero.
 *
 * The slot is pulled up out of the card (`top: -13rem`, a purely visual offset)
 * so the illustration overhangs the white panel's top edge, and the copy is
 * pulled back up by a matching negative margin to close the gap that leaves.
 * Both numbers live in `.acad-intro_*`; they are tuned to each other.
 *
 * The copy is the programs section's own header, moved here rather than
 * invented: two adjacent sections both introducing "Academic Programs" would
 * say the same thing twice, and this card is the better place to say it once.
 */
export function AcademicIntro({ lang, dictionary }: AcademicIntroProps) {
  const t = dictionary?.marketing?.site?.academic?.programs

  return (
    <section className="pb-8">
      <div className="acad-intro">
        <div className="acad-intro_wrap">
          <div className="acad-intro_slot" data-hero-art-target="" />
          <div className="acad-intro_content">
            <p className="eyebrow mb-3 text-[#9442ff]">
              {t?.eyebrow ||
                (lang === "ar" ? "مسارات التعليم" : "Educational Pathways")}
            </p>
            <h2 className="zenda-heading is-section">
              {t?.title || "Academic Programs"}
            </h2>
            <p className="zenda-body mt-6 text-lg leading-relaxed">
              {t?.subtitle ||
                "Comprehensive educational pathways designed to unlock every student's potential and prepare them for future success."}
            </p>
          </div>
          <div className="acad-intro_bg" />
        </div>
      </div>
    </section>
  )
}

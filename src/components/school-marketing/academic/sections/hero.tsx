// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { AcademicHeroArt } from "./hero-art"
import { AcademicHeroKinetic } from "./hero-kinetic"

interface AcademicHeroProps {
  lang: Locale
  dictionary?: Dictionary
}

export function AcademicHero({ lang, dictionary }: AcademicHeroProps) {
  const t = dictionary?.marketing?.site?.academic?.hero

  /*
   * zenda's /for-schools hero, rebuilt native: a narrow centred column carrying
   * a headline whose every word flies in from a scattered start and settles
   * under a splash of expanding circles, then the school illustration landing
   * beneath it -- which then flies down the page into the card below (./hero-art).
   *
   * Deliberately no CTA. The reference has none, and this page has nothing to
   * ask for: the application lives on /admissions, one nav item away, and a pill
   * here competed with the entrance for the eye at exactly the moment the words
   * were still converging.
   *
   * The section is content-height, not `100svh`. The page loads scrolled down by
   * one nav height (the tuck -- see hero-kinetic), so the hero already opens
   * flush against the top edge; forcing viewport height on top of that only
   * pushes the illustration off the fold.
   *
   * `overflow-clip` contains the words' scattered start positions, which sit far
   * outside the layout box and would otherwise widen the document. Clip rather
   * than hidden so no scroll container is created -- and note the illustration
   * escapes this box entirely by portalling to <body>, so the clip cannot catch
   * it mid-flight.
   *
   * `data-zenda-tuck` is what the nav reads on mount to decide whether to park
   * itself above the fold; the matching event covers client-side navigations,
   * where the nav does not remount.
   */
  const titleLines = (t?.title ?? "Where curiosity becomes\nreal understanding")
    .split("\n")
    .map((line) => line.split(/\s+/).filter(Boolean))
    .filter((line) => line.length > 0)

  return (
    <section
      id="hero"
      data-zenda-tuck=""
      className="flex flex-col overflow-clip py-28 max-[991px]:gap-12"
    >
      <AcademicHeroKinetic
        titleLines={titleLines}
        subtitle={t?.subtitle || "Rigorous academics, taught with care."}
        rtl={lang === "ar"}
      />
      <AcademicHeroArt />
    </section>
  )
}

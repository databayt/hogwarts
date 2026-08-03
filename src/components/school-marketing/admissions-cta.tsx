// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Link from "next/link"

import { Button } from "@/components/ui/button"
import { AnimatedButton } from "@/components/atom/animated-button"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { formatNumber } from "./format"

interface AdmissionsCTAProps {
  lang: Locale
  dictionary: Dictionary
}

/**
 * The homepage's closing conversion moment -- replaces both the gradient-
 * animation CTA and the admission-process step timeline with one
 * dictionary-driven band: the pitch, the two actions a visitor takes next,
 * and the four steps between a visit and an offer.
 */
export function AdmissionsCTA({ lang, dictionary }: AdmissionsCTAProps) {
  const t = dictionary?.marketing?.site?.admissions
  if (!t) return null

  const titleLines = (t.title ?? "").split("\n").filter(Boolean)
  const steps = t.steps ?? []

  return (
    <section className="band-ink bleed-page px-page capsule-t capsule-b section-y">
      <div className="mx-auto max-w-2xl text-center">
        {t.eyebrow && <p className="eyebrow band-muted mb-4">{t.eyebrow}</p>}

        <h2 className="display-2">
          {titleLines.map((line, i) => (
            <span key={i} className="block">
              {line}
            </span>
          ))}
        </h2>

        <p className="display-intro band-muted mt-6">{t.description}</p>

        <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href={`/${lang}/application`}>
            <AnimatedButton size="lg" className="w-full sm:w-auto">
              {t.primaryCta}
            </AnimatedButton>
          </Link>
          <Link href={`/${lang}/tour`}>
            <Button
              variant="outline"
              size="lg"
              className="w-full border-white/70 bg-transparent text-white hover:bg-white/10 hover:text-white sm:w-auto"
            >
              {t.secondaryCta}
            </Button>
          </Link>
        </div>
      </div>

      {steps.length > 0 && (
        <div className="mt-16 grid gap-6 text-center md:grid-cols-4">
          {steps.map((step, index) => (
            <div key={index}>
              <div className="display-3">{formatNumber(index + 1, lang)}</div>
              <h3 className="mt-2 text-lg font-semibold">{step.title}</h3>
              <p className="band-muted mt-2">{step.description}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

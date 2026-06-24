// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Link from "next/link"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

import type { CtaBannerSection } from "../types"

interface Props {
  section: CtaBannerSection
  lang: string
  ctaLabel: string
}

export function CtaBannerSectionComponent({ section, lang, ctaLabel }: Props) {
  return (
    <section className="bg-muted/40 mb-16 rounded-2xl border px-6 py-10 text-center md:px-12 md:py-14">
      <h2 className="font-heading mx-auto max-w-3xl text-2xl font-bold tracking-tight text-balance md:text-3xl">
        {section.heading}
      </h2>
      {section.description && (
        <p className="text-muted-foreground mx-auto mt-4 max-w-2xl text-pretty">
          {section.description}
        </p>
      )}
      <Link
        href={`/${lang}/onboarding`}
        className={cn(buttonVariants({ size: "lg" }), "mt-8")}
      >
        {ctaLabel}
      </Link>
    </section>
  )
}

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Link from "next/link"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

import type { CtaBannerSection } from "../types"
import { ImagePlaceholder } from "./image-placeholder"

interface Props {
  section: CtaBannerSection
  lang: string
  ctaLabel: string
}

export function CtaBannerSectionComponent({ section, lang, ctaLabel }: Props) {
  return (
    <section className="bg-muted/50 mb-16 overflow-hidden rounded-2xl">
      <div className="grid items-center gap-8 md:grid-cols-2">
        <div className="p-8 md:p-12">
          <h2 className="font-heading mb-4 text-2xl font-bold md:text-3xl">
            {section.heading}
          </h2>
          {section.description && (
            <p className="text-muted-foreground mb-6">{section.description}</p>
          )}
          <Link
            href={`/${lang}/onboarding`}
            className={cn(buttonVariants({ size: "lg" }))}
          >
            {ctaLabel}
          </Link>
        </div>
        <ImagePlaceholder aspectRatio="video" className="rounded-none" />
      </div>
    </section>
  )
}

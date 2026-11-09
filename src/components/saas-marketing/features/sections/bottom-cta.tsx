// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Link from "next/link"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

import { SectionTitle } from "./section-title"

interface Props {
  lang: string
  title: string
  subtitle?: string
  getStartedLabel: string
  viewPricingLabel: string
}

export function BottomCta({
  lang,
  title,
  subtitle,
  getStartedLabel,
  viewPricingLabel,
}: Props) {
  return (
    <section className="text-center">
      <SectionTitle title={title} description={subtitle} align="center" />
      <div className="flex flex-col justify-center gap-3 sm:flex-row">
        <Link
          href={`/${lang}/onboarding`}
          className={cn(buttonVariants({ size: "lg" }))}
        >
          {getStartedLabel}
        </Link>
        <Link
          href={`/${lang}/pricing`}
          className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
        >
          {viewPricingLabel}
        </Link>
      </div>
    </section>
  )
}

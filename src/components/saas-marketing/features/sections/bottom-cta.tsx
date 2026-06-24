// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Link from "next/link"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

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
    <section className="border-t pt-16 text-center">
      <h2 className="font-heading mx-auto max-w-2xl text-2xl font-bold tracking-tight text-balance md:text-3xl">
        {title}
      </h2>
      {subtitle && (
        <p className="text-muted-foreground mx-auto mt-4 max-w-2xl text-pretty">
          {subtitle}
        </p>
      )}
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
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

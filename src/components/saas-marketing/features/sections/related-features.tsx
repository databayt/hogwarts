// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Card from "@/components/atom/card"
import type { Locale } from "@/components/internationalization/config"

import { FeatureIcon } from "../feature-icon"
import { localizeFeature } from "../i18n"
import type { Feature } from "../types"
import { SectionTitle } from "./section-title"

interface Props {
  features: Feature[]
  lang: string
  heading: string
}

/** The same cards as the /features grid — same icon, same copy, localized. */
export function RelatedFeatures({ features, lang, heading }: Props) {
  if (features.length === 0) return null

  return (
    <section>
      <SectionTitle title={heading} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((rf) => {
          const { title, description } = localizeFeature(rf, lang as Locale)
          return (
            <Card
              key={rf.id}
              id={rf.id}
              title={title}
              description={description}
              icon={<FeatureIcon feature={rf} alt={title} />}
              href={`/${lang}/features/${rf.id}`}
            />
          )
        })}
      </div>
    </section>
  )
}

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Link from "next/link"

import { Button } from "@/components/ui/button"
import SectionHeading from "@/components/atom/section-heading"
import { Icons } from "@/components/icons"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

// The iOS/Android apps aren't published yet (the mobile API is the surface they
// talk to — see src/app/api/mobile/README.md). Fill these in when the listings
// go live and the buttons become real links automatically.
const APP_STORE_URL: string | null = null
const PLAY_STORE_URL: string | null = null

const FALLBACK = {
  title: "Mobile app",
  description: "The whole platform in every pocket",
  appStoreLead: "Download on the",
  appStore: "App Store",
  googlePlayLead: "Get it on",
  googlePlay: "Google Play",
  comingSoon: "Coming soon to iOS and Android",
} as const

interface DownloadAppProps {
  dictionary?: Dictionary
  lang?: Locale
}

export default function DownloadApp({ dictionary, lang }: DownloadAppProps) {
  const isRTL = lang === "ar"
  const dict = { ...FALLBACK, ...(dictionary?.marketing?.downloadApp ?? {}) }
  const released = Boolean(APP_STORE_URL || PLAY_STORE_URL)

  return (
    <section dir={isRTL ? "rtl" : "ltr"} className="pt-10 pb-20 md:pt-14">
      <SectionHeading title={dict.title} description={dict.description}>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <StoreButton
            href={APP_STORE_URL}
            icon={<Icons.apple aria-hidden="true" className="size-7" />}
            lead={dict.appStoreLead}
            name={dict.appStore}
          />
          <StoreButton
            href={PLAY_STORE_URL}
            icon={<Icons.googlePlay aria-hidden="true" className="size-6" />}
            lead={dict.googlePlayLead}
            name={dict.googlePlay}
          />
        </div>
        {released ? null : (
          <small className="muted pt-4">{dict.comingSoon}</small>
        )}
      </SectionHeading>
    </section>
  )
}

function StoreButton({
  href,
  icon,
  lead,
  name,
}: {
  href: string | null
  icon: React.ReactNode
  lead: string
  name: string
}) {
  const inner = (
    <>
      {icon}
      {/* The badge is a Latin lockup ("App Store"), so the two-line stack stays
          start-aligned within itself even under RTL. */}
      <span className="flex flex-col items-start leading-tight" dir="ltr">
        <small className="muted">{lead}</small>
        <span className="font-semibold">{name}</span>
      </span>
    </>
  )

  const className = "h-auto gap-3 px-5 py-3"

  if (!href) {
    return (
      <Button variant="outline" size="lg" className={className} disabled>
        {inner}
      </Button>
    )
  }

  return (
    <Button variant="outline" size="lg" className={className} asChild>
      <Link href={href} target="_blank" rel="noopener noreferrer">
        {inner}
      </Link>
    </Button>
  )
}

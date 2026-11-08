// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Link from "next/link"
import { Info } from "lucide-react"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { HeaderSection } from "@/components/atom/header-section"
import type { Locale } from "@/components/internationalization/config"
import type { getDictionary } from "@/components/internationalization/dictionaries"
import {
  comparePlans,
  getComparePlans,
  plansColumns,
} from "@/components/saas-marketing/pricing/config"
import { PlansRow } from "@/components/saas-marketing/pricing/types"

interface ComparePlansProps {
  dictionary?: Awaited<ReturnType<typeof getDictionary>>
  lang?: Locale
}

type Column = (typeof plansColumns)[number]

const PLAN_EMOJI: Record<Column, string> = {
  free: "🎁",
  pro: "🚀",
  enterprise: "🏛️",
}

// Keyed by the canonical English feature (config.ts), so the emoji survives
// translation of the label.
const FEATURE_EMOJI: Record<string, string> = {
  "Students included": "🎓",
  Teachers: "👩‍🏫",
  "Admissions, attendance, exams, fees, timetable, messaging": "🧩",
  Storage: "💾",
  Support: "💬",
  "Custom branding": "🎨",
  "API access": "🔌",
  "Parent push notifications": "🔔",
  "SSO (SAML/OAuth)": "🔐",
  "Data export, anytime": "📦",
}

export function ComparePlans({ dictionary, lang = "en" }: ComparePlansProps) {
  const pricing = dictionary?.marketing?.pricing
  const header = pricing?.comparePlans?.header
  const plans = getComparePlans(pricing)

  const planName: Record<Column, string> = {
    free: pricing?.planNames?.free || "Free month",
    pro: pricing?.planNames?.pro || "Pro",
    enterprise: pricing?.planNames?.enterprise || "Ultra",
  }
  const planHint: Record<Column, string> = {
    free: header?.freeHint || "Try it all, free",
    pro: header?.proHint || "Every student, 24 SAR/yr",
    enterprise: header?.enterpriseHint || "1,000+ students",
  }
  const contactHref =
    pricing?.enterprise?.contactHref ||
    "mailto:sales@databayt.org?subject=Enterprise%20plan"

  const renderCell = (value: string | boolean | null) => {
    if (value === null || value === false)
      return (
        <span aria-label="Not included" className="opacity-60">
          ➖
        </span>
      )
    if (value === true) return <span aria-label="Included">✅</span>
    return value
  }

  return (
    <div id="compare" className="w-full scroll-mt-24 py-20">
      <HeaderSection
        title={pricing?.comparePlans?.title || "Compare plans"}
        subtitle={
          pricing?.comparePlans?.subtitle ||
          "Every plan runs the full platform — pricing scales with your school."
        }
      />

      {/* Sticky plan bar — the site header scrolls away, so it pins at the top */}
      <div className="bg-background border-border sticky top-0 z-10 mt-10 border-b">
        <div className="flex w-full items-stretch">
          <div className="hidden w-40 shrink-0 flex-col justify-center py-4 md:flex md:w-1/4">
            <p className="text-base font-semibold">
              👇 {header?.pick || "Pick what fits"}
            </p>
            <p className="text-muted-foreground text-sm">
              {header?.note || "Same platform, every plan"}
            </p>
          </div>
          <div className="w-40 shrink-0 md:hidden" />
          {plansColumns.map((col) => (
            <div
              key={col}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 px-1 py-3 text-center",
                col === "pro" && "bg-muted/60 rounded-t-xl"
              )}
            >
              <span className="text-2xl leading-none" aria-hidden>
                {PLAN_EMOJI[col]}
              </span>
              <span className="text-base font-semibold">{planName[col]}</span>
              <span className="text-muted-foreground hidden text-xs sm:block">
                {planHint[col]}
              </span>
              <Link
                href={
                  col === "enterprise" ? contactHref : `/${lang}/onboarding`
                }
                className={cn(
                  buttonVariants({
                    variant: col === "enterprise" ? "outline" : "default",
                    size: "sm",
                  }),
                  "mt-1 hidden h-7 px-3 text-xs md:inline-flex"
                )}
              >
                {col === "enterprise"
                  ? header?.talk || "Talk to us"
                  : header?.start || "Start free"}
              </Link>
            </div>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full table-fixed">
          <tbody>
            {plans.map((row: PlansRow, index: number) => (
              <tr
                key={index}
                className="border-border/60 hover:bg-muted/40 border-b transition-colors"
              >
                <td className="bg-background sticky start-0 w-40 md:w-1/4 md:bg-transparent">
                  <div className="flex items-center justify-between gap-2 py-4">
                    <span className="flex items-center gap-2 lg:text-base">
                      <span aria-hidden>
                        {FEATURE_EMOJI[comparePlans[index]?.feature] || "✨"}
                      </span>
                      {row.feature}
                    </span>
                    {row.tooltip && (
                      <Popover>
                        <PopoverTrigger className="hover:bg-muted rounded p-1">
                          <Info className="text-muted-foreground size-4" />
                        </PopoverTrigger>
                        <PopoverContent side="top" className="max-w-80 py-3">
                          {row.tooltip}
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>
                </td>
                {plansColumns.map((col) => (
                  <td
                    key={col}
                    className={cn(
                      "text-muted-foreground px-1 py-4 text-center lg:text-base",
                      col === "pro" && "bg-muted/60"
                    )}
                  >
                    {renderCell(row[col])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

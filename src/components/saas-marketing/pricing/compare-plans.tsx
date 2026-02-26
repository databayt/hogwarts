// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { CircleCheck, Info } from "lucide-react"

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { HeaderSection } from "@/components/atom/header-section"
import type { getDictionary } from "@/components/internationalization/dictionaries"
import {
  comparePlans,
  getComparePlans,
  plansColumns,
} from "@/components/saas-marketing/pricing/config"
import { PlansRow } from "@/components/saas-marketing/pricing/types"

interface ComparePlansProps {
  dictionary?: Awaited<ReturnType<typeof getDictionary>>
}

export function ComparePlans({ dictionary }: ComparePlansProps) {
  const pricing = dictionary?.marketing?.pricing
  const plans = getComparePlans(pricing)

  const planNameMap: Record<string, string> = {
    hobby: pricing?.planNames?.hobby || "hobby",
    pro: pricing?.planNames?.pro || "pro",
    ultra: pricing?.planNames?.ultra || "ultra",
    enterprise: pricing?.planNames?.enterprise || "enterprise",
  }

  const renderCell = (value: string | boolean | null) => {
    if (value === null) return "\u2014"
    if (typeof value === "boolean")
      return value ? <CircleCheck className="mx-auto size-5" /> : "\u2014"
    return value
  }

  return (
    <div className="w-full py-20">
      <HeaderSection
        title={pricing?.comparePlans?.title || "Compare Plans"}
        subtitle={
          pricing?.comparePlans?.subtitle ||
          "Find the perfect plan tailored for your business needs!"
        }
      />

      {/* Sticky header row - flush with page header */}
      <div className="bg-background border-border sticky top-14 z-10 mt-10 border-b">
        <div className="flex w-full">
          <div className="w-40 shrink-0 py-5 md:w-1/4"></div>
          {plansColumns.map((col) => (
            <div
              key={col}
              className="font-heading flex-1 py-5 text-center tracking-wide text-black capitalize"
            >
              {planNameMap[col] || col}
            </div>
          ))}
        </div>
      </div>

      {/* Scrollable table body */}
      <div className="overflow-x-auto">
        <table className="w-full table-fixed">
          <tbody>
            {plans.map((row: PlansRow, index: number) => (
              <tr key={index}>
                <td
                  data-tip={row.tooltip ? row.tooltip : ""}
                  className="bg-background sticky start-0 w-40 md:w-1/4 md:bg-transparent"
                >
                  <div className="flex items-center justify-between gap-2 py-4">
                    <span className="lg:text-base">{row.feature}</span>
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
                    className="text-muted-foreground py-4 text-center lg:text-base"
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

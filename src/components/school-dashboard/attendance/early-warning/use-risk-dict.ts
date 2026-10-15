"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/** Typed access to the dictionaries the risk pages read. */
import type hubEn from "@/components/internationalization/dictionaries/en/attendance-hub.json"
import type riskEn from "@/components/internationalization/dictionaries/en/attendance-risk.json"
import { useDictionary } from "@/components/internationalization/use-dictionary"
import { plural } from "@/components/school-dashboard/school/configuration/ui/format"

export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K]
}
export type RiskDict = DeepPartial<typeof riskEn>
type Strings = Record<string, string>

interface Shape {
  attendanceRisk?: RiskDict
  attendanceHub?: typeof hubEn
  school?: {
    attendance?: {
      interventions?: {
        interventionTypes?: Strings
        statusConfig?: Strings
      }
    }
  }
}

export function useRiskDict() {
  const { dictionary } = useDictionary()
  const d = dictionary as unknown as Shape | undefined
  const legacy = d?.school?.attendance?.interventions
  return {
    t: (d?.attendanceRisk ?? {}) as RiskDict,
    table: (d?.attendanceHub?.table ?? {}) as Partial<typeof hubEn.table>,
    typeLabels: legacy?.interventionTypes ?? {},
    statusLabels: legacy?.statusConfig ?? {},
  }
}

/** Look up a dynamic key in a string map without widening to `any`. */
export function pick(map: object | undefined, key: string): string | undefined {
  return (map as Strings | undefined)?.[key]
}

/** Plural forms from a (partial) dictionary entry. */
export function pl(forms: object | undefined, n: number, lang: string): string {
  return plural(forms as Strings | undefined, n, lang)
}

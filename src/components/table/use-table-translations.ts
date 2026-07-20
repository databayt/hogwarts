// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * useTableTranslations - Central i18n for shared DataTable chrome
 *
 * WHY THIS EXISTS:
 * The load-more controls and the empty-state row are rendered by shared
 * primitives, but the strings used to come from an optional `translations`
 * prop that each of the ~39 table call sites had to thread through by hand.
 * 27 of them never did, so Arabic users saw hardcoded English ("Load More",
 * "Loading...", "No results.").
 *
 * RESOLUTION ORDER (first non-empty wins):
 *   1. explicit `translations` prop  - per-table wording stays authoritative
 *   2. `dictionary.common.*`         - the app-wide DictionaryProvider
 *   3. built-in ar/en constants      - keyed off useLocale(), never throws
 *
 * Step 3 matters because these primitives also render in tests and previews
 * that mount no provider; degrading beats crashing.
 */

"use client"

import * as React from "react"

import { useOptionalDictionary } from "@/components/internationalization/dictionary-context"
import { useLocale } from "@/components/internationalization/use-locale"

export interface TableTranslations {
  loadMore?: string
  loading?: string
  noResults?: string
  rowsSelected?: string
  allLoaded?: string
}

/** Last-resort strings for when no provider is mounted. */
const FALLBACK: Record<"ar" | "en", Required<TableTranslations>> = {
  en: {
    loadMore: "Load more",
    loading: "Loading...",
    noResults: "No results found.",
    rowsSelected: "{selected} of {total} row(s) selected.",
    allLoaded: "All {total} loaded",
  },
  ar: {
    loadMore: "تحميل المزيد",
    loading: "جاري التحميل...",
    noResults: "لم يتم العثور على نتائج.",
    rowsSelected: "{selected} من {total} صف(وف) محدد.",
    allLoaded: "تم تحميل الكل ({total})",
  },
}

/**
 * Fill `{name}` placeholders. Kept here so callers never concatenate sentence
 * fragments — word order differs between Arabic and English, and a template
 * with named slots is the only form that survives translation.
 */
export function interpolate(
  template: string,
  values: Record<string, string | number>
): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match
  )
}

export function useTableTranslations(
  overrides?: TableTranslations
): Required<TableTranslations> {
  const { locale } = useLocale()
  const dictionary = useOptionalDictionary()

  // `common` is typed from en.json; older cached dictionaries may predate the
  // loadMore/allLoaded keys, so treat every field as possibly absent.
  const common = dictionary?.common as Partial<TableTranslations> | undefined

  return React.useMemo(() => {
    const base = FALLBACK[locale === "ar" ? "ar" : "en"]
    const pick = (key: keyof TableTranslations): string =>
      overrides?.[key] || common?.[key] || base[key]

    return {
      loadMore: pick("loadMore"),
      loading: pick("loading"),
      noResults: pick("noResults"),
      rowsSelected: pick("rowsSelected"),
      allLoaded: pick("allLoaded"),
    }
  }, [
    locale,
    common,
    overrides?.loadMore,
    overrides?.loading,
    overrides?.noResults,
    overrides?.rowsSelected,
    overrides?.allLoaded,
  ])
}

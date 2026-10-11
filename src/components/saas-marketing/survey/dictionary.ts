// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Locale } from "@/components/internationalization/config"
import type en from "@/components/internationalization/dictionaries/en/survey.json"

export type SurveyDictionary = typeof en

/**
 * The survey loads its own namespace and nothing else. It is not registered
 * in namespaces.ts on purpose: that would add it to every getDictionary()
 * merge, and the flow hands this object to a client component.
 */
export const getSurveyDictionary = (lang: Locale): Promise<SurveyDictionary> =>
  (lang === "en"
    ? import("@/components/internationalization/dictionaries/en/survey.json")
    : import("@/components/internationalization/dictionaries/ar/survey.json")
  ).then((m) => m.default)

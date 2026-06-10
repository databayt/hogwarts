// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Locale } from "./config"
import type { Dictionary } from "./dictionaries"
import {
  flatDictionaries,
  loadFeatureDictionaries,
  loadLocale,
} from "./namespaces"

/**
 * Client-side dictionary loader. Mirrors the server `getDictionary` merge
 * exactly — both derive from the shared registry in ./namespaces.ts, so the
 * client can never drift from the server shape again.
 */
export const getDictionaryClient = async (
  locale: Locale
): Promise<Dictionary> => {
  const [general, school, stream, operator, features] = await Promise.all([
    loadLocale(flatDictionaries.general, locale),
    loadLocale(flatDictionaries.school, locale),
    loadLocale(flatDictionaries.stream, locale),
    loadLocale(flatDictionaries.operator, locale),
    loadFeatureDictionaries(locale),
  ])

  return {
    ...general,
    ...school,
    ...stream,
    ...operator,
    ...features,
  } as Dictionary
}

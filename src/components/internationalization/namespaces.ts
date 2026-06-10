// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Single source of truth for every dictionary namespace.
 *
 * Both the server loader (`dictionaries.ts`) and the client loader
 * (`get-dictionary-client.ts`) derive their imports and merge shape from
 * this registry — adding a namespace here is the ONLY registration step.
 * (Historically the two loaders kept separate lists and drifted: the client
 * was missing `compliance` and `liveClasses` while the type said they exist.)
 *
 * Loaders are literal `import()` thunks so the bundler can code-split each
 * JSON chunk; the registry only holds references.
 */
import type { Locale } from "./config"

/** Spread flat into the dictionary root (general/school/stream/operator). */
export const flatDictionaries = {
  general: {
    en: () => import("./en.json").then((m) => m.default),
    ar: () => import("./ar.json").then((m) => m.default),
  },
  school: {
    en: () => import("./school-en.json").then((m) => m.default),
    ar: () => import("./school-ar.json").then((m) => m.default),
  },
  stream: {
    en: () => import("./stream-en.json").then((m) => m.default),
    ar: () => import("./stream-ar.json").then((m) => m.default),
  },
  operator: {
    en: () => import("./operator-en.json").then((m) => m.default),
    ar: () => import("./operator-ar.json").then((m) => m.default),
  },
} as const

/** Nested under their key in the merged dictionary (dictionary.<key>.*). */
export const featureDictionaries = {
  library: {
    en: () => import("./dictionaries/en/library.json").then((m) => m.default),
    ar: () => import("./dictionaries/ar/library.json").then((m) => m.default),
  },
  banking: {
    en: () => import("./dictionaries/en/banking.json").then((m) => m.default),
    ar: () => import("./dictionaries/ar/banking.json").then((m) => m.default),
  },
  marking: {
    en: () => import("./dictionaries/en/marking.json").then((m) => m.default),
    ar: () => import("./dictionaries/ar/marking.json").then((m) => m.default),
  },
  generate: {
    en: () => import("./dictionaries/en/generate.json").then((m) => m.default),
    ar: () => import("./dictionaries/ar/generate.json").then((m) => m.default),
  },
  results: {
    en: () => import("./dictionaries/en/results.json").then((m) => m.default),
    ar: () => import("./dictionaries/ar/results.json").then((m) => m.default),
  },
  finance: {
    en: () => import("./dictionaries/en/finance.json").then((m) => m.default),
    ar: () => import("./dictionaries/ar/finance.json").then((m) => m.default),
  },
  admin: {
    en: () => import("./dictionaries/en/admin.json").then((m) => m.default),
    ar: () => import("./dictionaries/ar/admin.json").then((m) => m.default),
  },
  profile: {
    en: () => import("./dictionaries/en/profile.json").then((m) => m.default),
    ar: () => import("./dictionaries/ar/profile.json").then((m) => m.default),
  },
  notifications: {
    en: () =>
      import("./dictionaries/en/notifications.json").then((m) => m.default),
    ar: () =>
      import("./dictionaries/ar/notifications.json").then((m) => m.default),
  },
  messages: {
    en: () => import("./dictionaries/en/messages.json").then((m) => m.default),
    ar: () => import("./dictionaries/ar/messages.json").then((m) => m.default),
  },
  lab: {
    en: () => import("./dictionaries/en/lab.json").then((m) => m.default),
    ar: () => import("./dictionaries/ar/lab.json").then((m) => m.default),
  },
  sales: {
    en: () => import("./dictionaries/en/sales.json").then((m) => m.default),
    ar: () => import("./dictionaries/ar/sales.json").then((m) => m.default),
  },
  attendance: {
    en: () =>
      import("./dictionaries/en/attendance.json").then((m) => m.default),
    ar: () =>
      import("./dictionaries/ar/attendance.json").then((m) => m.default),
  },
  messaging: {
    en: () => import("./dictionaries/en/messaging.json").then((m) => m.default),
    ar: () => import("./dictionaries/ar/messaging.json").then((m) => m.default),
  },
  whatsapp: {
    en: () => import("./dictionaries/en/whatsapp.json").then((m) => m.default),
    ar: () => import("./dictionaries/ar/whatsapp.json").then((m) => m.default),
  },
  transportation: {
    en: () =>
      import("./dictionaries/en/transportation.json").then((m) => m.default),
    ar: () =>
      import("./dictionaries/ar/transportation.json").then((m) => m.default),
  },
  compliance: {
    en: () =>
      import("./dictionaries/en/compliance.json").then((m) => m.default),
    ar: () =>
      import("./dictionaries/ar/compliance.json").then((m) => m.default),
  },
  liveClasses: {
    en: () =>
      import("./dictionaries/en/live-classes.json").then((m) => m.default),
    ar: () =>
      import("./dictionaries/ar/live-classes.json").then((m) => m.default),
  },
  parentPortal: {
    en: () =>
      import("./dictionaries/en/parentPortal.json").then((m) => m.default),
    ar: () =>
      import("./dictionaries/ar/parentPortal.json").then((m) => m.default),
  },
} as const

export type FeatureNamespace = keyof typeof featureDictionaries

/** Precise per-namespace JSON types (keeps `Dictionary` inference intact). */
export type FeatureDictionaries = {
  [K in FeatureNamespace]: Awaited<
    ReturnType<(typeof featureDictionaries)[K]["en"]>
  >
}

export const FEATURE_NAMESPACE_KEYS = Object.keys(
  featureDictionaries
) as FeatureNamespace[]

/** Load one namespace pair for a locale, falling back to English. */
export const loadLocale = <T>(
  dict: { readonly en: () => Promise<T>; readonly ar: () => Promise<T> },
  locale: Locale
): Promise<T> => (dict[locale] ?? dict.en)()

/**
 * Load one feature namespace by (possibly union-typed) key.
 * Deliberately returns `unknown` — per-key shapes are restored by the
 * mapped-type casts in the loaders, which generics can't express over a
 * union of 19 distinct JSON shapes.
 */
export const loadFeature = (
  key: FeatureNamespace,
  locale: Locale
): Promise<unknown> => {
  const dict = featureDictionaries[key] as {
    readonly en: () => Promise<unknown>
    readonly ar: () => Promise<unknown>
  }
  return (dict[locale] ?? dict.en)()
}

/** Load ALL feature namespaces for a locale, nested under their keys. */
export async function loadFeatureDictionaries(
  locale: Locale
): Promise<FeatureDictionaries> {
  const values = await Promise.all(
    FEATURE_NAMESPACE_KEYS.map((key) => loadFeature(key, locale))
  )
  return Object.fromEntries(
    FEATURE_NAMESPACE_KEYS.map((key, i) => [key, values[i]])
  ) as unknown as FeatureDictionaries
}

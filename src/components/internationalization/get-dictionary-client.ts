// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Locale } from "./config"
import type { Dictionary } from "./dictionaries"

const dictionaries = {
  en: () => import("./en.json").then((module) => module.default),
  ar: () => import("./ar.json").then((module) => module.default),
}

export const getDictionaryClient = async (
  locale: Locale
): Promise<Dictionary> => {
  const dictionary = await dictionaries[locale]()

  // Import school-specific translations
  const schoolDictionary =
    locale === "ar"
      ? await import("./school-ar.json").then((module) => module.default)
      : await import("./school-en.json").then((module) => module.default)

  // Import stream translations
  const streamDictionary =
    locale === "ar"
      ? await import("./stream-ar.json").then((module) => module.default)
      : await import("./stream-en.json").then((module) => module.default)

  // Import operator translations
  const operatorDictionary =
    locale === "ar"
      ? await import("./operator-ar.json").then((module) => module.default)
      : await import("./operator-en.json").then((module) => module.default)

  // Import module dictionaries
  const [
    library,
    banking,
    marking,
    generate,
    results,
    finance,
    admin,
    profile,
    notifications,
    messages,
    lab,
    sales,
    attendance,
    messaging,
  ] = await Promise.all([
    locale === "ar"
      ? import("./dictionaries/ar/library.json").then((m) => m.default)
      : import("./dictionaries/en/library.json").then((m) => m.default),
    locale === "ar"
      ? import("./dictionaries/ar/banking.json").then((m) => m.default)
      : import("./dictionaries/en/banking.json").then((m) => m.default),
    locale === "ar"
      ? import("./dictionaries/ar/marking.json").then((m) => m.default)
      : import("./dictionaries/en/marking.json").then((m) => m.default),
    locale === "ar"
      ? import("./dictionaries/ar/generate.json").then((m) => m.default)
      : import("./dictionaries/en/generate.json").then((m) => m.default),
    locale === "ar"
      ? import("./dictionaries/ar/results.json").then((m) => m.default)
      : import("./dictionaries/en/results.json").then((m) => m.default),
    locale === "ar"
      ? import("./dictionaries/ar/finance.json").then((m) => m.default)
      : import("./dictionaries/en/finance.json").then((m) => m.default),
    locale === "ar"
      ? import("./dictionaries/ar/admin.json").then((m) => m.default)
      : import("./dictionaries/en/admin.json").then((m) => m.default),
    locale === "ar"
      ? import("./dictionaries/ar/profile.json").then((m) => m.default)
      : import("./dictionaries/en/profile.json").then((m) => m.default),
    locale === "ar"
      ? import("./dictionaries/ar/notifications.json").then((m) => m.default)
      : import("./dictionaries/en/notifications.json").then((m) => m.default),
    locale === "ar"
      ? import("./dictionaries/ar/messages.json").then((m) => m.default)
      : import("./dictionaries/en/messages.json").then((m) => m.default),
    locale === "ar"
      ? import("./dictionaries/ar/lab.json").then((m) => m.default)
      : import("./dictionaries/en/lab.json").then((m) => m.default),
    locale === "ar"
      ? import("./dictionaries/ar/sales.json").then((m) => m.default)
      : import("./dictionaries/en/sales.json").then((m) => m.default),
    locale === "ar"
      ? import("./dictionaries/ar/attendance.json").then((m) => m.default)
      : import("./dictionaries/en/attendance.json").then((m) => m.default),
    locale === "ar"
      ? import("./dictionaries/ar/messaging.json").then((m) => m.default)
      : import("./dictionaries/en/messaging.json").then((m) => m.default),
  ])

  // Merge the dictionaries - matching server-side getDictionary() pattern
  return {
    ...dictionary,
    ...schoolDictionary,
    ...streamDictionary,
    ...operatorDictionary,
    library,
    banking,
    marking,
    generate,
    results,
    finance,
    admin,
    profile,
    notifications,
    messages,
    lab,
    sales,
    attendance,
    messaging,
  } as Dictionary
}

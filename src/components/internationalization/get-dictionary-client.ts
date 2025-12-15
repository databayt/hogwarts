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

  // Merge the dictionaries
  return {
    ...dictionary,
    ...schoolDictionary,
  } as Dictionary
}

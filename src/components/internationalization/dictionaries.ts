import "server-only";
import type { Locale } from "./config";

// We enumerate all dictionaries here for better linting and typescript support
const generalDictionaries = {
  "en": () => import("./en.json").then((module) => module.default),
  "ar": () => import("./ar.json").then((module) => module.default),
} as const;

const schoolDictionaries = {
  "en": () => import("./school-en.json").then((module) => module.default),
  "ar": () => import("./school-ar.json").then((module) => module.default),
} as const;

const streamDictionaries = {
  "en": () => import("./stream-en.json").then((module) => module.default),
  "ar": () => import("./stream-ar.json").then((module) => module.default),
} as const;

const operatorDictionaries = {
  "en": () => import("./operator-en.json").then((module) => module.default),
  "ar": () => import("./operator-ar.json").then((module) => module.default),
} as const;

// Library module dictionaries
const libraryDictionaries = {
  "en": () => import("./dictionaries/en/library.json").then((module) => module.default),
  "ar": () => import("./dictionaries/ar/library.json").then((module) => module.default),
} as const;

// Banking module dictionaries
const bankingDictionaries = {
  "en": () => import("./dictionaries/en/banking.json").then((module) => module.default),
  "ar": () => import("./dictionaries/ar/banking.json").then((module) => module.default),
} as const;

export const getDictionary = async (locale: Locale) => {
  try {
    // Load all dictionaries
    const [general, school, stream, operator, library, banking] = await Promise.all([
      generalDictionaries[locale]?.() ?? generalDictionaries["en"](),
      schoolDictionaries[locale]?.() ?? schoolDictionaries["en"](),
      streamDictionaries[locale]?.() ?? streamDictionaries["en"](),
      operatorDictionaries[locale]?.() ?? operatorDictionaries["en"](),
      libraryDictionaries[locale]?.() ?? libraryDictionaries["en"](),
      bankingDictionaries[locale]?.() ?? bankingDictionaries["en"]()
    ]);

    // Merge dictionaries with library and banking nested under their respective keys
    return { ...general, ...school, ...stream, ...operator, library, banking };
  } catch (error) {
    console.warn(`Failed to load dictionary for locale: ${locale}. Falling back to en.`);
    const [general, school, stream, operator, library, banking] = await Promise.all([
      generalDictionaries["en"](),
      schoolDictionaries["en"](),
      streamDictionaries["en"](),
      operatorDictionaries["en"](),
      libraryDictionaries["en"](),
      bankingDictionaries["en"]()
    ]);
    return { ...general, ...school, ...stream, ...operator, library, banking };
  }
};

// Type helper for component props
export type Dictionary = Awaited<ReturnType<typeof getDictionary>>;
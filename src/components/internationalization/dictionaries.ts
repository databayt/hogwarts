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

// Marking module dictionaries (Auto-Marking System)
const markingDictionaries = {
  "en": () => import("./dictionaries/en/marking.json").then((module) => module.default),
  "ar": () => import("./dictionaries/ar/marking.json").then((module) => module.default),
} as const;

// Auto-Generate Exams module dictionaries
const generateDictionaries = {
  "en": () => import("./dictionaries/en/generate.json").then((module) => module.default),
  "ar": () => import("./dictionaries/ar/generate.json").then((module) => module.default),
} as const;

// Results module dictionaries
const resultsDictionaries = {
  "en": () => import("./dictionaries/en/results.json").then((module) => module.default),
  "ar": () => import("./dictionaries/ar/results.json").then((module) => module.default),
} as const;

// Finance module dictionaries
const financeDictionaries = {
  "en": () => import("./dictionaries/en/finance.json").then((module) => module.default),
  "ar": () => import("./dictionaries/ar/finance.json").then((module) => module.default),
} as const;

// Admin module dictionaries
const adminDictionaries = {
  "en": () => import("./dictionaries/en/admin.json").then((module) => module.default),
  "ar": () => import("./dictionaries/ar/admin.json").then((module) => module.default),
} as const;

export const getDictionary = async (locale: Locale) => {
  try {
    // Load all dictionaries
    const [general, school, stream, operator, library, banking, marking, generate, results, finance, admin] = await Promise.all([
      generalDictionaries[locale]?.() ?? generalDictionaries["en"](),
      schoolDictionaries[locale]?.() ?? schoolDictionaries["en"](),
      streamDictionaries[locale]?.() ?? streamDictionaries["en"](),
      operatorDictionaries[locale]?.() ?? operatorDictionaries["en"](),
      libraryDictionaries[locale]?.() ?? libraryDictionaries["en"](),
      bankingDictionaries[locale]?.() ?? bankingDictionaries["en"](),
      markingDictionaries[locale]?.() ?? markingDictionaries["en"](),
      generateDictionaries[locale]?.() ?? generateDictionaries["en"](),
      resultsDictionaries[locale]?.() ?? resultsDictionaries["en"](),
      financeDictionaries[locale]?.() ?? financeDictionaries["en"](),
      adminDictionaries[locale]?.() ?? adminDictionaries["en"]()
    ]);

    // Merge dictionaries with library, banking, marking, generate, results, finance, and admin nested under their respective keys
    return { ...general, ...school, ...stream, ...operator, library, banking, marking, generate, results, finance, admin };
  } catch (error) {
    console.warn(`Failed to load dictionary for locale: ${locale}. Falling back to en.`);
    const [general, school, stream, operator, library, banking, marking, generate, results, finance, admin] = await Promise.all([
      generalDictionaries["en"](),
      schoolDictionaries["en"](),
      streamDictionaries["en"](),
      operatorDictionaries["en"](),
      libraryDictionaries["en"](),
      bankingDictionaries["en"](),
      markingDictionaries["en"](),
      generateDictionaries["en"](),
      resultsDictionaries["en"](),
      financeDictionaries["en"](),
      adminDictionaries["en"]()
    ]);
    return { ...general, ...school, ...stream, ...operator, library, banking, marking, generate, results, finance, admin };
  }
};

// Type helper for component props
export type Dictionary = Awaited<ReturnType<typeof getDictionary>>;
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

export const getDictionary = async (locale: Locale) => {
  try {
    // Load all dictionaries
    const [general, school, stream] = await Promise.all([
      generalDictionaries[locale]?.() ?? generalDictionaries["en"](),
      schoolDictionaries[locale]?.() ?? schoolDictionaries["en"](),
      streamDictionaries[locale]?.() ?? streamDictionaries["en"]()
    ]);

    // Merge dictionaries
    return { ...general, ...school, ...stream };
  } catch (error) {
    console.warn(`Failed to load dictionary for locale: ${locale}. Falling back to en.`);
    const [general, school, stream] = await Promise.all([
      generalDictionaries["en"](),
      schoolDictionaries["en"](),
      streamDictionaries["en"]()
    ]);
    return { ...general, ...school, ...stream };
  }
};

// Type helper for component props
export type Dictionary = Awaited<ReturnType<typeof getDictionary>>;
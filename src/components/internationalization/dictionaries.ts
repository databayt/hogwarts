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

// Profile module dictionaries
const profileDictionaries = {
  "en": () => import("./dictionaries/en/profile.json").then((module) => module.default),
  "ar": () => import("./dictionaries/ar/profile.json").then((module) => module.default),
} as const;

// Notifications module dictionaries
const notificationsDictionaries = {
  "en": () => import("./dictionaries/en/notifications.json").then((module) => module.default),
  "ar": () => import("./dictionaries/ar/notifications.json").then((module) => module.default),
} as const;

// Messages module dictionaries (validation, toast, errors)
const messagesDictionaries = {
  "en": () => import("./dictionaries/en/messages.json").then((module) => module.default),
  "ar": () => import("./dictionaries/ar/messages.json").then((module) => module.default),
} as const;

// ============================================================================
// Route-Specific Dictionary Loaders (Optimized)
// ============================================================================

/**
 * Marketing pages - only general translations
 * Used for: home page, landing pages, public pages
 */
export const getMarketingDictionary = async (locale: Locale) => {
  try {
    const general = await (generalDictionaries[locale]?.() ?? generalDictionaries["en"]());
    return general;
  } catch (error) {
    console.warn(`Failed to load marketing dictionary for locale: ${locale}`);
    return await generalDictionaries["en"]();
  }
};

/**
 * Platform core pages - general + school + operator + messages
 * Used for: dashboard, attendance, basic platform features
 */
export const getPlatformCoreDictionary = async (locale: Locale) => {
  try {
    const [general, school, operator, messages] = await Promise.all([
      generalDictionaries[locale]?.() ?? generalDictionaries["en"](),
      schoolDictionaries[locale]?.() ?? schoolDictionaries["en"](),
      operatorDictionaries[locale]?.() ?? operatorDictionaries["en"](),
      messagesDictionaries[locale]?.() ?? messagesDictionaries["en"](),
    ]);
    return { ...general, ...school, ...operator, messages };
  } catch (error) {
    console.warn(`Failed to load platform core dictionary for locale: ${locale}`);
    const [general, school, operator, messages] = await Promise.all([
      generalDictionaries["en"](),
      schoolDictionaries["en"](),
      operatorDictionaries["en"](),
      messagesDictionaries["en"](),
    ]);
    return { ...general, ...school, ...operator, messages };
  }
};

/**
 * Stream pages - platform core + stream
 * Used for: course/stream management pages
 */
export const getStreamDictionary = async (locale: Locale) => {
  try {
    const [general, school, operator, stream] = await Promise.all([
      generalDictionaries[locale]?.() ?? generalDictionaries["en"](),
      schoolDictionaries[locale]?.() ?? schoolDictionaries["en"](),
      operatorDictionaries[locale]?.() ?? operatorDictionaries["en"](),
      streamDictionaries[locale]?.() ?? streamDictionaries["en"](),
    ]);
    return { ...general, ...school, ...operator, ...stream };
  } catch (error) {
    console.warn(`Failed to load stream dictionary for locale: ${locale}`);
    const [general, school, operator, stream] = await Promise.all([
      generalDictionaries["en"](),
      schoolDictionaries["en"](),
      operatorDictionaries["en"](),
      streamDictionaries["en"](),
    ]);
    return { ...general, ...school, ...operator, ...stream };
  }
};

/**
 * Library pages - platform core + library
 * Used for: library management pages
 */
export const getLibraryDictionary = async (locale: Locale) => {
  try {
    const [general, school, operator, library] = await Promise.all([
      generalDictionaries[locale]?.() ?? generalDictionaries["en"](),
      schoolDictionaries[locale]?.() ?? schoolDictionaries["en"](),
      operatorDictionaries[locale]?.() ?? operatorDictionaries["en"](),
      libraryDictionaries[locale]?.() ?? libraryDictionaries["en"](),
    ]);
    return { ...general, ...school, ...operator, library };
  } catch (error) {
    console.warn(`Failed to load library dictionary for locale: ${locale}`);
    const [general, school, operator, library] = await Promise.all([
      generalDictionaries["en"](),
      schoolDictionaries["en"](),
      operatorDictionaries["en"](),
      libraryDictionaries["en"](),
    ]);
    return { ...general, ...school, ...operator, library };
  }
};

/**
 * Banking pages - platform core + banking
 * Used for: banking/accounts pages
 */
export const getBankingDictionary = async (locale: Locale) => {
  try {
    const [general, school, operator, banking] = await Promise.all([
      generalDictionaries[locale]?.() ?? generalDictionaries["en"](),
      schoolDictionaries[locale]?.() ?? schoolDictionaries["en"](),
      operatorDictionaries[locale]?.() ?? operatorDictionaries["en"](),
      bankingDictionaries[locale]?.() ?? bankingDictionaries["en"](),
    ]);
    return { ...general, ...school, ...operator, banking };
  } catch (error) {
    console.warn(`Failed to load banking dictionary for locale: ${locale}`);
    const [general, school, operator, banking] = await Promise.all([
      generalDictionaries["en"](),
      schoolDictionaries["en"](),
      operatorDictionaries["en"](),
      bankingDictionaries["en"](),
    ]);
    return { ...general, ...school, ...operator, banking };
  }
};

/**
 * Finance pages - platform core + finance
 * Used for: finance/accounting pages
 */
export const getFinanceDictionary = async (locale: Locale) => {
  try {
    const [general, school, operator, finance] = await Promise.all([
      generalDictionaries[locale]?.() ?? generalDictionaries["en"](),
      schoolDictionaries[locale]?.() ?? schoolDictionaries["en"](),
      operatorDictionaries[locale]?.() ?? operatorDictionaries["en"](),
      financeDictionaries[locale]?.() ?? financeDictionaries["en"](),
    ]);
    return { ...general, ...school, ...operator, finance };
  } catch (error) {
    console.warn(`Failed to load finance dictionary for locale: ${locale}`);
    const [general, school, operator, finance] = await Promise.all([
      generalDictionaries["en"](),
      schoolDictionaries["en"](),
      operatorDictionaries["en"](),
      financeDictionaries["en"](),
    ]);
    return { ...general, ...school, ...operator, finance };
  }
};

/**
 * Admin pages - platform core + admin
 * Used for: admin/settings pages
 */
export const getAdminDictionary = async (locale: Locale) => {
  try {
    const [general, school, operator, admin] = await Promise.all([
      generalDictionaries[locale]?.() ?? generalDictionaries["en"](),
      schoolDictionaries[locale]?.() ?? schoolDictionaries["en"](),
      operatorDictionaries[locale]?.() ?? operatorDictionaries["en"](),
      adminDictionaries[locale]?.() ?? adminDictionaries["en"](),
    ]);
    return { ...general, ...school, ...operator, admin };
  } catch (error) {
    console.warn(`Failed to load admin dictionary for locale: ${locale}`);
    const [general, school, operator, admin] = await Promise.all([
      generalDictionaries["en"](),
      schoolDictionaries["en"](),
      operatorDictionaries["en"](),
      adminDictionaries["en"](),
    ]);
    return { ...general, ...school, ...operator, admin };
  }
};

/**
 * Exam pages - platform core + marking + generate + results
 * Used for: exam management, marking, results pages
 */
export const getExamDictionary = async (locale: Locale) => {
  try {
    const [general, school, operator, marking, generate, results] = await Promise.all([
      generalDictionaries[locale]?.() ?? generalDictionaries["en"](),
      schoolDictionaries[locale]?.() ?? schoolDictionaries["en"](),
      operatorDictionaries[locale]?.() ?? operatorDictionaries["en"](),
      markingDictionaries[locale]?.() ?? markingDictionaries["en"](),
      generateDictionaries[locale]?.() ?? generateDictionaries["en"](),
      resultsDictionaries[locale]?.() ?? resultsDictionaries["en"](),
    ]);
    return { ...general, ...school, ...operator, marking, generate, results };
  } catch (error) {
    console.warn(`Failed to load exam dictionary for locale: ${locale}`);
    const [general, school, operator, marking, generate, results] = await Promise.all([
      generalDictionaries["en"](),
      schoolDictionaries["en"](),
      operatorDictionaries["en"](),
      markingDictionaries["en"](),
      generateDictionaries["en"](),
      resultsDictionaries["en"](),
    ]);
    return { ...general, ...school, ...operator, marking, generate, results };
  }
};

/**
 * Notification pages - platform core + notifications
 * Used for: notification center, notification preferences
 */
export const getNotificationDictionary = async (locale: Locale) => {
  try {
    const [general, school, operator, notifications] = await Promise.all([
      generalDictionaries[locale]?.() ?? generalDictionaries["en"](),
      schoolDictionaries[locale]?.() ?? schoolDictionaries["en"](),
      operatorDictionaries[locale]?.() ?? operatorDictionaries["en"](),
      notificationsDictionaries[locale]?.() ?? notificationsDictionaries["en"](),
    ]);
    return { ...general, ...school, ...operator, notifications };
  } catch (error) {
    console.warn(`Failed to load notification dictionary for locale: ${locale}`);
    const [general, school, operator, notifications] = await Promise.all([
      generalDictionaries["en"](),
      schoolDictionaries["en"](),
      operatorDictionaries["en"](),
      notificationsDictionaries["en"](),
    ]);
    return { ...general, ...school, ...operator, notifications };
  }
};

// ============================================================================
// Full Dictionary Loader (Default)
// ============================================================================

/**
 * Full dictionary - loads all translations
 * Use route-specific loaders above for better performance when needed
 */
export const getDictionary = async (locale: Locale) => {
  try {
    // Load all dictionaries
    const [general, school, stream, operator, library, banking, marking, generate, results, finance, admin, profile, notifications, messages] = await Promise.all([
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
      adminDictionaries[locale]?.() ?? adminDictionaries["en"](),
      profileDictionaries[locale]?.() ?? profileDictionaries["en"](),
      notificationsDictionaries[locale]?.() ?? notificationsDictionaries["en"](),
      messagesDictionaries[locale]?.() ?? messagesDictionaries["en"]()
    ]);

    // Merge dictionaries with library, banking, marking, generate, results, finance, admin, profile, notifications, and messages nested under their respective keys
    return { ...general, ...school, ...stream, ...operator, library, banking, marking, generate, results, finance, admin, profile, notifications, messages };
  } catch (error) {
    console.warn(`Failed to load dictionary for locale: ${locale}. Falling back to en.`);
    const [general, school, stream, operator, library, banking, marking, generate, results, finance, admin, profile, notifications, messages] = await Promise.all([
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
      adminDictionaries["en"](),
      profileDictionaries["en"](),
      notificationsDictionaries["en"](),
      messagesDictionaries["en"]()
    ]);
    return { ...general, ...school, ...stream, ...operator, library, banking, marking, generate, results, finance, admin, profile, notifications, messages };
  }
};

// ============================================================================
// Type Helpers
// ============================================================================

// Main dictionary type (used throughout the app)
export type Dictionary = Awaited<ReturnType<typeof getDictionary>>;
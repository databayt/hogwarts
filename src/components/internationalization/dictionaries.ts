// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import "server-only"

import { cache } from "react"

import type { Locale } from "./config"
import {
  flatDictionaries,
  loadFeature,
  loadFeatureDictionaries,
  loadLocale,
  type FeatureDictionaries,
  type FeatureNamespace,
} from "./namespaces"

// Namespace registration lives in ONE place: ./namespaces.ts (shared with the
// client loader). Every exported loader below is wrapped in React cache() so
// repeated calls within a single request reuse one merge.

/** general + school + operator — the core every dashboard route needs. */
const loadCore = (locale: Locale) =>
  Promise.all([
    loadLocale(flatDictionaries.general, locale),
    loadLocale(flatDictionaries.school, locale),
    loadLocale(flatDictionaries.operator, locale),
  ] as const)

/**
 * Build a route-scoped loader: core (general/school/operator, spread flat)
 * plus the given feature namespaces nested under their keys.
 */
const makeRouteDictionary = <K extends FeatureNamespace>(
  name: string,
  keys: readonly K[]
) =>
  cache(async (locale: Locale) => {
    const load = async (loc: Locale) => {
      const [[general, school, operator], features] = await Promise.all([
        loadCore(loc),
        Promise.all(keys.map((k) => loadFeature(k, loc))),
      ])
      const nested = Object.fromEntries(
        keys.map((k, i) => [k, features[i]])
      ) as unknown as { [P in K]: FeatureDictionaries[P] }
      return { ...general, ...school, ...operator, ...nested }
    }
    try {
      return await load(locale)
    } catch {
      console.warn(`Failed to load ${name} dictionary for locale: ${locale}`)
      return await load("en")
    }
  })

// ============================================================================
// Route-Specific Dictionary Loaders (Optimized)
// ============================================================================

/**
 * Marketing pages - only general translations
 * Used for: home page, landing pages, public pages
 */
export const getMarketingDictionary = cache(async (locale: Locale) => {
  try {
    return await loadLocale(flatDictionaries.general, locale)
  } catch {
    console.warn(`Failed to load marketing dictionary for locale: ${locale}`)
    return await flatDictionaries.general.en()
  }
})

/**
 * Platform core pages - general + school + saas-dashboard + messages
 * Used for: lab, attendance, basic school-dashboard features
 */
export const getPlatformCoreDictionary = makeRouteDictionary("platform core", [
  "messages",
])

/**
 * Stream pages - school-dashboard core + stream (spread flat)
 * Used for: course/stream management pages
 */
export const getStreamDictionary = cache(async (locale: Locale) => {
  const load = async (loc: Locale) => {
    const [[general, school, operator], stream] = await Promise.all([
      loadCore(loc),
      loadLocale(flatDictionaries.stream, loc),
    ])
    return { ...general, ...school, ...operator, ...stream }
  }
  try {
    return await load(locale)
  } catch {
    console.warn(`Failed to load stream dictionary for locale: ${locale}`)
    return await load("en")
  }
})

/** Library pages - school-dashboard core + library */
export const getLibraryDictionary = makeRouteDictionary("library", ["library"])

/** Banking pages - school-dashboard core + banking */
export const getBankingDictionary = makeRouteDictionary("banking", ["banking"])

/** Finance pages - school-dashboard core + finance */
export const getFinanceDictionary = makeRouteDictionary("finance", ["finance"])

/** Admin pages - school-dashboard core + admin */
export const getAdminDictionary = makeRouteDictionary("admin", ["admin"])

/**
 * Exam pages - school-dashboard core + marking + generate + results
 * Used for: exam management, marking, results pages
 */
export const getExamDictionary = makeRouteDictionary("exam", [
  "marking",
  "generate",
  "results",
])

/** Notification pages - school-dashboard core + notifications */
export const getNotificationDictionary = makeRouteDictionary("notification", [
  "notifications",
])

/** Sales pages - school-dashboard core + sales (leads, CRM, B2B) */
export const getSalesDictionary = makeRouteDictionary("sales", ["sales"])

/** SaaS operator dashboard - core + sales + messages */
export const getSaasDashboardDictionary = makeRouteDictionary(
  "saas dashboard",
  ["sales", "messages"]
)

/** Attendance pages - school-dashboard core + messages + attendance */
export const getAttendanceDictionary = makeRouteDictionary("attendance", [
  "messages",
  "attendance",
])

/** Compliance pages - school-dashboard core + messages + compliance */
export const getComplianceDictionary = makeRouteDictionary("compliance", [
  "messages",
  "compliance",
])

/** Messaging pages - school-dashboard core + messages + messaging (chat) */
export const getMessagingDictionary = makeRouteDictionary("messaging", [
  "messages",
  "messaging",
])

/** WhatsApp pages - school-dashboard core + messages + whatsapp */
export const getWhatsAppDictionary = makeRouteDictionary("whatsapp", [
  "messages",
  "whatsapp",
])

// ============================================================================
// Full Dictionary Loader (Default)
// ============================================================================

/**
 * Full dictionary - loads all translations
 * Use route-specific loaders above for better performance when needed
 */
export const getDictionary = cache(async (locale: Locale) => {
  const load = async (loc: Locale) => {
    const [general, school, stream, operator, features] = await Promise.all([
      loadLocale(flatDictionaries.general, loc),
      loadLocale(flatDictionaries.school, loc),
      loadLocale(flatDictionaries.stream, loc),
      loadLocale(flatDictionaries.operator, loc),
      loadFeatureDictionaries(loc),
    ])
    return { ...general, ...school, ...stream, ...operator, ...features }
  }
  try {
    return await load(locale)
  } catch {
    console.warn(
      `Failed to load dictionary for locale: ${locale}. Falling back to en.`
    )
    return await load("en")
  }
})

// ============================================================================
// Type Helpers
// ============================================================================

// Main dictionary type (used throughout the app)
export type Dictionary = Awaited<ReturnType<typeof getDictionary>>

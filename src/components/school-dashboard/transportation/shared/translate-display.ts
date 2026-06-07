// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import "server-only"

import type { Locale } from "@/components/internationalization/config"
import { getText } from "@/components/translation/display"

// Transportation content (route/stop names, addresses, notes) is stored in one
// language with a `lang` field. These helpers translate the user-authored text
// fields on demand into the viewer's locale (System B), so a route stored in
// Arabic reads in English when the dashboard is viewed in English. They run only
// in server components/actions — getText is a server action and falls
// back to the source text on any failure, so callers never need a try/catch.

type Lang = "ar" | "en"

async function tx(
  text: string | null | undefined,
  srcLang: string | null | undefined,
  displayLang: Locale,
  schoolId: string
): Promise<string | null> {
  if (!text) return text ?? null
  return getText(text, (srcLang as Lang) || "ar", displayLang as Lang, schoolId)
}

type RouteLike = {
  name: string
  originName: string
  destinationName: string
  notes: string | null
  lang: string
  schoolId: string
}

export async function translateRoute<T extends RouteLike>(
  route: T,
  displayLang: Locale
): Promise<T> {
  const [name, originName, destinationName, notes] = await Promise.all([
    tx(route.name, route.lang, displayLang, route.schoolId),
    tx(route.originName, route.lang, displayLang, route.schoolId),
    tx(route.destinationName, route.lang, displayLang, route.schoolId),
    tx(route.notes, route.lang, displayLang, route.schoolId),
  ])
  return {
    ...route,
    name: name as string,
    originName: originName as string,
    destinationName: destinationName as string,
    notes,
  }
}

export async function translateRoutes<T extends RouteLike>(
  routes: T[],
  displayLang: Locale
): Promise<T[]> {
  return Promise.all(routes.map((r) => translateRoute(r, displayLang)))
}

type StopLike = {
  name: string
  address: string | null
  notes: string | null
  lang: string
  schoolId: string
}

export async function translateStop<T extends StopLike>(
  stop: T,
  displayLang: Locale
): Promise<T> {
  const [name, address, notes] = await Promise.all([
    tx(stop.name, stop.lang, displayLang, stop.schoolId),
    tx(stop.address, stop.lang, displayLang, stop.schoolId),
    tx(stop.notes, stop.lang, displayLang, stop.schoolId),
  ])
  return { ...stop, name: name as string, address, notes }
}

export async function translateStops<T extends StopLike>(
  stops: T[],
  displayLang: Locale
): Promise<T[]> {
  return Promise.all(stops.map((s) => translateStop(s, displayLang)))
}

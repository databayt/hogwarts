"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { createContext, use, type ReactNode } from "react"

import type { SchoolGeo } from "@/lib/map-bias"

/**
 * The current school's map point, provided once by the tenant layout so every
 * location picker under a school (student/teacher wizards, the public
 * application, transportation) opens around the school without threading a
 * prop through each form. Public data — it's the school's own address pin.
 *
 * The layout hands over an UNAWAITED promise: the tenant shell never waits on
 * it, and only a mounted picker reads it (inside its dynamic-import boundary,
 * long after the query has resolved).
 */
const SchoolGeoContext = createContext<Promise<SchoolGeo | null> | null>(null)

export function SchoolGeoProvider({
  value,
  children,
}: {
  value: Promise<SchoolGeo | null>
  children: ReactNode
}) {
  return <SchoolGeoContext value={value}>{children}</SchoolGeoContext>
}

/** Outside a tenant (onboarding) there is no provider and this returns null. */
export function useSchoolGeo(): SchoolGeo | null {
  const promise = use(SchoolGeoContext)
  return promise ? use(promise) : null
}

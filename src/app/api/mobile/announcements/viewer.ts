// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { UserRole } from "@prisma/client"

import type { Lang } from "@/components/translation/types"

import type { MobileAuthContext } from "../lib/authenticate"

const KNOWN_ROLES: readonly UserRole[] = [
  "DEVELOPER",
  "ADMIN",
  "TEACHER",
  "STUDENT",
  "GUARDIAN",
  "ACCOUNTANT",
  "STAFF",
  "USER",
]

/**
 * The caller's role as the web's audience rules understand it. A token whose
 * role is missing or unknown reads as `USER` — an audience-only reader — so a
 * malformed claim can never widen what it sees to the staff list.
 */
export function viewerRole(auth: Pick<MobileAuthContext, "role">): UserRole {
  return (KNOWN_ROLES as readonly string[]).includes(auth.role)
    ? (auth.role as UserRole)
    : "USER"
}

/** `?lang=ar|en` — when present, titles and bodies come back localized. */
export function displayLang(searchParams: URLSearchParams): Lang | null {
  const lang = searchParams.get("lang")
  return lang === "ar" || lang === "en" ? lang : null
}

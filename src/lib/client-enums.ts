// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// GENERATED from prisma/models/*.prisma — the Prisma enums that client
// components use as VALUES, without Prisma's browser client.
//
// A value import from "@prisma/client" in a client component bundles the
// browser runtime (Decimal.js and friends, ~47 KB gzip) just to read a few
// strings. These are the same string unions, so they are assignable to and
// from Prisma's types. src/tests/lib/client-enums.test.ts pins them to the
// generated client; regenerate when an enum changes.

export const UserRole = {
  DEVELOPER: "DEVELOPER",
  ADMIN: "ADMIN",
  TEACHER: "TEACHER",
  STUDENT: "STUDENT",
  GUARDIAN: "GUARDIAN",
  ACCOUNTANT: "ACCOUNTANT",
  STAFF: "STAFF",
  USER: "USER",
} as const
export type UserRole = (typeof UserRole)[keyof typeof UserRole]

export const ComplianceProvider = {
  ADEK_ESIS: "ADEK_ESIS",
  CUSTOM: "CUSTOM",
} as const
export type ComplianceProvider =
  (typeof ComplianceProvider)[keyof typeof ComplianceProvider]

export const ConnectorMode = {
  DRY_RUN: "DRY_RUN",
  PIGGYBACK: "PIGGYBACK",
  OFFICIAL_API: "OFFICIAL_API",
  RPA: "RPA",
  DISABLED: "DISABLED",
} as const
export type ConnectorMode = (typeof ConnectorMode)[keyof typeof ConnectorMode]

export const DifficultyLevel = {
  EASY: "EASY",
  MEDIUM: "MEDIUM",
  HARD: "HARD",
} as const
export type DifficultyLevel =
  (typeof DifficultyLevel)[keyof typeof DifficultyLevel]

export const QuestionType = {
  MULTIPLE_CHOICE: "MULTIPLE_CHOICE",
  TRUE_FALSE: "TRUE_FALSE",
  SHORT_ANSWER: "SHORT_ANSWER",
  ESSAY: "ESSAY",
  FILL_BLANK: "FILL_BLANK",
  MATCHING: "MATCHING",
  ORDERING: "ORDERING",
  MULTI_SELECT: "MULTI_SELECT",
} as const
export type QuestionType = (typeof QuestionType)[keyof typeof QuestionType]

export const BloomLevel = {
  REMEMBER: "REMEMBER",
  UNDERSTAND: "UNDERSTAND",
  APPLY: "APPLY",
  ANALYZE: "ANALYZE",
  EVALUATE: "EVALUATE",
  CREATE: "CREATE",
} as const
export type BloomLevel = (typeof BloomLevel)[keyof typeof BloomLevel]

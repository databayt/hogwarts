// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Translatable-field registry — the SINGLE source of truth for "which model has
 * which user-facing text fields". `localize()` (read), `prewarm()` (write), and
 * the audit gate (CI) all read from here, so adding a new content model is a
 * ONE-LINE change and nothing else has to repeat the field list.
 *
 * Curation rules (do NOT blindly dump every `String` column of a `lang`-bearing
 * model — that breaks correctness):
 *   - ✅ include only user-FACING display text (title, name, description, body…).
 *   - ❌ exclude slugs / template names / codes (machine identifiers).
 *   - ❌ exclude template bodies with `{{placeholders}}` — MT would mangle them.
 *   - ❌ exclude internal-only notes that never render to an end user.
 *
 * Model keys are the LOGICAL model name you pass to `localize("Event", rows)` —
 * not the Prisma accessor. Field names are already canonical/generic across the
 * schema (single-language storage: `title`/`name`/`body`/`description`, never
 * `titleAr`/`titleEn`), which is what makes this registry clean.
 */
export const TRANSLATABLE = {
  // — Announcements & comms —
  Announcement: ["title", "body"],
  // title/body deliberately EXCLUDED — they carry {{placeholders}} (see rule above)
  AnnouncementTemplate: ["name", "description"],
  Event: ["title", "description", "location", "organizer"],
  Notification: ["title", "body"],
  Conference: ["title", "description"],

  // — Academic structure / catalog —
  Subject: ["name", "description"],
  Class: ["name"],
  Section: ["name"],
  Lesson: ["name", "description"],
  Chapter: ["name", "description"],
  Material: ["title", "description"],
  Curriculum: ["name", "description"],
  CurriculumStandard: ["name", "description"],

  // — Rooms —
  Classroom: ["roomName"],
  ClassroomType: ["name"],

  // — Assessments —
  Assignment: ["title", "description"],
  Exam: ["title", "description"],
  ExamTemplate: ["name", "description"],
  Quiz: ["title", "description"],
  QuickAssessment: ["title"],

  // — Library / content —
  Book: ["title", "author", "genre", "description", "summary"],
  Textbook: ["title", "author"],
  Document: ["title", "description"],
  StreamCourse: ["title", "description"],
  StreamCategory: ["name"],
  Video: ["title", "description"],

  // — Org / school structure —
  // Field names mirror the ACTUAL prisma columns (registry-schema.test.ts
  // enforces this — a wrong name here silently no-ops localize/prewarm).
  Department: ["departmentName"],
  GradingScheme: ["name"],
  YearLevel: ["levelName"],
  Route: ["name", "originName", "destinationName"],
} as const

export type TranslatableModel = keyof typeof TRANSLATABLE

/**
 * Registered models that live in the GLOBAL catalog (no `schoolId` column).
 * Their content is authored centrally (operator context, no tenant), so
 * `prewarm()` is structurally impossible on their write paths — each school's
 * first reader warms that school's cache instead (bounded by the Google
 * timeout, then cached). `localize()` still applies at read time because the
 * READER always has a schoolId. Kept in sync with the schema by
 * registry-schema.test.ts (model listed here ⟺ no schoolId in prisma).
 */
export const CATALOG_GLOBAL: ReadonlySet<TranslatableModel> = new Set([
  "Subject",
  "Chapter",
  "Lesson",
  "Material",
  "Curriculum",
  "Assignment",
  "Exam",
  "ExamTemplate",
  "Quiz",
  "Book",
  "Textbook",
  "Document",
] as const)

/** Translatable text fields for a model, or `[]` if the model isn't registered. */
export function fieldsFor(model: string): readonly string[] {
  return (TRANSLATABLE as Record<string, readonly string[]>)[model] ?? []
}

/** Every registered field name, deduped — used by the audit gate. */
export const ALL_TRANSLATABLE_FIELDS: ReadonlySet<string> = new Set(
  Object.values(TRANSLATABLE).flat()
)

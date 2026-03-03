"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"

import { db } from "@/lib/db"
import { requireDeveloper } from "@/components/saas-dashboard/lib/operator-auth"

import {
  catalogChapterSchema,
  catalogLessonSchema,
  catalogSubjectSchema,
} from "./validation"

// ============================================================================
// CatalogSubject CRUD
// ============================================================================

export async function createCatalogSubject(data: FormData) {
  await requireDeveloper()

  const raw = Object.fromEntries(data)
  const levels = data.getAll("levels") as string[]
  const grades = data
    .getAll("grades")
    .map(Number)
    .filter((n) => !isNaN(n))
  const schoolTypes = data.getAll("schoolTypes") as string[]

  const validated = catalogSubjectSchema.parse({
    ...raw,
    levels,
    grades,
    schoolTypes,
    sortOrder: raw.sortOrder ? Number(raw.sortOrder) : 0,
  })

  const subject = await db.catalogSubject.create({
    data: validated,
  })

  revalidatePath("/catalog")
  return { success: true, subject }
}

export async function updateCatalogSubject(id: string, data: FormData) {
  await requireDeveloper()

  const raw = Object.fromEntries(data)
  const levels = data.getAll("levels") as string[]
  const gradesRaw = data.getAll("grades")
  const grades =
    gradesRaw.length > 0
      ? gradesRaw.map(Number).filter((n) => !isNaN(n))
      : undefined
  const schoolTypesRaw = data.getAll("schoolTypes") as string[]
  const schoolTypes = schoolTypesRaw.length > 0 ? schoolTypesRaw : undefined

  const validated = catalogSubjectSchema.partial().parse({
    ...raw,
    levels: levels.length > 0 ? levels : undefined,
    grades,
    schoolTypes,
    sortOrder: raw.sortOrder ? Number(raw.sortOrder) : undefined,
  })

  const subject = await db.catalogSubject.update({
    where: { id },
    data: validated,
  })

  revalidatePath("/catalog")
  revalidatePath(`/catalog/${id}`)
  return { success: true, subject }
}

export async function deleteCatalogSubject(id: string) {
  await requireDeveloper()

  await db.catalogSubject.delete({ where: { id } })

  revalidatePath("/catalog")
  return { success: true }
}

// ============================================================================
// CatalogChapter CRUD
// ============================================================================

export async function createCatalogChapter(data: FormData) {
  await requireDeveloper()

  const raw = Object.fromEntries(data)
  const validated = catalogChapterSchema.parse({
    ...raw,
    sequenceOrder: Number(raw.sequenceOrder) || 0,
  })

  const chapter = await db.catalogChapter.create({
    data: validated,
  })

  // Update denormalized count
  const count = await db.catalogChapter.count({
    where: { subjectId: validated.subjectId },
  })
  await db.catalogSubject.update({
    where: { id: validated.subjectId },
    data: { totalChapters: count },
  })

  revalidatePath(`/catalog/${validated.subjectId}`)
  return { success: true, chapter }
}

export async function updateCatalogChapter(id: string, data: FormData) {
  await requireDeveloper()

  const raw = Object.fromEntries(data)
  const validated = catalogChapterSchema.partial().parse({
    ...raw,
    sequenceOrder: raw.sequenceOrder ? Number(raw.sequenceOrder) : undefined,
  })

  const chapter = await db.catalogChapter.update({
    where: { id },
    data: validated,
  })

  revalidatePath(`/catalog/${chapter.subjectId}`)
  return { success: true, chapter }
}

export async function deleteCatalogChapter(id: string) {
  await requireDeveloper()

  const chapter = await db.catalogChapter.findUniqueOrThrow({
    where: { id },
    select: { subjectId: true },
  })

  await db.catalogChapter.delete({ where: { id } })

  // Update denormalized count
  const count = await db.catalogChapter.count({
    where: { subjectId: chapter.subjectId },
  })
  await db.catalogSubject.update({
    where: { id: chapter.subjectId },
    data: { totalChapters: count },
  })

  revalidatePath(`/catalog/${chapter.subjectId}`)
  return { success: true }
}

// ============================================================================
// CatalogLesson CRUD
// ============================================================================

export async function createCatalogLesson(data: FormData) {
  await requireDeveloper()

  const raw = Object.fromEntries(data)
  const validated = catalogLessonSchema.parse({
    ...raw,
    sequenceOrder: Number(raw.sequenceOrder) || 0,
    durationMinutes: raw.durationMinutes
      ? Number(raw.durationMinutes)
      : undefined,
  })

  const lesson = await db.catalogLesson.create({
    data: validated,
  })

  // Update denormalized counts
  const chapter = await db.catalogChapter.findUniqueOrThrow({
    where: { id: validated.chapterId },
    select: { subjectId: true },
  })

  const chapterLessonCount = await db.catalogLesson.count({
    where: { chapterId: validated.chapterId },
  })
  await db.catalogChapter.update({
    where: { id: validated.chapterId },
    data: { totalLessons: chapterLessonCount },
  })

  const totalLessons = await db.catalogLesson.count({
    where: { chapter: { subjectId: chapter.subjectId } },
  })
  await db.catalogSubject.update({
    where: { id: chapter.subjectId },
    data: { totalLessons },
  })

  revalidatePath(`/catalog/${chapter.subjectId}`)
  return { success: true, lesson }
}

export async function updateCatalogLesson(id: string, data: FormData) {
  await requireDeveloper()

  const raw = Object.fromEntries(data)
  const validated = catalogLessonSchema.partial().parse({
    ...raw,
    sequenceOrder: raw.sequenceOrder ? Number(raw.sequenceOrder) : undefined,
    durationMinutes: raw.durationMinutes
      ? Number(raw.durationMinutes)
      : undefined,
  })

  const lesson = await db.catalogLesson.update({
    where: { id },
    data: validated,
  })

  const chapter = await db.catalogChapter.findUniqueOrThrow({
    where: { id: lesson.chapterId },
    select: { subjectId: true },
  })

  revalidatePath(`/catalog/${chapter.subjectId}`)
  return { success: true, lesson }
}

// ============================================================================
// Reorder Actions
// ============================================================================

export async function reorderCatalogChapters(
  subjectId: string,
  chapters: { id: string; position: number }[]
) {
  await requireDeveloper()

  await db.$transaction(
    chapters.map((ch) =>
      db.catalogChapter.update({
        where: { id: ch.id, subjectId },
        data: { sequenceOrder: ch.position },
      })
    )
  )

  revalidatePath(`/catalog/${subjectId}`)
  return { success: true }
}

export async function reorderCatalogLessons(
  chapterId: string,
  lessons: { id: string; position: number }[]
) {
  await requireDeveloper()

  const chapter = await db.catalogChapter.findUniqueOrThrow({
    where: { id: chapterId },
    select: { subjectId: true },
  })

  await db.$transaction(
    lessons.map((l) =>
      db.catalogLesson.update({
        where: { id: l.id, chapterId },
        data: { sequenceOrder: l.position },
      })
    )
  )

  revalidatePath(`/catalog/${chapter.subjectId}`)
  return { success: true }
}

export async function deleteCatalogLesson(id: string) {
  await requireDeveloper()

  const lesson = await db.catalogLesson.findUniqueOrThrow({
    where: { id },
    select: {
      chapterId: true,
      chapter: { select: { subjectId: true } },
    },
  })

  await db.catalogLesson.delete({ where: { id } })

  // Update denormalized counts
  const chapterLessonCount = await db.catalogLesson.count({
    where: { chapterId: lesson.chapterId },
  })
  await db.catalogChapter.update({
    where: { id: lesson.chapterId },
    data: { totalLessons: chapterLessonCount },
  })

  const totalLessons = await db.catalogLesson.count({
    where: { chapter: { subjectId: lesson.chapter.subjectId } },
  })
  await db.catalogSubject.update({
    where: { id: lesson.chapter.subjectId },
    data: { totalLessons },
  })

  revalidatePath(`/catalog/${lesson.chapter.subjectId}`)
  return { success: true }
}

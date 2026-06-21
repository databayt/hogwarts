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
// Subject CRUD
// ============================================================================

export async function createSubject(data: FormData) {
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

  const subject = await db.subject.create({
    data: validated,
  })

  revalidatePath("/catalog")
  return { success: true, subject }
}

export async function updateSubject(id: string, data: FormData) {
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

  const subject = await db.subject.update({
    where: { id },
    data: validated,
  })

  revalidatePath("/catalog")
  revalidatePath(`/catalog/${id}`)
  return { success: true, subject }
}

export async function deleteSubject(id: string) {
  await requireDeveloper()

  await db.subject.delete({ where: { id } })

  revalidatePath("/catalog")
  return { success: true }
}

// ============================================================================
// Chapter CRUD
// ============================================================================

export async function createChapter(data: FormData) {
  await requireDeveloper()

  const raw = Object.fromEntries(data)
  const validated = catalogChapterSchema.parse({
    ...raw,
    sequenceOrder: Number(raw.sequenceOrder) || 0,
  })

  // Create + recount + denormalized write in one transaction so the count and
  // the totalChapters write commit atomically (a partial failure can no longer
  // leave the count drifted; the recount still self-heals prior drift).
  const chapter = await db.$transaction(async (tx) => {
    const created = await tx.chapter.create({ data: validated })
    const count = await tx.chapter.count({
      where: { subjectId: validated.subjectId },
    })
    await tx.subject.update({
      where: { id: validated.subjectId },
      data: { totalChapters: count },
    })
    return created
  })

  revalidatePath(`/catalog/${validated.subjectId}`)
  return { success: true, chapter }
}

export async function updateChapter(id: string, data: FormData) {
  await requireDeveloper()

  const raw = Object.fromEntries(data)
  const validated = catalogChapterSchema.partial().parse({
    ...raw,
    sequenceOrder: raw.sequenceOrder ? Number(raw.sequenceOrder) : undefined,
  })

  const chapter = await db.chapter.update({
    where: { id },
    data: validated,
  })

  revalidatePath(`/catalog/${chapter.subjectId}`)
  return { success: true, chapter }
}

export async function deleteChapter(id: string) {
  await requireDeveloper()

  const chapter = await db.chapter.findUniqueOrThrow({
    where: { id },
    select: { subjectId: true },
  })

  // Delete + recount + denormalized write atomically.
  await db.$transaction(async (tx) => {
    await tx.chapter.delete({ where: { id } })
    const count = await tx.chapter.count({
      where: { subjectId: chapter.subjectId },
    })
    await tx.subject.update({
      where: { id: chapter.subjectId },
      data: { totalChapters: count },
    })
  })

  revalidatePath(`/catalog/${chapter.subjectId}`)
  return { success: true }
}

// ============================================================================
// Lesson CRUD
// ============================================================================

export async function createLesson(data: FormData) {
  await requireDeveloper()

  const raw = Object.fromEntries(data)
  const validated = catalogLessonSchema.parse({
    ...raw,
    sequenceOrder: Number(raw.sequenceOrder) || 0,
    durationMinutes: raw.durationMinutes
      ? Number(raw.durationMinutes)
      : undefined,
  })

  // Create + recount (chapter + subject) + denormalized writes atomically.
  const { lesson, subjectId } = await db.$transaction(async (tx) => {
    const created = await tx.lesson.create({ data: validated })

    const chapter = await tx.chapter.findUniqueOrThrow({
      where: { id: validated.chapterId },
      select: { subjectId: true },
    })

    const chapterLessonCount = await tx.lesson.count({
      where: { chapterId: validated.chapterId },
    })
    await tx.chapter.update({
      where: { id: validated.chapterId },
      data: { totalLessons: chapterLessonCount },
    })

    const totalLessons = await tx.lesson.count({
      where: { chapter: { subjectId: chapter.subjectId } },
    })
    await tx.subject.update({
      where: { id: chapter.subjectId },
      data: { totalLessons },
    })

    return { lesson: created, subjectId: chapter.subjectId }
  })

  revalidatePath(`/catalog/${subjectId}`)
  return { success: true, lesson }
}

export async function updateLesson(id: string, data: FormData) {
  await requireDeveloper()

  const raw = Object.fromEntries(data)
  const validated = catalogLessonSchema.partial().parse({
    ...raw,
    sequenceOrder: raw.sequenceOrder ? Number(raw.sequenceOrder) : undefined,
    durationMinutes: raw.durationMinutes
      ? Number(raw.durationMinutes)
      : undefined,
  })

  const lesson = await db.lesson.update({
    where: { id },
    data: validated,
  })

  const chapter = await db.chapter.findUniqueOrThrow({
    where: { id: lesson.chapterId },
    select: { subjectId: true },
  })

  revalidatePath(`/catalog/${chapter.subjectId}`)
  return { success: true, lesson }
}

// ============================================================================
// Reorder Actions
// ============================================================================

export async function reorderChapters(
  subjectId: string,
  chapters: { id: string; position: number }[]
) {
  await requireDeveloper()

  await db.$transaction(
    chapters.map((ch) =>
      db.chapter.update({
        where: { id: ch.id, subjectId },
        data: { sequenceOrder: ch.position },
      })
    )
  )

  revalidatePath(`/catalog/${subjectId}`)
  return { success: true }
}

export async function reorderLessons(
  chapterId: string,
  lessons: { id: string; position: number }[]
) {
  await requireDeveloper()

  const chapter = await db.chapter.findUniqueOrThrow({
    where: { id: chapterId },
    select: { subjectId: true },
  })

  await db.$transaction(
    lessons.map((l) =>
      db.lesson.update({
        where: { id: l.id, chapterId },
        data: { sequenceOrder: l.position },
      })
    )
  )

  revalidatePath(`/catalog/${chapter.subjectId}`)
  return { success: true }
}

export async function deleteLesson(id: string) {
  await requireDeveloper()

  const lesson = await db.lesson.findUniqueOrThrow({
    where: { id },
    select: {
      chapterId: true,
      chapter: { select: { subjectId: true } },
    },
  })

  // Delete + recount (chapter + subject) + denormalized writes atomically.
  await db.$transaction(async (tx) => {
    await tx.lesson.delete({ where: { id } })

    const chapterLessonCount = await tx.lesson.count({
      where: { chapterId: lesson.chapterId },
    })
    await tx.chapter.update({
      where: { id: lesson.chapterId },
      data: { totalLessons: chapterLessonCount },
    })

    const totalLessons = await tx.lesson.count({
      where: { chapter: { subjectId: lesson.chapter.subjectId } },
    })
    await tx.subject.update({
      where: { id: lesson.chapter.subjectId },
      data: { totalLessons },
    })
  })

  revalidatePath(`/catalog/${lesson.chapter.subjectId}`)
  return { success: true }
}

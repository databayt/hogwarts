// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Supervisors — the database reads behind ./supervisors.ts and ./stage.ts.
// Not a "use server" module: every function takes the identity it acts for.
import "server-only"

import type { Prisma } from "@prisma/client"

import { db } from "@/lib/db"

import { stageOfGrade, type LiveStage } from "./stage"

type Client = Prisma.TransactionClient | typeof db

export const GRADE_STAGE_SELECT = {
  name: true,
  gradeNumber: true,
  level: { select: { name: true, level: true } },
  yearLevel: { select: { levelName: true } },
} as const

type GradeRow = {
  name: string
  gradeNumber: number
  level: { name: string; level: string } | null
  yearLevel: { levelName: string } | null
}

/** The stage of an academic grade row (see ./stage.ts). */
export function stageOfGradeRow(grade: GradeRow | null | undefined) {
  if (!grade) return null
  return stageOfGrade({
    gradeName: grade.name,
    gradeNumber: grade.gradeNumber,
    levelName: grade.level?.name,
    level: grade.level?.level,
    yearLevelName: grade.yearLevel?.levelName,
  })
}

/** The stage of a section, through its academic grade. */
export async function stageOfSection(
  schoolId: string,
  sectionId: string | null | undefined,
  client: Client = db
): Promise<LiveStage | null> {
  if (!sectionId) return null
  const section = await client.section.findFirst({
    where: { id: sectionId, schoolId },
    select: { grade: { select: GRADE_STAGE_SELECT } },
  })
  return stageOfGradeRow(section?.grade)
}

/** The stages this user supervises in this school. */
export async function supervisedStages(
  schoolId: string,
  userId: string,
  client: Client = db
): Promise<string[]> {
  const rows = await client.liveClassSupervisor.findMany({
    where: { schoolId, userId },
    select: { stage: true },
  })
  return rows.map((r) => r.stage)
}

/** Does this user supervise the stage of this section? Never throws. */
export async function supervisesSection(
  schoolId: string,
  userId: string,
  sectionId: string | null | undefined,
  client: Client = db
): Promise<boolean> {
  try {
    // The class's own supervisor: its homeroom teacher (how Al-Ibda records «مشرفة الصف»).
    if (sectionId) {
      const own = await client.section.findFirst({
        where: { id: sectionId, schoolId, homeroomTeacher: { userId } },
        select: { id: true },
      })
      if (own) return true
    }
    const stages = await supervisedStages(schoolId, userId, client)
    if (stages.length === 0) return false
    const stage = await stageOfSection(schoolId, sectionId, client)
    return !!stage && stages.includes(stage)
  } catch {
    return false
  }
}

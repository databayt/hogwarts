"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import crypto from "crypto"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import type { ClassWizardData } from "./use-class-wizard"

/** Fetch full class data for the wizard */
export async function getClassForWizard(
  classId: string
): Promise<
  { success: true; data: ClassWizardData } | { success: false; error: string }
> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return { success: false, error: "Missing school context" }

    const cls = await db.class.findFirst({
      where: { id: classId, schoolId },
      include: {
        subject: { select: { id: true, subjectName: true } },
        teacher: { select: { id: true, givenName: true, surname: true } },
        term: {
          select: {
            id: true,
            termNumber: true,
            startDate: true,
            endDate: true,
          },
        },
        startPeriod: { select: { id: true, name: true } },
        endPeriod: { select: { id: true, name: true } },
        classroom: { select: { id: true, roomName: true } },
        grade: { select: { id: true, name: true } },
        prerequisite: { select: { id: true, name: true } },
      },
    })

    if (!cls) return { success: false, error: "Class not found" }

    return {
      success: true,
      data: {
        id: cls.id,
        schoolId: cls.schoolId,
        name: cls.name,
        subjectId: cls.subjectId,
        teacherId: cls.teacherId,
        termId: cls.termId,
        startPeriodId: cls.startPeriodId,
        endPeriodId: cls.endPeriodId,
        classroomId: cls.classroomId,
        gradeId: cls.gradeId,
        courseCode: cls.courseCode,
        evaluationType: cls.evaluationType,
        credits: cls.credits ? Number(cls.credits) : null,
        minCapacity: cls.minCapacity,
        maxCapacity: cls.maxCapacity,
        duration: cls.duration,
        prerequisiteId: cls.prerequisiteId,
        wizardStep: cls.wizardStep,
        subject: cls.subject,
        teacher: cls.teacher,
        term: { id: cls.term!.id, name: `Term ${cls.term!.termNumber}` },
        startPeriod: { id: cls.startPeriod!.id, name: cls.startPeriod!.name },
        endPeriod: { id: cls.endPeriod!.id, name: cls.endPeriod!.name },
        classroom: { id: cls.classroom!.id, name: cls.classroom!.roomName },
        grade: cls.grade,
        prerequisite: cls.prerequisite,
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load class",
    }
  }
}

/** Create a draft class record to start the wizard */
export async function createDraftClass(): Promise<
  ActionResponse<{ id: string }>
> {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: "Not authenticated" }
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    // Get first available subject, teacher, term, period, and classroom as placeholders
    const [subject, teacher, term, period, classroom] = await Promise.all([
      db.subject.findFirst({ where: { schoolId }, select: { id: true } }),
      db.teacher.findFirst({ where: { schoolId }, select: { id: true } }),
      db.term.findFirst({ where: { schoolId }, select: { id: true } }),
      db.period.findFirst({ where: { schoolId }, select: { id: true } }),
      db.classroom.findFirst({ where: { schoolId }, select: { id: true } }),
    ])

    if (!subject)
      return {
        success: false,
        error: "No subjects found. Please create a subject first.",
      }
    if (!teacher)
      return {
        success: false,
        error: "No teachers found. Please create a teacher first.",
      }
    if (!term)
      return {
        success: false,
        error: "No terms found. Please set up academic terms first.",
      }
    if (!period)
      return {
        success: false,
        error: "No periods found. Please set up periods first.",
      }
    if (!classroom)
      return {
        success: false,
        error: "No classrooms found. Please create a classroom first.",
      }

    const draftName = `Draft-${crypto.randomUUID().slice(0, 8)}`

    const cls = await db.class.create({
      data: {
        schoolId,
        name: draftName,
        subjectId: subject.id,
        teacherId: teacher.id,
        termId: term.id,
        startPeriodId: period.id,
        endPeriodId: period.id,
        classroomId: classroom.id,
        wizardStep: "information",
      },
    })

    return { success: true, data: { id: cls.id } }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create class",
    }
  }
}

/** Mark the class wizard as complete */
export async function completeClassWizard(
  classId: string
): Promise<ActionResponse> {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: "Not authenticated" }
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const cls = await db.class.findFirst({
      where: { id: classId, schoolId },
      select: { name: true },
    })

    if (!cls) {
      return { success: false, error: "Class not found" }
    }

    if (cls.name.startsWith("Draft-")) {
      return {
        success: false,
        error: "Please provide a class name before completing",
      }
    }

    await db.class.updateMany({
      where: { id: classId, schoolId },
      data: { wizardStep: null },
    })

    revalidatePath("/classes")
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to complete class wizard",
    }
  }
}

/** Update the current wizard step for resumability */
export async function updateClassWizardStep(
  classId: string,
  step: string
): Promise<void> {
  try {
    const session = await auth()
    if (!session?.user) return

    const { schoolId } = await getTenantContext()
    if (!schoolId) return

    await db.class.updateMany({
      where: { id: classId, schoolId },
      data: { wizardStep: step },
    })
  } catch {
    // Non-critical, don't throw
  }
}

/** Delete an abandoned draft class */
export async function deleteDraftClass(
  classId: string
): Promise<ActionResponse> {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: "Not authenticated" }
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    // Atomic delete — only if it's still a draft
    const { count } = await db.class.deleteMany({
      where: { id: classId, schoolId, wizardStep: { not: null } },
    })

    if (count === 0) {
      return { success: false, error: "Draft class not found" }
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete draft class",
    }
  }
}

/** Get subjects for select options */
export async function getSubjectsForClass(): Promise<
  ActionResponse<{ label: string; value: string }[]>
> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return { success: false, error: "Missing school context" }

    const subjects = await db.subject.findMany({
      where: { schoolId },
      select: { id: true, subjectName: true },
      orderBy: { subjectName: "asc" },
    })

    return {
      success: true,
      data: subjects.map((s) => ({ label: s.subjectName, value: s.id })),
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load subjects",
    }
  }
}

/** Get teachers for select options */
export async function getTeachersForClass(): Promise<
  ActionResponse<{ label: string; value: string }[]>
> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return { success: false, error: "Missing school context" }

    const teachers = await db.teacher.findMany({
      where: { schoolId },
      select: { id: true, givenName: true, surname: true },
      orderBy: { givenName: "asc" },
    })

    return {
      success: true,
      data: teachers.map((t) => ({
        label: `${t.givenName} ${t.surname}`,
        value: t.id,
      })),
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load teachers",
    }
  }
}

/** Get grades for select options */
export async function getGradesForClass(): Promise<
  ActionResponse<{ label: string; value: string }[]>
> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return { success: false, error: "Missing school context" }

    const grades = await db.academicGrade.findMany({
      where: { schoolId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    })

    return {
      success: true,
      data: grades.map((g) => ({ label: g.name, value: g.id })),
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load grades",
    }
  }
}

/** Get terms for select options */
export async function getTermsForClass(): Promise<
  ActionResponse<{ label: string; value: string }[]>
> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return { success: false, error: "Missing school context" }

    const terms = await db.term.findMany({
      where: { schoolId },
      select: { id: true, termNumber: true },
      orderBy: { termNumber: "asc" },
    })

    return {
      success: true,
      data: terms.map((t) => ({ label: `Term ${t.termNumber}`, value: t.id })),
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load terms",
    }
  }
}

/** Get periods for select options */
export async function getPeriodsForClass(): Promise<
  ActionResponse<{ label: string; value: string }[]>
> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return { success: false, error: "Missing school context" }

    const periods = await db.period.findMany({
      where: { schoolId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    })

    return {
      success: true,
      data: periods.map((p) => ({ label: p.name, value: p.id })),
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load periods",
    }
  }
}

/** Get classrooms for select options */
export async function getClassroomsForClass(): Promise<
  ActionResponse<{ label: string; value: string }[]>
> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return { success: false, error: "Missing school context" }

    const classrooms = await db.classroom.findMany({
      where: { schoolId },
      select: { id: true, roomName: true },
      orderBy: { roomName: "asc" },
    })

    return {
      success: true,
      data: classrooms.map((c) => ({ label: c.roomName, value: c.id })),
    }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to load classrooms",
    }
  }
}

/** Get other classes for prerequisite select options */
export async function getClassesForPrerequisite(
  excludeClassId: string
): Promise<ActionResponse<{ label: string; value: string }[]>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return { success: false, error: "Missing school context" }

    const classes = await db.class.findMany({
      where: {
        schoolId,
        id: { not: excludeClassId },
        wizardStep: null,
      },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    })

    return {
      success: true,
      data: classes.map((c) => ({ label: c.name, value: c.id })),
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load classes",
    }
  }
}

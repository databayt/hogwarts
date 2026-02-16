"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

// ============================================================================
// Authorization helper — any authenticated teacher/admin with schoolId
// ============================================================================

async function requireContributor() {
  const session = await auth()
  const userId = session?.user?.id
  const role = session?.user?.role

  if (!userId) {
    throw new Error("Unauthorized: must be logged in")
  }

  const allowedRoles = ["TEACHER", "ADMIN", "DEVELOPER"]
  if (!role || !allowedRoles.includes(role)) {
    throw new Error("Unauthorized: TEACHER, ADMIN, or DEVELOPER role required")
  }

  const { schoolId } = await getTenantContext()
  if (!schoolId) {
    throw new Error("Missing school context")
  }

  return { userId, schoolId, session }
}

// ============================================================================
// Submit a question to the global catalog
// ============================================================================

export async function submitQuestion(data: {
  catalogSubjectId: string
  catalogChapterId?: string | null
  catalogLessonId?: string | null
  questionText: string
  questionType:
    | "MULTIPLE_CHOICE"
    | "TRUE_FALSE"
    | "SHORT_ANSWER"
    | "ESSAY"
    | "FILL_BLANK"
  difficulty: "EASY" | "MEDIUM" | "HARD"
  bloomLevel:
    | "REMEMBER"
    | "UNDERSTAND"
    | "APPLY"
    | "ANALYZE"
    | "EVALUATE"
    | "CREATE"
  points: number
  options?: unknown
  sampleAnswer?: string
  explanation?: string
  tags?: string[]
}) {
  const { userId, schoolId } = await requireContributor()

  const question = await db.catalogQuestion.create({
    data: {
      catalogSubjectId: data.catalogSubjectId,
      catalogChapterId: data.catalogChapterId ?? null,
      catalogLessonId: data.catalogLessonId ?? null,
      questionText: data.questionText,
      questionType: data.questionType,
      difficulty: data.difficulty,
      bloomLevel: data.bloomLevel,
      points: data.points,
      options: data.options ?? undefined,
      sampleAnswer: data.sampleAnswer ?? null,
      explanation: data.explanation ?? null,
      tags: data.tags ?? [],
      contributedBy: userId,
      contributedSchoolId: schoolId,
      approvalStatus: "PENDING",
      visibility: "PUBLIC",
      status: "DRAFT",
    },
  })

  revalidatePath("/subjects/catalog")
  return { success: true, id: question.id }
}

// ============================================================================
// Submit a material to the global catalog
// ============================================================================

export async function submitMaterial(data: {
  catalogSubjectId: string
  catalogChapterId?: string | null
  catalogLessonId?: string | null
  title: string
  description?: string
  type:
    | "TEXTBOOK"
    | "SYLLABUS"
    | "WORKSHEET"
    | "STUDY_GUIDE"
    | "REFERENCE"
    | "VIDEO_GUIDE"
    | "LAB_MANUAL"
    | "OTHER"
  externalUrl?: string
  tags?: string[]
}) {
  const { userId, schoolId } = await requireContributor()

  const material = await db.catalogMaterial.create({
    data: {
      catalogSubjectId: data.catalogSubjectId,
      catalogChapterId: data.catalogChapterId ?? null,
      catalogLessonId: data.catalogLessonId ?? null,
      title: data.title,
      description: data.description ?? null,
      type: data.type,
      externalUrl: data.externalUrl ?? null,
      tags: data.tags ?? [],
      contributedBy: userId,
      contributedSchoolId: schoolId,
      approvalStatus: "PENDING",
      visibility: "PUBLIC",
      status: "DRAFT",
    },
  })

  revalidatePath("/subjects/catalog")
  return { success: true, id: material.id }
}

// ============================================================================
// Submit an assignment template to the global catalog
// ============================================================================

export async function submitAssignment(data: {
  catalogSubjectId: string
  catalogChapterId?: string | null
  catalogLessonId?: string | null
  title: string
  description?: string
  instructions?: string
  rubric?: string
  totalPoints?: number
  estimatedTime?: number
  assignmentType?: string
  tags?: string[]
}) {
  const { userId, schoolId } = await requireContributor()

  const assignment = await db.catalogAssignment.create({
    data: {
      catalogSubjectId: data.catalogSubjectId,
      catalogChapterId: data.catalogChapterId ?? null,
      catalogLessonId: data.catalogLessonId ?? null,
      title: data.title,
      description: data.description ?? null,
      instructions: data.instructions ?? null,
      rubric: data.rubric ?? null,
      totalPoints: data.totalPoints ?? null,
      estimatedTime: data.estimatedTime ?? null,
      assignmentType: data.assignmentType ?? null,
      tags: data.tags ?? [],
      contributedBy: userId,
      contributedSchoolId: schoolId,
      approvalStatus: "PENDING",
      visibility: "PUBLIC",
      status: "DRAFT",
    },
  })

  revalidatePath("/subjects/catalog")
  return { success: true, id: assignment.id }
}

// ============================================================================
// Update visibility for owned content
// ============================================================================

export async function updateContributionVisibility(
  type: "question" | "material" | "assignment",
  id: string,
  visibility: "PRIVATE" | "SCHOOL" | "PUBLIC"
) {
  const { userId } = await requireContributor()

  if (type === "question") {
    const item = await db.catalogQuestion.findFirst({
      where: { id, contributedBy: userId },
    })
    if (!item) throw new Error("Question not found or not owned by you")

    await db.catalogQuestion.update({
      where: { id },
      data: { visibility },
    })
  } else if (type === "material") {
    const item = await db.catalogMaterial.findFirst({
      where: { id, contributedBy: userId },
    })
    if (!item) throw new Error("Material not found or not owned by you")

    await db.catalogMaterial.update({
      where: { id },
      data: { visibility },
    })
  } else if (type === "assignment") {
    const item = await db.catalogAssignment.findFirst({
      where: { id, contributedBy: userId },
    })
    if (!item) throw new Error("Assignment not found or not owned by you")

    await db.catalogAssignment.update({
      where: { id },
      data: { visibility },
    })
  }

  revalidatePath("/subjects/catalog")
  return { success: true }
}

// ============================================================================
// Get all contributions by the current user
// ============================================================================

export async function getMyContributions() {
  const { userId } = await requireContributor()

  const [questions, materials, assignments] = await Promise.all([
    db.catalogQuestion.findMany({
      where: { contributedBy: userId },
      include: {
        catalogSubject: { select: { id: true, name: true } },
        catalogChapter: { select: { id: true, name: true } },
        catalogLesson: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.catalogMaterial.findMany({
      where: { contributedBy: userId },
      include: {
        catalogSubject: { select: { id: true, name: true } },
        catalogChapter: { select: { id: true, name: true } },
        catalogLesson: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.catalogAssignment.findMany({
      where: { contributedBy: userId },
      include: {
        catalogSubject: { select: { id: true, name: true } },
        catalogChapter: { select: { id: true, name: true } },
        catalogLesson: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ])

  return { questions, materials, assignments }
}

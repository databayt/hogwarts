"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

import { db } from "@/lib/db"

import { catalogQuestionSchema } from "./question-validation"

// ============================================================================
// Authorization helper -- DEVELOPER only, NO schoolId
// ============================================================================

async function requireDeveloper() {
  const session = await auth()
  if (session?.user?.role !== "DEVELOPER") {
    throw new Error("Unauthorized: DEVELOPER role required")
  }
  return session
}

// ============================================================================
// CatalogQuestion CRUD
// ============================================================================

export async function createCatalogQuestion(data: FormData) {
  await requireDeveloper()

  const raw = Object.fromEntries(data)
  const tags = data.getAll("tags") as string[]

  const validated = catalogQuestionSchema.parse({
    ...raw,
    tags,
    points: raw.points ? Number(raw.points) : 1,
    options: raw.options ? JSON.parse(raw.options as string) : undefined,
  })

  const question = await db.catalogQuestion.create({
    data: validated,
  })

  revalidatePath("/catalog/questions")
  return { success: true, question }
}

export async function updateCatalogQuestion(id: string, data: FormData) {
  await requireDeveloper()

  const raw = Object.fromEntries(data)
  const tags = data.getAll("tags") as string[]

  const validated = catalogQuestionSchema.partial().parse({
    ...raw,
    tags: tags.length > 0 ? tags : undefined,
    points: raw.points ? Number(raw.points) : undefined,
    options: raw.options ? JSON.parse(raw.options as string) : undefined,
  })

  const question = await db.catalogQuestion.update({
    where: { id },
    data: validated,
  })

  revalidatePath("/catalog/questions")
  return { success: true, question }
}

export async function deleteCatalogQuestion(id: string) {
  await requireDeveloper()

  await db.catalogQuestion.delete({ where: { id } })

  revalidatePath("/catalog/questions")
  return { success: true }
}

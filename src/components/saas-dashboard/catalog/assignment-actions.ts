"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

import { db } from "@/lib/db"

import { catalogAssignmentSchema } from "./assignment-validation"

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
// CatalogAssignment CRUD
// ============================================================================

export async function createCatalogAssignment(data: FormData) {
  await requireDeveloper()

  const raw = Object.fromEntries(data)
  const tags = data.getAll("tags") as string[]

  const validated = catalogAssignmentSchema.parse({
    ...raw,
    tags,
    totalPoints: raw.totalPoints ? Number(raw.totalPoints) : undefined,
    estimatedTime: raw.estimatedTime ? Number(raw.estimatedTime) : undefined,
  })

  const assignment = await db.catalogAssignment.create({
    data: validated,
  })

  revalidatePath("/catalog/assignments")
  return { success: true, assignment }
}

export async function updateCatalogAssignment(id: string, data: FormData) {
  await requireDeveloper()

  const raw = Object.fromEntries(data)
  const tags = data.getAll("tags") as string[]

  const validated = catalogAssignmentSchema.partial().parse({
    ...raw,
    tags: tags.length > 0 ? tags : undefined,
    totalPoints: raw.totalPoints ? Number(raw.totalPoints) : undefined,
    estimatedTime: raw.estimatedTime ? Number(raw.estimatedTime) : undefined,
  })

  const assignment = await db.catalogAssignment.update({
    where: { id },
    data: validated,
  })

  revalidatePath("/catalog/assignments")
  return { success: true, assignment }
}

export async function deleteCatalogAssignment(id: string) {
  await requireDeveloper()

  await db.catalogAssignment.delete({ where: { id } })

  revalidatePath("/catalog/assignments")
  return { success: true }
}

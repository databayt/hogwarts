"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

import { db } from "@/lib/db"

import { catalogMaterialSchema } from "./material-validation"

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
// CatalogMaterial CRUD
// ============================================================================

export async function createCatalogMaterial(data: FormData) {
  await requireDeveloper()

  const raw = Object.fromEntries(data)
  const tags = data.getAll("tags") as string[]

  const validated = catalogMaterialSchema.parse({
    ...raw,
    tags,
    fileSize: raw.fileSize ? Number(raw.fileSize) : undefined,
    pageCount: raw.pageCount ? Number(raw.pageCount) : undefined,
  })

  const material = await db.catalogMaterial.create({
    data: validated,
  })

  revalidatePath("/catalog/materials")
  return { success: true, material }
}

export async function updateCatalogMaterial(id: string, data: FormData) {
  await requireDeveloper()

  const raw = Object.fromEntries(data)
  const tags = data.getAll("tags") as string[]

  const validated = catalogMaterialSchema.partial().parse({
    ...raw,
    tags: tags.length > 0 ? tags : undefined,
    fileSize: raw.fileSize ? Number(raw.fileSize) : undefined,
    pageCount: raw.pageCount ? Number(raw.pageCount) : undefined,
  })

  const material = await db.catalogMaterial.update({
    where: { id },
    data: validated,
  })

  revalidatePath("/catalog/materials")
  return { success: true, material }
}

export async function deleteCatalogMaterial(id: string) {
  await requireDeveloper()

  await db.catalogMaterial.delete({ where: { id } })

  revalidatePath("/catalog/materials")
  return { success: true }
}

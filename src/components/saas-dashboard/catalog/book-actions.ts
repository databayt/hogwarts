"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

import { db } from "@/lib/db"

import { catalogBookSchema } from "./book-validation"

// ============================================================================
// Authorization helper — DEVELOPER only, NO schoolId
// ============================================================================

async function requireDeveloper() {
  const session = await auth()
  if (session?.user?.role !== "DEVELOPER") {
    throw new Error("Unauthorized: DEVELOPER role required")
  }
  return session
}

// ============================================================================
// CatalogBook CRUD
// ============================================================================

export async function createCatalogBook(data: FormData) {
  await requireDeveloper()

  const raw = Object.fromEntries(data)
  const tags = data.getAll("tags") as string[]

  const validated = catalogBookSchema.parse({
    ...raw,
    tags: tags.length > 0 ? tags : [],
    publicationYear: raw.publicationYear
      ? Number(raw.publicationYear)
      : undefined,
    pageCount: raw.pageCount ? Number(raw.pageCount) : undefined,
    digitalFileSize: raw.digitalFileSize
      ? Number(raw.digitalFileSize)
      : undefined,
  })

  const book = await db.catalogBook.create({
    data: validated,
  })

  revalidatePath("/catalog/books")
  return { success: true, book }
}

export async function updateCatalogBook(id: string, data: FormData) {
  await requireDeveloper()

  const raw = Object.fromEntries(data)
  const tags = data.getAll("tags") as string[]

  const validated = catalogBookSchema.partial().parse({
    ...raw,
    tags: tags.length > 0 ? tags : undefined,
    publicationYear: raw.publicationYear
      ? Number(raw.publicationYear)
      : undefined,
    pageCount: raw.pageCount ? Number(raw.pageCount) : undefined,
    digitalFileSize: raw.digitalFileSize
      ? Number(raw.digitalFileSize)
      : undefined,
  })

  const book = await db.catalogBook.update({
    where: { id },
    data: validated,
  })

  revalidatePath("/catalog/books")
  revalidatePath(`/catalog/books/${id}`)
  return { success: true, book }
}

export async function deleteCatalogBook(id: string) {
  await requireDeveloper()

  await db.catalogBook.delete({ where: { id } })

  revalidatePath("/catalog/books")
  return { success: true }
}

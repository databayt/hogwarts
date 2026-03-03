"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\u0621-\u064A-]/g, "")
    .replace(/-+/g, "-")
}

export async function contributeBook(input: {
  title: string
  author: string
  isbn?: string
  genre: string
  description?: string
  summary?: string
  coverColor?: string
  coverUrl?: string
  videoUrl?: string
  gradeLevel?: string
  pageCount?: number
  publisher?: string
  publicationYear?: number
  language?: string
  catalogSubjectId?: string
  tags?: string[]
}): Promise<ActionResponse<{ bookId: string }>> {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: "Not authenticated" }
    }

    const role = session.user.role
    if (role !== "ADMIN" && role !== "TEACHER" && role !== "DEVELOPER") {
      return { success: false, error: "Unauthorized" }
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    // Basic input validation
    if (!input.title?.trim()) {
      return { success: false, error: "Title is required" }
    }
    if (!input.author?.trim()) {
      return { success: false, error: "Author is required" }
    }
    if (!input.genre?.trim()) {
      return { success: false, error: "Genre is required" }
    }

    const slug = slugify(input.title) + "-" + Date.now().toString(36)

    const book = await db.catalogBook.create({
      data: {
        title: input.title,
        slug,
        author: input.author,
        isbn: input.isbn || null,
        genre: input.genre,
        description: input.description || null,
        summary: input.summary || null,
        coverColor: input.coverColor || "#000000",
        coverUrl: input.coverUrl || null,
        videoUrl: input.videoUrl || null,
        gradeLevel: input.gradeLevel || "GENERAL",
        pageCount: input.pageCount || null,
        publisher: input.publisher || null,
        publicationYear: input.publicationYear || null,
        language: input.language || "ar",
        catalogSubjectId: input.catalogSubjectId || null,
        tags: input.tags || [],
        contributedBy: session.user.id,
        contributedSchoolId: schoolId,
        approvalStatus: "PENDING",
        status: "DRAFT",
        visibility: "PUBLIC",
      },
    })

    revalidatePath("/library/contribute")
    return { success: true, data: { bookId: book.id } }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to contribute book",
    }
  }
}

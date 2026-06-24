"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import type { DocumentTemplate, DocumentTemplateCategory } from "@prisma/client"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { detectMergeFields, loadTemplateBufferFromUrl } from "@/lib/docx-fill"
import { getTenantContext } from "@/lib/tenant-context"

const MANAGER_ROLES = ["ADMIN", "DEVELOPER", "TEACHER"]

interface CreateInput {
  category: DocumentTemplateCategory
  name: string
  description?: string
  fileUrl: string
}

/** Best-effort S3 key from a CDN/S3 url (path after the host). */
function deriveStorageKey(fileUrl: string): string {
  try {
    return new URL(fileUrl).pathname.replace(/^\//, "")
  } catch {
    return fileUrl
  }
}

export async function createDocumentTemplate(
  input: CreateInput
): Promise<ActionResponse<{ id: string; mergeFields: string[] }>> {
  try {
    const session = await auth()
    if (!session?.user) return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)

    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

    const role = session.user.role
    if (!role || !MANAGER_ROLES.includes(role)) {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    if (!input.name?.trim() || !input.fileUrl) {
      return actionError(ACTION_ERRORS.VALIDATION_ERROR)
    }

    // Best-effort field detection — a template with no detectable tags is still storable.
    let mergeFields: string[] = []
    try {
      const buffer = await loadTemplateBufferFromUrl(input.fileUrl)
      mergeFields = detectMergeFields(buffer)
    } catch {
      mergeFields = []
    }

    const tpl = await db.documentTemplate.create({
      data: {
        schoolId,
        category: input.category,
        name: input.name.trim(),
        description: input.description?.trim() || null,
        storageKey: deriveStorageKey(input.fileUrl),
        fileUrl: input.fileUrl,
        mergeFields,
        createdBy: session.user.id!,
      },
    })

    revalidatePath("/documents")
    return { success: true, data: { id: tpl.id, mergeFields } }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create template",
    }
  }
}

export async function listDocumentTemplates(
  category?: DocumentTemplateCategory
): Promise<ActionResponse<DocumentTemplate[]>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

    const templates = await db.documentTemplate.findMany({
      where: { schoolId, isActive: true, ...(category ? { category } : {}) },
      orderBy: [{ category: "asc" }, { createdAt: "desc" }],
    })

    return { success: true, data: templates }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to load templates",
    }
  }
}

export async function setDefaultTemplate(id: string): Promise<ActionResponse> {
  try {
    const session = await auth()
    if (!session?.user) return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)

    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

    const tpl = await db.documentTemplate.findFirst({
      where: { id, schoolId },
      select: { category: true },
    })
    if (!tpl) return actionError(ACTION_ERRORS.TEMPLATE_NOT_FOUND)

    await db.$transaction([
      db.documentTemplate.updateMany({
        where: { schoolId, category: tpl.category },
        data: { isDefault: false },
      }),
      db.documentTemplate.updateMany({
        where: { id, schoolId },
        data: { isDefault: true },
      }),
    ])

    revalidatePath("/documents")
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to set default",
    }
  }
}

export async function deleteDocumentTemplate(
  id: string
): Promise<ActionResponse> {
  try {
    const session = await auth()
    if (!session?.user) return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)

    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

    const role = session.user.role
    if (!role || !MANAGER_ROLES.includes(role)) {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    const { count } = await db.documentTemplate.deleteMany({
      where: { id, schoolId },
    })
    if (count === 0) return actionError(ACTION_ERRORS.TEMPLATE_NOT_FOUND)

    revalidatePath("/documents")
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete template",
    }
  }
}

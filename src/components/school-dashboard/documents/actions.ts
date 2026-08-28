"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import type { DocumentTemplate, DocumentTemplateCategory } from "@prisma/client"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import {
  loadTemplateBufferFromUrl,
  validateDocxTemplate,
  type DocxTemplateIssue,
} from "@/lib/docx-fill"
import { getTenantContext } from "@/lib/tenant-context"

import { FIELD_VOCAB } from "./field-vocab"
import { buildStarterTemplate } from "./starter-template"

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

/** What the upload UI needs to say about a template it just stored. */
export interface CreatedTemplate {
  id: string
  /** Tags found in the file. */
  mergeFields: string[]
  /** Tags this category has no data for — they fill blank. */
  unknownFields: string[]
  /** `{#x}` markers that will print as text instead of looping. */
  singleBraceMarkers: string[]
}

/**
 * The offending tag names, comma-joined, for the `details` of a rejection.
 *
 * Only the tag names travel — docxtemplater's own `explanation` is English
 * prose, and the tag is the actionable half anyway ("go fix `questions` in
 * Word"). Some ids name no single tag, so this can come back empty; the client
 * headline stands on its own in that case.
 */
function describeIssues(issues: DocxTemplateIssue[]): string | undefined {
  const tags = Array.from(new Set(issues.map((i) => i.tag).filter(Boolean)))
  return tags.length ? tags.join(", ") : undefined
}

export async function createDocumentTemplate(
  input: CreateInput
): Promise<ActionResponse<CreatedTemplate>> {
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

    // Inspect the file BEFORE storing it. A template that cannot compile is
    // refused outright: stored active it would sit in the list looking healthy
    // and fail on every single fill, and the old code reported that case as
    // "no tags found" — the opposite of what is wrong with it.
    let report
    try {
      const buffer = await loadTemplateBufferFromUrl(input.fileUrl)
      report = validateDocxTemplate(
        buffer,
        (FIELD_VOCAB[input.category] ?? []).map((f) => f.tag)
      )
    } catch {
      // Unreadable file (fetch failed, not a zip). Nothing to store.
      return actionError(ACTION_ERRORS.TEMPLATE_INVALID)
    }

    if (!report.compiles) {
      return actionError(
        ACTION_ERRORS.TEMPLATE_INVALID,
        describeIssues(report.structuralErrors)
      )
    }

    const known = new Set((FIELD_VOCAB[input.category] ?? []).map((f) => f.tag))
    const unknownFields = report.tags.filter((t) => !known.has(t))

    const tpl = await db.documentTemplate.create({
      data: {
        schoolId,
        category: input.category,
        name: input.name.trim(),
        description: input.description?.trim() || null,
        storageKey: deriveStorageKey(input.fileUrl),
        fileUrl: input.fileUrl,
        mergeFields: report.tags,
        createdBy: session.user.id!,
      },
    })

    revalidatePath("/exams/templates")
    revalidatePath("/grades/templates")
    return {
      success: true,
      data: {
        id: tpl.id,
        mergeFields: report.tags,
        unknownFields,
        singleBraceMarkers: report.singleBraceMarkers,
      },
    }
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

    revalidatePath("/exams/templates")
    revalidatePath("/grades/templates")
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

    revalidatePath("/exams/templates")
    revalidatePath("/grades/templates")
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete template",
    }
  }
}

// ============================================================================
// STARTER TEMPLATE
// ============================================================================

/**
 * Hand the school a working `.docx` for `category` — every `{{tag}}` and
 * `{{#loop}}` already correct — so the first upload is an edit of a file that
 * fills, not a guess at docxtemplater syntax.
 *
 * This is the way INTO the engine: an untagged upload fills as a silent no-op
 * (`nullGetter` returns "") and a wrongly-braced one prints its markers into the
 * finished document, and neither failure is visible until a school prints it.
 *
 * The file is built in memory per request — nothing is stored, so there is no
 * tenant data in it and only the session gate applies.
 */
export async function getStarterTemplate(
  category: DocumentTemplateCategory
): Promise<ActionResponse<{ filename: string; base64: string; mime: string }>> {
  try {
    const session = await auth()
    if (!session?.user) return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)

    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

    const school = await db.school.findUnique({
      where: { id: schoolId },
      select: { preferredLanguage: true },
    })
    const lang = school?.preferredLanguage === "en" ? "en" : "ar"

    const buffer = buildStarterTemplate(category, lang)
    if (!buffer) return actionError(ACTION_ERRORS.TEMPLATE_NOT_FOUND)

    return {
      success: true,
      data: {
        filename: `starter-${category.toLowerCase().replace(/_/g, "-")}-${lang}.docx`,
        base64: buffer.toString("base64"),
        mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      },
    }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to build starter template",
    }
  }
}

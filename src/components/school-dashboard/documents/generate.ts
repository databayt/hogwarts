"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { auth } from "@/auth"
import type { DocumentTemplateCategory } from "@prisma/client"
import JSZip from "jszip"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import {
  docxTemplateIssues,
  fillDocxTemplate,
  loadTemplateBufferFromUrl,
} from "@/lib/docx-fill"
import { getTenantContext } from "@/lib/tenant-context"

import { BULK_MAX_ENTITIES } from "./config"
import { resolveDocumentData } from "./resolvers"

const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
const ZIP_MIME = "application/zip"

// Filling a template with an arbitrary entity id is a staff operation — the
// resolver scopes by schoolId but not by requester, so gate it to the same
// roles that manage templates to avoid one student pulling another's data.
const MANAGER_ROLES = ["ADMIN", "DEVELOPER", "TEACHER"]

interface GeneratedFile {
  filename: string
  base64: string
  mime: string
}

function sanitize(s: string): string {
  return s.replace(/[^\w.\-؀-ۿ]+/g, "_").slice(0, 60) || "document"
}

/**
 * Turn a thrown fill error into a coded response.
 *
 * Uploads are screened now, but templates stored before that screening — and
 * any file edited in Word after upload — still reach `doc.render()` broken.
 * docxtemplater's wrapper error says `"Multi error"`, so returning
 * `error.message` here showed a teacher those two words and nothing else.
 */
function generateFailure(
  error: unknown,
  fallback: (typeof ACTION_ERRORS)[keyof typeof ACTION_ERRORS]
) {
  const issues = docxTemplateIssues(error)
  if (issues.length) {
    const tags = Array.from(new Set(issues.map((i) => i.tag).filter(Boolean)))
    return actionError(
      ACTION_ERRORS.TEMPLATE_INVALID,
      tags.length ? tags.join(", ") : undefined
    )
  }
  return actionError(fallback)
}

async function loadTemplate(templateId: string, schoolId: string) {
  return db.documentTemplate.findFirst({
    where: { id: templateId, schoolId, isActive: true },
  })
}

async function resolveLang(schoolId: string): Promise<"ar" | "en"> {
  const school = await db.school.findUnique({
    where: { id: schoolId },
    select: { preferredLanguage: true },
  })
  return school?.preferredLanguage === "en" ? "en" : "ar"
}

/** Fill one template for one entity → a single `.docx` (returned base64). */
export async function generateDocument(
  templateId: string,
  entityId: string
): Promise<ActionResponse<GeneratedFile>> {
  try {
    const session = await auth()
    if (!session?.user) return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)

    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

    const role = session.user.role
    if (!role || !MANAGER_ROLES.includes(role)) {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    const tpl = await loadTemplate(templateId, schoolId)
    if (!tpl) return actionError(ACTION_ERRORS.TEMPLATE_NOT_FOUND)

    const lang = await resolveLang(schoolId)
    const data = await resolveDocumentData(tpl.category, entityId, {
      schoolId,
      lang,
    })
    const buffer = await loadTemplateBufferFromUrl(tpl.fileUrl)
    const filled = fillDocxTemplate(buffer, data)

    return {
      success: true,
      data: {
        filename: `${sanitize(tpl.name)}-${sanitize(entityId)}.docx`,
        base64: filled.toString("base64"),
        mime: DOCX_MIME,
      },
    }
  } catch (error) {
    return generateFailure(error, ACTION_ERRORS.CREATE_FAILED)
  }
}

/** Shared fill loop for both bulk entry points. */
async function fillBulk(
  tpl: { name: string; category: DocumentTemplateCategory; fileUrl: string },
  entityIds: string[],
  schoolId: string
): Promise<ActionResponse<GeneratedFile>> {
  const lang = await resolveLang(schoolId)
  const buffer = await loadTemplateBufferFromUrl(tpl.fileUrl)

  const zip = new JSZip()
  let ok = 0
  let lastError: unknown
  for (const entityId of entityIds) {
    try {
      const data = await resolveDocumentData(tpl.category, entityId, {
        schoolId,
        lang,
      })
      const filled = fillDocxTemplate(buffer, data)
      const name =
        typeof data.studentName === "string" && data.studentName
          ? sanitize(data.studentName)
          : sanitize(entityId)
      // De-dupe identical names by suffixing the index.
      zip.file(`${name}-${ok + 1}.docx`, filled)
      ok++
    } catch (error) {
      // Skip an entity that fails to resolve/fill; the rest still generate.
      // Kept only to diagnose the case where NONE of them worked.
      lastError = error
    }
  }

  // A broken template fails identically for every entity, so "none succeeded"
  // is usually one bad `.docx` rather than 900 bad students — say which.
  if (ok === 0) return generateFailure(lastError, ACTION_ERRORS.CREATE_FAILED)

  const zipBuffer = await zip.generateAsync({ type: "nodebuffer" })
  return {
    success: true,
    data: {
      filename: `${sanitize(tpl.name)}-${ok}.zip`,
      base64: zipBuffer.toString("base64"),
      mime: ZIP_MIME,
    },
  }
}

/** Fill one template for many entities → a `.zip` of `.docx` files (base64). */
export async function generateDocumentsBulk(
  templateId: string,
  entityIds: string[]
): Promise<ActionResponse<GeneratedFile>> {
  try {
    const session = await auth()
    if (!session?.user) return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)

    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

    const role = session.user.role
    if (!role || !MANAGER_ROLES.includes(role)) {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    if (!entityIds.length || entityIds.length > BULK_MAX_ENTITIES) {
      return actionError(ACTION_ERRORS.VALIDATION_ERROR)
    }

    const tpl = await loadTemplate(templateId, schoolId)
    if (!tpl) return actionError(ACTION_ERRORS.TEMPLATE_NOT_FOUND)

    return fillBulk(tpl, entityIds, schoolId)
  } catch (error) {
    return generateFailure(error, ACTION_ERRORS.CREATE_FAILED)
  }
}

/**
 * Bulk sibling of `generateFromDefaultTemplate` — fills the school's default
 * (or most recently updated) active template of `category` for many entities.
 *
 * This is what makes "the school's own `.docx`" usable at school scale: without
 * it the only path was the per-row button, i.e. one click and one download per
 * student, ~900 times for a term's report cards.
 */
export async function generateFromDefaultTemplateBulk(
  category: DocumentTemplateCategory,
  entityIds: string[]
): Promise<ActionResponse<GeneratedFile>> {
  try {
    const session = await auth()
    if (!session?.user) return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)

    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

    const role = session.user.role
    if (!role || !MANAGER_ROLES.includes(role)) {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    if (!entityIds.length || entityIds.length > BULK_MAX_ENTITIES) {
      return actionError(ACTION_ERRORS.VALIDATION_ERROR)
    }

    const tpl = await db.documentTemplate.findFirst({
      where: { schoolId, category, isActive: true },
      orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
    })
    if (!tpl) return actionError(ACTION_ERRORS.TEMPLATE_NOT_FOUND)

    return fillBulk(tpl, entityIds, schoolId)
  } catch (error) {
    return generateFailure(error, ACTION_ERRORS.CREATE_FAILED)
  }
}

/**
 * Fill the school's default (or most recently updated) active template of
 * `category` for one entity — the per-domain "Generate with my template"
 * button uses this so callers never need to know a template id. Returns
 * `TEMPLATE_NOT_FOUND` when the school has not uploaded a template yet.
 */
export async function generateFromDefaultTemplate(
  category: DocumentTemplateCategory,
  entityId: string
): Promise<ActionResponse<GeneratedFile>> {
  try {
    const session = await auth()
    if (!session?.user) return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)

    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

    const role = session.user.role
    if (!role || !MANAGER_ROLES.includes(role)) {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    const tpl = await db.documentTemplate.findFirst({
      where: { schoolId, category, isActive: true },
      orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
    })
    if (!tpl) return actionError(ACTION_ERRORS.TEMPLATE_NOT_FOUND)

    const lang = await resolveLang(schoolId)
    const data = await resolveDocumentData(tpl.category, entityId, {
      schoolId,
      lang,
    })
    const buffer = await loadTemplateBufferFromUrl(tpl.fileUrl)
    const filled = fillDocxTemplate(buffer, data)

    return {
      success: true,
      data: {
        filename: `${sanitize(tpl.name)}-${sanitize(entityId)}.docx`,
        base64: filled.toString("base64"),
        mime: DOCX_MIME,
      },
    }
  } catch (error) {
    return generateFailure(error, ACTION_ERRORS.CREATE_FAILED)
  }
}

"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { auth } from "@/auth"
import type { DocumentTemplateCategory } from "@prisma/client"
import JSZip from "jszip"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { fillDocxTemplate, loadTemplateBufferFromUrl } from "@/lib/docx-fill"
import { getTenantContext } from "@/lib/tenant-context"

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
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to generate document",
    }
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

    if (!entityIds.length) return actionError(ACTION_ERRORS.VALIDATION_ERROR)

    const tpl = await loadTemplate(templateId, schoolId)
    if (!tpl) return actionError(ACTION_ERRORS.TEMPLATE_NOT_FOUND)

    const lang = await resolveLang(schoolId)
    const buffer = await loadTemplateBufferFromUrl(tpl.fileUrl)

    const zip = new JSZip()
    let ok = 0
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
      } catch {
        // Skip an entity that fails to resolve/fill; the rest still generate.
      }
    }

    if (ok === 0) return actionError(ACTION_ERRORS.CREATE_FAILED)

    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" })
    return {
      success: true,
      data: {
        filename: `${sanitize(tpl.name)}-${ok}.zip`,
        base64: zipBuffer.toString("base64"),
        mime: ZIP_MIME,
      },
    }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to generate documents",
    }
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
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to generate document",
    }
  }
}

"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"
import { after } from "next/server"
import type {
  AnnouncementPriority,
  AnnouncementScope,
  AnnouncementTemplateType,
  UserRole,
} from "@prisma/client"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import { db } from "@/lib/db"
import { prewarm } from "@/components/translation/prewarm"

import { getAllowedScopes } from "./authorization"
import { resolveContext } from "./guard"

export interface TemplateInput {
  name: string
  description?: string
  type?: AnnouncementTemplateType
  title?: string
  body?: string
  lang?: string
  scope?: AnnouncementScope
  priority?: AnnouncementPriority
  classId?: string
  role?: UserRole
}

/**
 * Only roles that may author an announcement may manage the templates used to
 * author one. `getAllowedScopes` is the single source of truth for that.
 */
function canManageTemplates(role: UserRole): boolean {
  return getAllowedScopes(role).length > 0
}

/**
 * Get all templates for the current school
 */
export async function getTemplates() {
  const ctx = await resolveContext()
  if (!ctx.ok) return { ...ctx.denied, data: [] }
  const { schoolId } = ctx.value

  try {
    const templates = await db.announcementTemplate.findMany({
      where: { schoolId },
      orderBy: [
        { isSystem: "desc" }, // System templates first
        { createdAt: "desc" }, // Then by date
      ],
      // The templates list renders these only — `body` is @db.Text and would
      // bloat the payload for nothing.
      select: {
        id: true,
        name: true,
        description: true,
        isSystem: true,
        title: true,
        scope: true,
        priority: true,
        type: true,
        createdAt: true,
      },
    })

    return { success: true, data: templates }
  } catch (error) {
    console.error("[getTemplates] Error:", error)
    return { ...actionError(ACTION_ERRORS.LOAD_FAILED), data: [] }
  }
}

/**
 * Get a single template by ID
 */
export async function getTemplate(id: string) {
  const ctx = await resolveContext()
  if (!ctx.ok) return ctx.denied
  const { schoolId } = ctx.value

  try {
    const template = await db.announcementTemplate.findFirst({
      where: { id, schoolId },
    })

    if (!template) {
      return actionError(ACTION_ERRORS.NOT_FOUND)
    }

    return { success: true, data: template }
  } catch (error) {
    console.error("[getTemplate] Error:", error)
    return actionError(ACTION_ERRORS.LOAD_FAILED)
  }
}

/**
 * Create a new template (user-created, not system)
 */
export async function createTemplate(input: TemplateInput) {
  const ctx = await resolveContext()
  if (!ctx.ok) return ctx.denied
  const { authContext, schoolId } = ctx.value

  if (!canManageTemplates(authContext.role)) {
    return actionError(ACTION_ERRORS.UNAUTHORIZED)
  }

  try {
    const template = await db.announcementTemplate.create({
      data: {
        schoolId,
        name: input.name,
        description: input.description,
        type: input.type || "custom",
        title: input.title,
        body: input.body,
        lang: input.lang || "ar",
        scope: input.scope || "school",
        priority: input.priority || "normal",
        classId: input.classId,
        role: input.role,
        isSystem: false,
        createdBy: authContext.userId,
      },
    })

    after(() => prewarm("AnnouncementTemplate", template, { schoolId }))

    revalidatePath("/announcements")
    return { success: true, data: { id: template.id } }
  } catch (error) {
    console.error("[createTemplate] Error:", error)
    // Check for unique constraint violation
    if ((error as { code?: string }).code === "P2002") {
      return actionError(ACTION_ERRORS.ALREADY_EXISTS)
    }
    return actionError(ACTION_ERRORS.CREATE_FAILED)
  }
}

/**
 * Update an existing template (only user-created)
 */
export async function updateTemplate(
  id: string,
  input: Partial<TemplateInput>
) {
  const ctx = await resolveContext()
  if (!ctx.ok) return ctx.denied
  const { authContext, schoolId } = ctx.value

  if (!canManageTemplates(authContext.role)) {
    return actionError(ACTION_ERRORS.UNAUTHORIZED)
  }

  try {
    // Scope the write itself rather than gating it on a prior read — updateMany
    // makes "exists, is ours, and is not a system template" one atomic check.
    const { count } = await db.announcementTemplate.updateMany({
      where: { id, schoolId, isSystem: false },
      data: {
        name: input.name,
        description: input.description,
        type: input.type,
        title: input.title,
        body: input.body,
        lang: input.lang,
        scope: input.scope,
        priority: input.priority,
        classId: input.classId,
        role: input.role,
      },
    })

    if (count === 0) {
      return actionError(ACTION_ERRORS.NOT_FOUND)
    }

    after(() =>
      prewarm(
        "AnnouncementTemplate",
        {
          id,
          name: input.name,
          description: input.description,
          title: input.title,
          body: input.body,
        },
        { schoolId }
      )
    )

    revalidatePath("/announcements")
    return { success: true }
  } catch (error) {
    console.error("[updateTemplate] Error:", error)
    return actionError(ACTION_ERRORS.UPDATE_FAILED)
  }
}

/**
 * Delete a template (only user-created, not system)
 */
export async function deleteTemplate(id: string) {
  const ctx = await resolveContext()
  if (!ctx.ok) return ctx.denied
  const { authContext, schoolId } = ctx.value

  if (!canManageTemplates(authContext.role)) {
    return actionError(ACTION_ERRORS.UNAUTHORIZED)
  }

  try {
    // Can only delete non-system templates
    const deleted = await db.announcementTemplate.deleteMany({
      where: { id, schoolId, isSystem: false },
    })

    if (deleted.count === 0) {
      return actionError(ACTION_ERRORS.NOT_FOUND)
    }

    revalidatePath("/announcements")
    return { success: true }
  } catch (error) {
    console.error("[deleteTemplate] Error:", error)
    return actionError(ACTION_ERRORS.DELETE_FAILED)
  }
}

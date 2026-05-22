"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Service-account API token management (Phase 4.4 follow-up).
// Lets an ADMIN mint/list/revoke geofence-webhook tokens from the settings
// page, so the webhook is usable without a manual SQL insert. The plaintext is
// shown ONCE at creation and never persisted (only prefix + bcrypt hash are).
import { revalidatePath } from "next/cache"
import { z } from "zod"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import { generateApiToken } from "@/lib/api-tokens"
import { db } from "@/lib/db"

import { requireContext, transportationRevalidatePath } from "./helpers"

const GEOFENCE_SCOPE = "transportation.geofence_boarding"

export interface ApiTokenRow {
  id: string
  name: string
  tokenPrefix: string
  scopes: string[]
  createdAt: Date
  lastUsedAt: Date | null
}

export async function listApiTokens() {
  const ctx = await requireContext("manage_settings")
  if (!ctx.ok) return ctx.response
  const { schoolId } = ctx

  try {
    const tokens = await db.schoolApiToken.findMany({
      where: { schoolId, deletedAt: null },
      select: {
        id: true,
        name: true,
        tokenPrefix: true,
        scopes: true,
        createdAt: true,
        lastUsedAt: true,
      },
      orderBy: { createdAt: "desc" },
    })
    return { success: true as const, data: tokens }
  } catch {
    return actionError(ACTION_ERRORS.LOAD_FAILED)
  }
}

const createTokenSchema = z.object({ name: z.string().min(1).max(64) })

export async function createApiToken(input: { name: string }) {
  const ctx = await requireContext("manage_settings")
  if (!ctx.ok) return ctx.response
  const { schoolId } = ctx

  const parsed = createTokenSchema.safeParse(input)
  if (!parsed.success) {
    return actionError(ACTION_ERRORS.VALIDATION_ERROR, parsed.error.message)
  }

  try {
    const { plaintext, tokenPrefix, tokenHash } = await generateApiToken()
    const token = await db.schoolApiToken.create({
      data: {
        schoolId,
        name: parsed.data.name,
        tokenHash,
        tokenPrefix,
        scopes: [GEOFENCE_SCOPE],
      },
      select: { id: true, name: true },
    })

    revalidatePath(transportationRevalidatePath("settings"))
    // `plaintext` is returned ONCE here and never stored or returned again.
    return {
      success: true as const,
      data: { id: token.id, name: token.name, plaintext },
    }
  } catch {
    return actionError(ACTION_ERRORS.API_TOKEN_CREATE_FAILED)
  }
}

export async function revokeApiToken(id: string) {
  const ctx = await requireContext("manage_settings")
  if (!ctx.ok) return ctx.response
  const { schoolId } = ctx

  try {
    const current = await db.schoolApiToken.findFirst({
      where: { id, schoolId, deletedAt: null },
      select: { id: true },
    })
    if (!current) return { success: true as const, data: { id } } // already gone — idempotent

    await db.schoolApiToken.update({
      where: { id },
      data: { deletedAt: new Date() },
    })

    revalidatePath(transportationRevalidatePath("settings"))
    return { success: true as const, data: { id } }
  } catch {
    return actionError(ACTION_ERRORS.API_TOKEN_REVOKE_FAILED)
  }
}

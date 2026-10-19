// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Who may drive the assignment wizard. Every wizard action checked sign-in
// only, so any signed-in user of the school (a student included) could create
// drafts or rewrite an assignment's information and details. One gate, the
// block's own permission matrix. A plain server module, not "use server".

import "server-only"

import { auth } from "@/auth"

import { getTenantContext } from "@/lib/tenant-context"

import {
  checkAssignmentPermission,
  getAuthContext,
  type AssignmentAction,
} from "../authorization"

export async function wizardEditor(
  action: AssignmentAction
): Promise<{ schoolId: string; userId: string } | null> {
  const [session, { schoolId }] = await Promise.all([
    auth(),
    getTenantContext(),
  ])
  const ctx = getAuthContext(session)
  if (!ctx || !schoolId) return null
  if (!checkAssignmentPermission(ctx, action, { schoolId })) return null
  return { schoolId, userId: ctx.userId }
}

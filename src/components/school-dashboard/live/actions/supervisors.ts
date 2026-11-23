"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// «مشرفو الحصص المباشرة» — who is told when a class has no teacher, per stage.
// ADMIN / DEVELOPER only (`manage_settings`); every read and write is scoped to
// the caller's school, and a person must already belong to it.
import { revalidatePath } from "next/cache"
import { z } from "zod"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import { db } from "@/lib/db"

import { isLiveStage, LIVE_STAGES } from "../stage"
import { SUPERVISOR_ROLES } from "../supervisors"
import { liveRevalidatePath, requireContext } from "./helpers"

export type SupervisorPerson = {
  userId: string
  name: string
  role: string
}
export type SupervisorsByStage = Record<
  (typeof LIVE_STAGES)[number],
  SupervisorPerson[]
>

function revalidateSettings() {
  revalidatePath(liveRevalidatePath("settings"), "page")
  revalidatePath(
    "/[lang]/s/[subdomain]/school/configuration/live-classes",
    "page"
  )
}

const stageSchema = z.string().refine(isLiveStage)
const idSchema = z.string().min(1)

function personName(u: {
  username: string | null
  email: string | null
}): string {
  return u.username || u.email || "—"
}

/** The people picked per stage. */
export async function listLiveSupervisors() {
  const ctx = await requireContext("manage_settings")
  if (!ctx.ok) return ctx.response
  const rows = await db.liveClassSupervisor.findMany({
    where: { schoolId: ctx.schoolId },
    orderBy: { createdAt: "asc" },
    take: 400,
    select: {
      stage: true,
      user: {
        select: { id: true, username: true, email: true, role: true },
      },
    },
  })
  const out = Object.fromEntries(
    LIVE_STAGES.map((s) => [s, [] as SupervisorPerson[]])
  ) as SupervisorsByStage
  for (const r of rows) {
    if (!isLiveStage(r.stage)) continue
    out[r.stage].push({
      userId: r.user.id,
      name: personName(r.user),
      role: r.user.role,
    })
  }
  return { success: true as const, data: out }
}

/** Search the school's ADMIN / STAFF / TEACHER users by name or email. */
export async function searchSupervisorCandidates(query: string) {
  const ctx = await requireContext("manage_settings")
  if (!ctx.ok) return ctx.response
  const q = (query ?? "").trim().slice(0, 60)
  if (q.length < 2) return { success: true as const, data: [] }
  const users = await db.user.findMany({
    where: {
      schoolId: ctx.schoolId,
      role: { in: [...SUPERVISOR_ROLES] },
      isSuspended: false,
      OR: [
        { username: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
      ],
    },
    orderBy: { username: "asc" },
    take: 12,
    select: { id: true, username: true, email: true, role: true },
  })
  return {
    success: true as const,
    data: users.map(
      (u): SupervisorPerson => ({
        userId: u.id,
        name: personName(u),
        role: u.role,
      })
    ),
  }
}

export async function addLiveSupervisor(stage: string, userId: string) {
  const ctx = await requireContext("manage_settings")
  if (!ctx.ok) return ctx.response
  const s = stageSchema.safeParse(stage)
  const u = idSchema.safeParse(userId)
  if (!s.success || !u.success) return actionError(ACTION_ERRORS.VALIDATION_ERROR)
  // Tenant check: the person must belong to THIS school and hold a role that
  // can supervise.
  const user = await db.user.findFirst({
    where: {
      id: u.data,
      schoolId: ctx.schoolId,
      role: { in: [...SUPERVISOR_ROLES] },
    },
    select: { id: true },
  })
  if (!user) return actionError(ACTION_ERRORS.NOT_FOUND)
  await db.liveClassSupervisor.upsert({
    where: {
      schoolId_userId_stage: {
        schoolId: ctx.schoolId,
        userId: user.id,
        stage: s.data,
      },
    },
    create: { schoolId: ctx.schoolId, userId: user.id, stage: s.data },
    update: {},
  })
  revalidateSettings()
  return { success: true as const, data: { stage: s.data, userId: user.id } }
}

export async function removeLiveSupervisor(stage: string, userId: string) {
  const ctx = await requireContext("manage_settings")
  if (!ctx.ok) return ctx.response
  const s = stageSchema.safeParse(stage)
  const u = idSchema.safeParse(userId)
  if (!s.success || !u.success) return actionError(ACTION_ERRORS.VALIDATION_ERROR)
  await db.liveClassSupervisor.deleteMany({
    where: { schoolId: ctx.schoolId, userId: u.data, stage: s.data },
  })
  revalidateSettings()
  return { success: true as const, data: { stage: s.data, userId: u.data } }
}

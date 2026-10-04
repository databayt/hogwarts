"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"
import { after } from "next/server"
import { Prisma } from "@prisma/client"
import { z } from "zod"

import { db } from "@/lib/db"
import { logger } from "@/lib/logger"

import { requireSchoolRole } from "../require-school-admin"
import { planImport } from "./engine/plan"
import {
  pendingLoginCounts,
  reissueLogins as reissue,
  runBatch,
  STALL_MS,
  undoBatch as undo,
} from "./engine/run"
import type {
  BatchDetail,
  BatchStatus,
  BatchSummary,
  ImportOptions,
  Issue,
  PreviewResult,
  ReissueResult,
  UndoResult,
} from "./engine/types"
import {
  detectBetterType,
  IMPORT_TYPES,
  missingRequired,
  suggestMapping,
  type ColumnMapping,
  type ImportType,
} from "./fields"
import { FileReadError, MAX_ROWS, readTable, type Table } from "./read-file"

/**
 * /school/bulk — upload → map → preview → run in the background → history.
 * Every action returns `{ ok: false, code }` instead of throwing, so the
 * dialog can show the reason in the admin's language.
 */

type Result<T> = ({ ok: true } & T) | { ok: false; code: string }

const typeSchema = z.enum(IMPORT_TYPES as [ImportType, ...ImportType[]])

const tableSchema = z.object({
  headers: z.array(z.string()).max(200),
  rows: z.array(z.array(z.string())).max(MAX_ROWS),
})

const mappingSchema = z.record(z.string(), z.number().int().min(0).nullable())

const optionsSchema = z.object({
  updateExisting: z.boolean(),
  createMissing: z.boolean(),
  notifyFamilies: z.boolean(),
})

async function gate() {
  try {
    return await requireSchoolRole()
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// 1. Read the file
// ---------------------------------------------------------------------------

export interface AnalyzeResult {
  fileName: string
  table: Table
  mapping: ColumnMapping
  /** Required fields no column was found for. */
  missing: string[]
  /** The file looks like another type's file. */
  betterType: ImportType | null
}

export async function analyzeImportFile(
  formData: FormData
): Promise<Result<AnalyzeResult>> {
  if (!(await gate())) return { ok: false, code: "UNAUTHORIZED" }
  const file = formData.get("file")
  const type = typeSchema.safeParse(formData.get("type"))
  if (!(file instanceof File) || !type.success)
    return { ok: false, code: "UNREADABLE_FILE" }

  try {
    const table = await readTable(file)
    const mapping = suggestMapping(type.data, table.headers)
    return {
      ok: true,
      fileName: file.name,
      table,
      mapping,
      missing: missingRequired(type.data, mapping),
      betterType: detectBetterType(type.data, table.headers),
    }
  } catch (error) {
    if (error instanceof FileReadError) return { ok: false, code: error.code }
    logger.error(
      "bulk import: analyze failed",
      error instanceof Error ? error : new Error(String(error)),
      { action: "bulk_import_analyze" }
    )
    return { ok: false, code: "UNREADABLE_FILE" }
  }
}

// ---------------------------------------------------------------------------
// 2. Preview
// ---------------------------------------------------------------------------

const planInput = z.object({
  type: typeSchema,
  table: tableSchema,
  mapping: mappingSchema,
  options: optionsSchema,
})

export async function previewImport(
  input: z.infer<typeof planInput>
): Promise<Result<PreviewResult>> {
  const auth = await gate()
  if (!auth) return { ok: false, code: "UNAUTHORIZED" }
  const parsed = planInput.safeParse(input)
  if (!parsed.success) return { ok: false, code: "INVALID_INPUT" }
  const { type, table, mapping, options } = parsed.data
  if (missingRequired(type, mapping).length)
    return { ok: false, code: "MISSING_REQUIRED" }

  const plan = await planImport(type, auth.schoolId, table, mapping, options)
  return {
    ok: true,
    counts: plan.counts,
    rows: plan.rows.map(({ row, action, name, summary, changes, issues }) => ({
      row,
      action,
      name,
      summary,
      changes,
      issues,
    })),
  }
}

// ---------------------------------------------------------------------------
// 3. Run
// ---------------------------------------------------------------------------

const startInput = planInput.extend({
  fileName: z.string().min(1).max(255),
})

export async function startImport(
  input: z.infer<typeof startInput>
): Promise<Result<{ batchId: string }>> {
  const auth = await gate()
  if (!auth) return { ok: false, code: "UNAUTHORIZED" }
  const parsed = startInput.safeParse(input)
  if (!parsed.success) return { ok: false, code: "INVALID_INPUT" }
  const { type, table, mapping, options, fileName } = parsed.data
  if (missingRequired(type, mapping).length)
    return { ok: false, code: "MISSING_REQUIRED" }

  // Re-plan on the server: the run executes what the database says now,
  // not a preview that may have gone stale.
  const plan = await planImport(type, auth.schoolId, table, mapping, options)
  const actionable = plan.rows.filter(
    (r) => r.action === "create" || r.action === "update"
  )
  const issues: Issue[] = plan.rows.flatMap((r) => r.issues)

  const batch = await db.importBatch.create({
    data: {
      schoolId: auth.schoolId,
      type,
      fileName,
      options: options as unknown as Prisma.InputJsonValue,
      payload: actionable as unknown as Prisma.InputJsonValue,
      total: actionable.length,
      skipped: plan.counts.skip,
      failed: plan.counts.error,
      issues: issues as unknown as Prisma.InputJsonValue,
      createdById: auth.userId,
      status: actionable.length ? "PENDING" : "DONE",
      finishedAt: actionable.length ? null : new Date(),
    },
    select: { id: true },
  })

  if (actionable.length) after(() => runBatch(batch.id))
  return { ok: true, batchId: batch.id }
}

/** Pick up a run whose process died mid-way (deploy, restart). */
export async function resumeImport(
  batchId: string
): Promise<Result<{ batchId: string }>> {
  const auth = await gate()
  if (!auth) return { ok: false, code: "UNAUTHORIZED" }
  const batch = await db.importBatch.findFirst({
    where: { id: batchId, schoolId: auth.schoolId },
    select: { status: true, updatedAt: true },
  })
  if (!batch) return { ok: false, code: "NOT_FOUND" }
  const stalled =
    batch.status === "RUNNING" &&
    Date.now() - batch.updatedAt.getTime() > STALL_MS
  if (batch.status !== "PENDING" && !stalled)
    return { ok: false, code: "NOT_RESUMABLE" }
  after(() => runBatch(batchId))
  return { ok: true, batchId }
}

// ---------------------------------------------------------------------------
// 4. Status + history
// ---------------------------------------------------------------------------

const summarySelect = {
  id: true,
  type: true,
  fileName: true,
  status: true,
  total: true,
  processed: true,
  created: true,
  updated: true,
  skipped: true,
  failed: true,
  createdAt: true,
  updatedAt: true,
  finishedAt: true,
  undoneAt: true,
} as const

type BatchRow = Prisma.ImportBatchGetPayload<{ select: typeof summarySelect }>

function toSummary(b: BatchRow, pendingLogins: number): BatchSummary {
  return {
    id: b.id,
    type: b.type as ImportType,
    fileName: b.fileName,
    status: b.status as BatchStatus,
    stalled:
      (b.status === "RUNNING" || b.status === "PENDING") &&
      Date.now() - b.updatedAt.getTime() > STALL_MS,
    total: b.total,
    processed: b.processed,
    created: b.created,
    updated: b.updated,
    skipped: b.skipped,
    failed: b.failed,
    createdAt: b.createdAt.toISOString(),
    finishedAt: b.finishedAt?.toISOString() ?? null,
    undoneAt: b.undoneAt?.toISOString() ?? null,
    pendingLogins,
  }
}

export async function getImportBatch(
  batchId: string
): Promise<Result<{ batch: BatchDetail }>> {
  const auth = await gate()
  if (!auth) return { ok: false, code: "UNAUTHORIZED" }
  const b = await db.importBatch.findFirst({
    where: { id: batchId, schoolId: auth.schoolId },
    select: { ...summarySelect, issues: true },
  })
  if (!b) return { ok: false, code: "NOT_FOUND" }
  const pending =
    b.status === "DONE"
      ? ((await pendingLoginCounts(auth.schoolId, [b.id])).get(b.id) ?? 0)
      : 0
  return {
    ok: true,
    batch: {
      ...toSummary(b, pending),
      issues: (b.issues as unknown as Issue[] | null) ?? [],
    },
  }
}

export async function listImportBatches(): Promise<
  Result<{ batches: BatchSummary[] }>
> {
  const auth = await gate()
  if (!auth) return { ok: false, code: "UNAUTHORIZED" }
  const rows = await db.importBatch.findMany({
    where: { schoolId: auth.schoolId },
    orderBy: { createdAt: "desc" },
    take: 30,
    select: summarySelect,
  })
  const pending = await pendingLoginCounts(
    auth.schoolId,
    rows.filter((r) => r.status === "DONE").map((r) => r.id)
  )
  return {
    ok: true,
    batches: rows.map((r) => toSummary(r, pending.get(r.id) ?? 0)),
  }
}

// ---------------------------------------------------------------------------
// 5. Logins + undo
// ---------------------------------------------------------------------------

export async function issueBatchLogins(
  batchId: string
): Promise<Result<ReissueResult>> {
  const auth = await gate()
  if (!auth) return { ok: false, code: "UNAUTHORIZED" }
  const b = await db.importBatch.findFirst({
    where: { id: batchId, schoolId: auth.schoolId },
    select: { status: true },
  })
  if (!b) return { ok: false, code: "NOT_FOUND" }
  if (b.status !== "DONE") return { ok: false, code: "NOT_FINISHED" }
  return { ok: true, ...(await reissue(auth.schoolId, batchId)) }
}

export async function undoImport(batchId: string): Promise<Result<UndoResult>> {
  const auth = await gate()
  if (!auth) return { ok: false, code: "UNAUTHORIZED" }
  const b = await db.importBatch.findFirst({
    where: { id: batchId, schoolId: auth.schoolId },
    select: { status: true, type: true },
  })
  if (!b) return { ok: false, code: "NOT_FOUND" }
  if (b.status !== "DONE") return { ok: false, code: "NOT_FINISHED" }
  const result = await undo(auth.schoolId, batchId)
  const listing: Record<string, string> = {
    students: "students",
    teachers: "teachers",
    staff: "staff",
    guardians: "parents",
  }
  revalidatePath(`/[lang]/s/[subdomain]/${listing[b.type]}`, "page")
  return { ok: true, ...result }
}

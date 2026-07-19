"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"
import { z } from "zod"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"

import { isFinanceAuthError, requireFinanceActor } from "../../guard"

// Empty string → null (inherit the country default). Rates are percentages.
const rate = z
  .union([z.literal(""), z.coerce.number().min(0).max(100)])
  .transform((v) => (v === "" ? null : v))

const schema = z.object({
  // "" clears the override; otherwise a 2-letter ISO country.
  countryOverride: z
    .union([z.literal(""), z.string().regex(/^[A-Za-z]{2}$/)])
    .transform((v) => (v ? v.toUpperCase() : null)),
  socialSecurityEmployeeRate: rate,
  socialSecurityEmployerRate: rate,
})

/** Save (upsert) a school's payroll-rule override. Any field left blank inherits
 *  the country pack. Gated by payroll:edit. */
export async function saveSchoolPayrollPolicy(
  input: unknown
): Promise<ActionResponse> {
  const ctx = await requireFinanceActor("payroll", "edit")
  if (isFinanceAuthError(ctx)) return ctx

  const parsed = schema.safeParse(input)
  if (!parsed.success) return actionError(ACTION_ERRORS.VALIDATION_ERROR)
  const data = parsed.data

  await db.schoolPayrollPolicy.upsert({
    where: { schoolId: ctx.schoolId },
    create: {
      schoolId: ctx.schoolId,
      countryOverride: data.countryOverride,
      socialSecurityEmployeeRate: data.socialSecurityEmployeeRate,
      socialSecurityEmployerRate: data.socialSecurityEmployerRate,
      updatedBy: ctx.userId,
    },
    update: {
      countryOverride: data.countryOverride,
      socialSecurityEmployeeRate: data.socialSecurityEmployeeRate,
      socialSecurityEmployerRate: data.socialSecurityEmployerRate,
      updatedBy: ctx.userId,
    },
  })

  revalidatePath("/finance/payroll/settings")
  return { success: true }
}

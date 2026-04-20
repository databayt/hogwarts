// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import "server-only"

import { cache } from "react"
import { AbilityBuilder } from "@casl/ability"
import { createPrismaAbility } from "@casl/prisma"

import { getPolicyContext, PolicyContextError } from "./context"
import { accountantRules } from "./policies/accountant"
import { adminRules } from "./policies/admin"
import { developerRules } from "./policies/developer"
import { guardianRules } from "./policies/guardian"
import { staffRules } from "./policies/staff"
import { studentRules } from "./policies/student"
import { teacherRules } from "./policies/teacher"
import { userRules } from "./policies/user"
import {
  POLICY_ERROR_CODES,
  type AppAbility,
  type AppAction,
  type AppSubjects,
  type PolicyContext,
} from "./types"

// ---------------------------------------------------------------------------
// Rule dispatcher — each role has its own rule builder. Rules are pure
// functions of PolicyContext: same input, same rule set, no DB reads, no
// side effects. This means building an Ability is cheap after the context
// is resolved, and the whole pipeline is `cache()`d per request.
// ---------------------------------------------------------------------------

type RuleBuilder = (
  ctx: PolicyContext,
  builder: AbilityBuilder<AppAbility>
) => void

const ROLE_RULES: Record<PolicyContext["role"], RuleBuilder> = {
  DEVELOPER: developerRules,
  ADMIN: adminRules,
  TEACHER: teacherRules,
  STUDENT: studentRules,
  GUARDIAN: guardianRules,
  ACCOUNTANT: accountantRules,
  STAFF: staffRules,
  USER: userRules,
}

// ---------------------------------------------------------------------------
// defineAbilityFor — the one function everything else calls. Returns a
// CASL Ability scoped to the current request's user. Cached per request,
// so server components / actions / loaders can all call it freely.
//
// Usage:
//   const ability = await defineAbilityFor()
//   if (ability.cannot("update", subject("ExamResult", row))) { ... }
//   const where = accessibleBy(ability).ExamResult
// ---------------------------------------------------------------------------

export const defineAbilityFor = cache(async (): Promise<AppAbility> => {
  const ctx = await getPolicyContext()
  return buildAbility(ctx)
})

// Pure factory — separated from defineAbilityFor so unit tests can pass
// a synthetic context without needing auth() or the database.
export function buildAbility(ctx: PolicyContext): AppAbility {
  const builder = new AbilityBuilder<AppAbility>(createPrismaAbility)
  const buildRules = ROLE_RULES[ctx.role] ?? userRules
  buildRules(ctx, builder)
  return builder.build()
}

// ---------------------------------------------------------------------------
// requireCan — drop-in guard for server actions and page components.
// Throws PolicyContextError on denial; callers translate to error codes at
// the boundary (action response / redirect).
//
// Pass the resource when ownership rules apply:
//   await requireCan("update", "ExamResult", existingResult)
//
// Omit it when checking a blanket permission (e.g., "can this role even
// try to update any ExamResult?"):
//   await requireCan("update", "ExamResult")
// ---------------------------------------------------------------------------

export async function requireCan<
  S extends Extract<AppSubjects, string> | object,
>(action: AppAction, subject: S, resource?: object): Promise<AppAbility> {
  const ability = await defineAbilityFor()
  // CASL handles both shapes: string-literal subject type or tagged object.
  // When `resource` is provided we pass it; otherwise we check the blanket type.
  // Typed as any because @casl/prisma's overload set is narrower than ours;
  // runtime behavior is identical.
  const allowed = resource
    ? (ability.can as (a: AppAction, s: unknown) => boolean)(
        action,
        resource as unknown
      )
    : (ability.can as (a: AppAction, s: unknown) => boolean)(
        action,
        subject as unknown
      )
  if (!allowed) {
    throw new PolicyContextError(POLICY_ERROR_CODES.DENIED)
  }
  return ability
}

// ---------------------------------------------------------------------------
// can / cannot — non-throwing boolean checks for conditional UI and early
// returns. Prefer requireCan() at entry points; use these inside branches.
// ---------------------------------------------------------------------------

export async function can(
  action: AppAction,
  subject: Extract<AppSubjects, string> | object,
  resource?: object
): Promise<boolean> {
  const ability = await defineAbilityFor()
  const target = (resource ?? subject) as unknown
  return (ability.can as (a: AppAction, s: unknown) => boolean)(action, target)
}

export async function cannot(
  action: AppAction,
  subject: Extract<AppSubjects, string> | object,
  resource?: object
): Promise<boolean> {
  return !(await can(action, subject, resource))
}

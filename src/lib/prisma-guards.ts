import type { PrismaClient } from "@prisma/client"

import { db } from "./db"

/**
 * Prisma Model Type Guards
 *
 * Provides type-safe access to Prisma models that may or may not exist
 * at runtime. Replaces the unsafe `(db as any).modelName` pattern.
 *
 * WHY THIS EXISTS:
 * The codebase has 181+ instances of `(db as any).model` which bypasses
 * TypeScript's multi-tenant safety verification. This utility provides
 * a type-safe alternative.
 *
 * USAGE:
 * ```typescript
 * // Before (unsafe):
 * if (!(db as any).guardian) return notFound()
 * const parent = await (db as any).guardian.findFirst({...})
 *
 * // After (type-safe):
 * const guardianModel = getModel('guardian')
 * if (!guardianModel) return notFound()
 * const parent = await guardianModel.findFirst({...})
 * ```
 */

// Type for Prisma model delegate (the object with findFirst, findMany, etc.)
type PrismaModelDelegate = {
  findFirst: (...args: any[]) => Promise<any>
  findMany: (...args: any[]) => Promise<any[]>
  findUnique: (...args: any[]) => Promise<any>
  create: (...args: any[]) => Promise<any>
  update: (...args: any[]) => Promise<any>
  updateMany: (...args: any[]) => Promise<any>
  delete: (...args: any[]) => Promise<any>
  deleteMany: (...args: any[]) => Promise<any>
  count: (...args: any[]) => Promise<number>
  aggregate: (...args: any[]) => Promise<any>
  upsert: (...args: any[]) => Promise<any>
}

// Known model names from the Prisma schema
// Add models here as they are confirmed to exist
export type KnownModelName =
  | "guardian"
  | "guardianType"
  | "guardianPhoneNumber"
  | "studentGuardian"
  | "student"
  | "studentClass"
  | "teacher"
  | "teacherPhoneNumber"
  | "teacherQualification"
  | "teacherExperience"
  | "teacherSubjectExpertise"
  | "teacherDepartment"
  | "school"
  | "class"
  | "classTeacher"
  | "subject"
  | "attendance"
  | "assignment"
  | "announcement"
  | "event"
  | "exam"
  | "grade"
  | "lesson"
  | "fee"
  | "invoice"
  | "receipt"
  | "timetableSlot"
  | "workloadConfig"
  | "user"

/**
 * Type-safe model accessor
 *
 * Checks if a model exists on the Prisma client and returns it
 * with proper typing if it does.
 *
 * @param modelName - The name of the Prisma model
 * @returns The model delegate or undefined if it doesn't exist
 *
 * @example
 * const guardianModel = getModel('guardian')
 * if (!guardianModel) return notFound()
 * const parent = await guardianModel.findFirst({ where: { id, schoolId } })
 */
export function getModel(
  modelName: KnownModelName
): PrismaModelDelegate | undefined {
  const model = (db as unknown as Record<string, unknown>)[modelName]
  if (model && typeof model === "object" && "findFirst" in model) {
    return model as PrismaModelDelegate
  }
  return undefined
}

/**
 * Type guard to check if a model exists
 *
 * @param modelName - The name of the Prisma model
 * @returns true if the model exists and is usable
 *
 * @example
 * if (!hasModel('guardian')) return notFound()
 */
export function hasModel(modelName: KnownModelName): boolean {
  return getModel(modelName) !== undefined
}

/**
 * Get model with assertion (throws if not found)
 *
 * Use this when you know the model should exist and want to
 * fail fast if it doesn't.
 *
 * @param modelName - The name of the Prisma model
 * @returns The model delegate
 * @throws Error if model doesn't exist
 *
 * @example
 * const guardianModel = getModelOrThrow('guardian')
 * const parent = await guardianModel.findFirst({ where: { id, schoolId } })
 */
export function getModelOrThrow(
  modelName: KnownModelName
): PrismaModelDelegate {
  const model = getModel(modelName)
  if (!model) {
    throw new Error(
      `Prisma model "${modelName}" not found. ` +
        `Ensure the model is defined in the Prisma schema and the client is regenerated.`
    )
  }
  return model
}

/**
 * Safe model query wrapper
 *
 * Executes a query only if the model exists, returning undefined otherwise.
 * Useful for optional features that may not be enabled.
 *
 * @param modelName - The name of the Prisma model
 * @param queryFn - Function that receives the model and executes a query
 * @returns Query result or undefined if model doesn't exist
 *
 * @example
 * const timetableSlots = await safeQuery('timetableSlot', (model) =>
 *   model.findMany({ where: { schoolId, teacherId } })
 * ) ?? []
 */
export async function safeQuery<T>(
  modelName: KnownModelName,
  queryFn: (model: PrismaModelDelegate) => Promise<T>
): Promise<T | undefined> {
  const model = getModel(modelName)
  if (!model) return undefined
  return queryFn(model)
}

/**
 * Batch check for multiple models
 *
 * @param modelNames - Array of model names to check
 * @returns Object with model names as keys and existence as values
 *
 * @example
 * const models = checkModels(['guardian', 'student', 'teacher'])
 * if (!models.guardian || !models.student) return notFound()
 */
export function checkModels<T extends KnownModelName>(
  modelNames: T[]
): Record<T, boolean> {
  return modelNames.reduce(
    (acc, name) => {
      acc[name] = hasModel(name)
      return acc
    },
    {} as Record<T, boolean>
  )
}

// Re-export db for convenience
export { db }

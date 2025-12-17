"use server"

/**
 * Form Actions
 *
 * Generic server action helpers for form submissions.
 * Provides type-safe, multi-tenant aware CRUD operations.
 *
 * @example
 * ```tsx
 * // Create a validated form action
 * const submitStudent = createFormAction(studentSchema, async (data, schoolId) => {
 *   return db.student.create({ data: { ...data, schoolId } })
 * })
 *
 * // Use in component with useActionState
 * const [state, formAction, isPending] = useActionState(submitStudent, { success: false })
 * ```
 */
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

// =============================================================================
// TYPES
// =============================================================================

/** Generic action response type */
export interface ActionResponse<T = unknown> {
  success: boolean
  data?: T
  errors?: Record<string, string[]>
  message?: string
}

/** Initial state for useActionState */
export const initialActionState: ActionResponse = {
  success: false,
}

// =============================================================================
// FORM ACTION CREATOR
// =============================================================================

/**
 * Creates a type-safe form action with validation and multi-tenant support.
 *
 * Features:
 * - Automatic authentication check
 * - schoolId injection for multi-tenant isolation
 * - Zod validation with error mapping
 * - Standardized response format
 *
 * @example
 * ```tsx
 * const createStudent = createFormAction(
 *   studentSchema,
 *   async (data, schoolId) => {
 *     return db.student.create({
 *       data: { ...data, schoolId }
 *     })
 *   }
 * )
 * ```
 */
export async function createFormAction<TInput, TOutput>(
  schema: {
    safeParse: (data: unknown) => {
      success: boolean
      data?: TInput
      error?: { issues: Array<{ path: (string | number)[]; message: string }> }
    }
  },
  handler: (data: TInput, schoolId: string) => Promise<TOutput>
) {
  return async (
    _prevState: ActionResponse<TOutput>,
    formData: FormData
  ): Promise<ActionResponse<TOutput>> => {
    // 1. Authenticate and get schoolId
    const session = await auth()
    const schoolId = session?.user?.schoolId

    if (!schoolId) {
      return { success: false, message: "Unauthorized" }
    }

    // 2. Parse FormData to object
    const rawData: Record<string, unknown> = {}
    formData.forEach((value, key) => {
      // Handle multiple values for same key (arrays)
      if (rawData[key] !== undefined) {
        if (Array.isArray(rawData[key])) {
          ;(rawData[key] as unknown[]).push(value)
        } else {
          rawData[key] = [rawData[key], value]
        }
      } else {
        rawData[key] = value
      }
    })

    // 3. Validate with Zod
    const result = schema.safeParse(rawData)

    if (!result.success) {
      const errors: Record<string, string[]> = {}
      result.error?.issues.forEach((issue) => {
        const path = issue.path.join(".")
        errors[path] = errors[path] || []
        errors[path].push(issue.message)
      })
      return { success: false, errors }
    }

    // 4. Execute handler with validated data
    try {
      const data = await handler(result.data as TInput, schoolId)
      return { success: true, data }
    } catch (error) {
      console.error("[Form Action Error]", error)
      return {
        success: false,
        message: error instanceof Error ? error.message : "An error occurred",
      }
    }
  }
}

// =============================================================================
// GENERIC CRUD HELPERS
// =============================================================================

/**
 * Generic create action helper
 *
 * @example
 * ```tsx
 * const result = await createGenericAction(
 *   db.student,
 *   { name: "John", email: "john@example.com" },
 *   schoolId,
 *   "/students"
 * )
 * ```
 */
export async function createGenericAction<T>(
  model: { create: (args: { data: Record<string, unknown> }) => Promise<T> },
  data: Record<string, unknown>,
  schoolId: string,
  revalidatePaths?: string | string[]
): Promise<ActionResponse<T>> {
  try {
    const result = await model.create({
      data: { ...data, schoolId },
    })

    // Revalidate paths if provided
    if (revalidatePaths) {
      const paths = Array.isArray(revalidatePaths)
        ? revalidatePaths
        : [revalidatePaths]
      paths.forEach((path) => revalidatePath(path))
    }

    return { success: true, data: result }
  } catch (error) {
    console.error("[Create Action Error]", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to create",
    }
  }
}

/**
 * Generic update action helper
 *
 * @example
 * ```tsx
 * const result = await updateGenericAction(
 *   db.student,
 *   "student-id-123",
 *   { name: "John Updated" },
 *   schoolId,
 *   "/students"
 * )
 * ```
 */
export async function updateGenericAction<T>(
  model: {
    update: (args: {
      where: { id: string; schoolId: string }
      data: Record<string, unknown>
    }) => Promise<T>
  },
  id: string,
  data: Record<string, unknown>,
  schoolId: string,
  revalidatePaths?: string | string[]
): Promise<ActionResponse<T>> {
  try {
    const result = await model.update({
      where: { id, schoolId },
      data,
    })

    // Revalidate paths if provided
    if (revalidatePaths) {
      const paths = Array.isArray(revalidatePaths)
        ? revalidatePaths
        : [revalidatePaths]
      paths.forEach((path) => revalidatePath(path))
    }

    return { success: true, data: result }
  } catch (error) {
    console.error("[Update Action Error]", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to update",
    }
  }
}

/**
 * Generic delete action helper
 *
 * @example
 * ```tsx
 * const result = await deleteGenericAction(
 *   db.student,
 *   "student-id-123",
 *   schoolId,
 *   "/students"
 * )
 * ```
 */
export async function deleteGenericAction(
  model: {
    delete: (args: {
      where: { id: string; schoolId: string }
    }) => Promise<unknown>
  },
  id: string,
  schoolId: string,
  revalidatePaths?: string | string[]
): Promise<ActionResponse> {
  try {
    await model.delete({
      where: { id, schoolId },
    })

    // Revalidate paths if provided
    if (revalidatePaths) {
      const paths = Array.isArray(revalidatePaths)
        ? revalidatePaths
        : [revalidatePaths]
      paths.forEach((path) => revalidatePath(path))
    }

    return { success: true }
  } catch (error) {
    console.error("[Delete Action Error]", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to delete",
    }
  }
}

/**
 * Generic find action helper (for fetching data)
 *
 * @example
 * ```tsx
 * const result = await findGenericAction(
 *   db.student,
 *   { where: { yearLevel: "10" } },
 *   schoolId
 * )
 * ```
 */
export async function findGenericAction<T>(
  model: {
    findMany: (args: {
      where: Record<string, unknown>
      orderBy?: Record<string, string>
      take?: number
      skip?: number
    }) => Promise<T[]>
  },
  args: {
    where?: Record<string, unknown>
    orderBy?: Record<string, string>
    take?: number
    skip?: number
  },
  schoolId: string
): Promise<ActionResponse<T[]>> {
  try {
    const result = await model.findMany({
      ...args,
      where: { ...args.where, schoolId },
    })

    return { success: true, data: result }
  } catch (error) {
    console.error("[Find Action Error]", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to fetch",
    }
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Maps Zod validation errors to form field errors
 *
 * @example
 * ```tsx
 * const result = schema.safeParse(data)
 * if (!result.success) {
 *   const errors = mapZodErrors(result.error.issues)
 *   form.setErrors(errors)
 * }
 * ```
 */
export async function mapZodErrors(
  issues: Array<{ path: (string | number)[]; message: string }>
): Promise<Record<string, string[]>> {
  const errors: Record<string, string[]> = {}

  issues.forEach((issue) => {
    const path = issue.path.join(".")
    errors[path] = errors[path] || []
    errors[path].push(issue.message)
  })

  return errors
}

/**
 * Creates a revalidation helper for multiple paths
 *
 * @example
 * ```tsx
 * const revalidate = createRevalidator(["/students", "/dashboard"])
 * await revalidate()
 * ```
 */
export async function createRevalidator(paths: string[]) {
  return async () => {
    paths.forEach((path) => revalidatePath(path))
  }
}

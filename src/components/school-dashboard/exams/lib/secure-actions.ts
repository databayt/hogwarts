/**
 * Secure Action Wrappers - Higher-Order Function Pattern for Permissions
 *
 * This module provides a composable permission system using HOF pattern.
 * Instead of adding permission checks to every action, wrap with these helpers.
 *
 * PATTERN:
 * 1. secureAction(permission, action, options) - Wraps action with permission check
 * 2. secureQuery(permission, resource, action) - Wraps query with permission filters
 *
 * HOW IT WORKS:
 * - Gets permission context from session (role, schoolId, userId)
 * - Validates base permission (e.g., "exam:read")
 * - Optionally extracts resourceId for resource-specific checks
 * - Optionally runs additionalCheck for complex business rules
 * - Returns error object on failure (doesn't throw)
 *
 * USAGE:
 * ```typescript
 * // Wrap a simple action
 * const securedAction = secureAction("exam:read", myAction);
 *
 * // Wrap with resource-specific check
 * const securedAction = secureAction("exam:update", myAction, {
 *   extractResourceId: (args) => args[0].examId,
 *   additionalCheck: async (ctx, args) => canModifyExam(ctx, args[0].examId)
 * });
 * ```
 *
 * WHY HOF PATTERN:
 * - DRY: Permission logic lives in one place
 * - Composable: Easy to add new permission types
 * - Type-safe: TypeScript preserves action signatures
 * - Testable: Permission logic can be unit tested separately
 */

"use server"

import {
  applyPermissionFilters,
  canAccessAnalytics,
  canAccessExam,
  canAccessStudentResult,
  canManageQuestions,
  canModifyExam,
  getPermissionContext,
  validatePermission,
  type Permission,
  type PermissionContext,
} from "./permissions"

/**
 * Wrap an action with permission check
 */
export function secureAction<T extends (...args: any[]) => Promise<any>>(
  permission: Permission,
  action: T,
  options?: {
    extractResourceId?: (args: Parameters<T>) => string | undefined
    additionalCheck?: (
      context: PermissionContext,
      args: Parameters<T>
    ) => Promise<boolean>
  }
): T {
  return (async (...args: Parameters<T>) => {
    // Get permission context
    const context = await getPermissionContext()
    if (!context) {
      return {
        success: false,
        error: "Not authenticated",
        code: "UNAUTHORIZED",
      }
    }

    // Extract resource ID if provided
    const resourceId = options?.extractResourceId?.(args)

    // Validate base permission
    const validation = await validatePermission(permission, resourceId)
    if (!validation.allowed) {
      return {
        success: false,
        error: validation.reason || "Permission denied",
        code: "FORBIDDEN",
      }
    }

    // Run additional check if provided
    if (options?.additionalCheck) {
      const additionalAllowed = await options.additionalCheck(context, args)
      if (!additionalAllowed) {
        return {
          success: false,
          error: "You do not have access to this resource",
          code: "FORBIDDEN",
        }
      }
    }

    // Execute the action
    try {
      return await action(...args)
    } catch (error) {
      console.error(`Error in secured action (${permission}):`, error)
      throw error
    }
  }) as T
}

/**
 * Wrap a query action with permission filters
 *
 * Unlike secureAction, this injects WHERE clause filters into Prisma queries.
 * This ensures users only see data they're allowed to access, even if they
 * try to query outside their scope.
 *
 * HOW IT WORKS:
 * 1. Gets permission filters based on context (e.g., { schoolId: "xxx" })
 * 2. Merges filters into the WHERE clause of the first argument
 * 3. Executes action with modified query
 *
 * CRITICAL: This prevents cross-tenant data leaks at the query level
 */
export function secureQuery<T extends (...args: any[]) => Promise<any>>(
  permission: Permission,
  resource: "exam" | "question" | "result" | "template",
  action: T
): T {
  return (async (...args: Parameters<T>) => {
    // Get permission context
    const context = await getPermissionContext()
    if (!context) {
      return {
        success: false,
        error: "Not authenticated",
        code: "UNAUTHORIZED",
      }
    }

    // Validate base permission
    const validation = await validatePermission(permission)
    if (!validation.allowed) {
      return {
        success: false,
        error: validation.reason || "Permission denied",
        code: "FORBIDDEN",
      }
    }

    // Get role-based filters (e.g., { schoolId: "xxx", teacherId: "yyy" })
    const filters = await applyPermissionFilters(context, resource)

    // Inject filters into WHERE clause of first argument
    // CRITICAL: This is what prevents cross-tenant data access
    const modifiedArgs = args.map((arg, index) => {
      // If first argument is a query object, merge filters
      if (index === 0 && typeof arg === "object" && arg !== null) {
        return {
          ...arg,
          where: {
            ...arg.where,
            ...filters, // Role-based filters override any user-provided filters
          },
        }
      }
      return arg
    }) as Parameters<T>

    // Execute the action with modified filters
    try {
      return await action(...modifiedArgs)
    } catch (error) {
      console.error(`Error in secured query (${permission}):`, error)
      throw error
    }
  }) as T
}

/**
 * Secure exam-specific actions
 */
export const secureExamAction = {
  create: <T extends (...args: any[]) => Promise<any>>(action: T) =>
    secureAction("exam:create", action),

  read: <T extends (...args: any[]) => Promise<any>>(action: T) =>
    secureAction("exam:read", action, {
      extractResourceId: (args) => {
        // Extract exam ID from first argument if it's an object with examId
        const firstArg = args[0]
        if (typeof firstArg === "object" && firstArg?.examId) {
          return firstArg.examId
        }
        if (typeof firstArg === "string") {
          return firstArg
        }
        return undefined
      },
      additionalCheck: async (context, args) => {
        const examId = args[0]?.examId || args[0]
        if (examId) {
          return canAccessExam(context, examId)
        }
        return true
      },
    }),

  update: <T extends (...args: any[]) => Promise<any>>(action: T) =>
    secureAction("exam:update", action, {
      extractResourceId: (args) => args[0]?.id || args[0],
      additionalCheck: async (context, args) => {
        const examId = args[0]?.id || args[0]
        if (examId) {
          return canModifyExam(context, examId)
        }
        return true
      },
    }),

  delete: <T extends (...args: any[]) => Promise<any>>(action: T) =>
    secureAction("exam:delete", action, {
      extractResourceId: (args) => args[0],
      additionalCheck: async (context, args) => {
        const examId = args[0]
        if (examId) {
          return canModifyExam(context, examId)
        }
        return true
      },
    }),

  publish: <T extends (...args: any[]) => Promise<any>>(action: T) =>
    secureAction("exam:publish", action, {
      extractResourceId: (args) => args[0],
      additionalCheck: async (context, args) => {
        const examId = args[0]
        if (examId) {
          return canModifyExam(context, examId)
        }
        return true
      },
    }),
}

/**
 * Secure question-specific actions
 */
export const secureQuestionAction = {
  create: <T extends (...args: any[]) => Promise<any>>(action: T) =>
    secureAction("question:create", action, {
      additionalCheck: async (context, args) => {
        const subjectId = args[0]?.subjectId
        if (subjectId) {
          return canManageQuestions(context, subjectId)
        }
        return true
      },
    }),

  read: <T extends (...args: any[]) => Promise<any>>(action: T) =>
    secureQuery("question:read", "question", action),

  update: <T extends (...args: any[]) => Promise<any>>(action: T) =>
    secureAction("question:update", action, {
      extractResourceId: (args) => args[0]?.id || args[0],
      additionalCheck: async (context, args) => {
        const subjectId = args[0]?.subjectId
        if (subjectId) {
          return canManageQuestions(context, subjectId)
        }
        return true
      },
    }),

  delete: <T extends (...args: any[]) => Promise<any>>(action: T) =>
    secureAction("question:delete", action, {
      extractResourceId: (args) => args[0],
      additionalCheck: async (ctx, args) => {
        // Check if user created the question or has admin rights
        const context = await getPermissionContext()
        if (!context) return false
        return ["DEVELOPER", "ADMIN", "TEACHER"].includes(context.userRole)
      },
    }),

  import: <T extends (...args: any[]) => Promise<any>>(action: T) =>
    secureAction("question:import", action),

  export: <T extends (...args: any[]) => Promise<any>>(action: T) =>
    secureAction("question:export", action),
}

/**
 * Secure result-specific actions
 */
export const secureResultAction = {
  create: <T extends (...args: any[]) => Promise<any>>(action: T) =>
    secureAction("result:create", action),

  read: <T extends (...args: any[]) => Promise<any>>(action: T) =>
    secureAction("result:read", action, {
      additionalCheck: async (context, args) => {
        const studentId = args[0]?.studentId
        if (studentId) {
          return canAccessStudentResult(context, studentId)
        }
        return true
      },
    }),

  update: <T extends (...args: any[]) => Promise<any>>(action: T) =>
    secureAction("result:update", action),

  delete: <T extends (...args: any[]) => Promise<any>>(action: T) =>
    secureAction("result:delete", action),

  export: <T extends (...args: any[]) => Promise<any>>(action: T) =>
    secureAction("result:export", action),

  batchGenerate: <T extends (...args: any[]) => Promise<any>>(action: T) =>
    secureAction("result:batch_generate", action),
}

/**
 * Secure marking-specific actions
 */
export const secureMarkingAction = {
  create: <T extends (...args: any[]) => Promise<any>>(action: T) =>
    secureAction("marking:create", action),

  read: <T extends (...args: any[]) => Promise<any>>(action: T) =>
    secureAction("marking:read", action),

  update: <T extends (...args: any[]) => Promise<any>>(action: T) =>
    secureAction("marking:update", action),

  override: <T extends (...args: any[]) => Promise<any>>(action: T) =>
    secureAction("marking:override", action),
}

/**
 * Secure analytics-specific actions
 */
export const secureAnalyticsAction = {
  read: <T extends (...args: any[]) => Promise<any>>(action: T) =>
    secureAction("analytics:read", action, {
      additionalCheck: async (context, args) => {
        // Determine scope from arguments
        const firstArg = args[0]
        if (!firstArg) return true

        if (firstArg.examId) {
          return canAccessExam(context, firstArg.examId)
        }

        if (firstArg.studentId) {
          return canAccessStudentResult(context, firstArg.studentId)
        }

        if (firstArg.scope && firstArg.resourceId) {
          return canAccessAnalytics(
            context,
            firstArg.scope,
            firstArg.resourceId
          )
        }

        return true
      },
    }),

  export: <T extends (...args: any[]) => Promise<any>>(action: T) =>
    secureAction("analytics:export", action),
}

/**
 * Secure template-specific actions
 */
export const secureTemplateAction = {
  create: <T extends (...args: any[]) => Promise<any>>(action: T) =>
    secureAction("template:create", action),

  read: <T extends (...args: any[]) => Promise<any>>(action: T) =>
    secureQuery("template:read", "template", action),

  update: <T extends (...args: any[]) => Promise<any>>(action: T) =>
    secureAction("template:update", action, {
      extractResourceId: (args) => args[0]?.id || args[0],
    }),

  delete: <T extends (...args: any[]) => Promise<any>>(action: T) =>
    secureAction("template:delete", action, {
      extractResourceId: (args) => args[0],
    }),
}

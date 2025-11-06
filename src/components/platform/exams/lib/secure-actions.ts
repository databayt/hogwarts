/**
 * Secure Action Wrappers
 *
 * Wraps exam actions with permission checks to ensure
 * all operations are properly authorized.
 */

"use server";

import {
  getPermissionContext,
  validatePermission,
  canAccessExam,
  canModifyExam,
  canAccessStudentResult,
  canManageQuestions,
  canAccessAnalytics,
  applyPermissionFilters,
  type Permission,
  type PermissionContext,
} from "./permissions";

/**
 * Wrap an action with permission check
 */
export function secureAction<T extends (...args: any[]) => Promise<any>>(
  permission: Permission,
  action: T,
  options?: {
    extractResourceId?: (args: Parameters<T>) => string | undefined;
    additionalCheck?: (
      context: PermissionContext,
      args: Parameters<T>
    ) => Promise<boolean>;
  }
): T {
  return (async (...args: Parameters<T>) => {
    // Get permission context
    const context = await getPermissionContext();
    if (!context) {
      return {
        success: false,
        error: "Not authenticated",
        code: "UNAUTHORIZED",
      };
    }

    // Extract resource ID if provided
    const resourceId = options?.extractResourceId?.(args);

    // Validate base permission
    const validation = await validatePermission(permission, resourceId);
    if (!validation.allowed) {
      return {
        success: false,
        error: validation.reason || "Permission denied",
        code: "FORBIDDEN",
      };
    }

    // Run additional check if provided
    if (options?.additionalCheck) {
      const additionalAllowed = await options.additionalCheck(context, args);
      if (!additionalAllowed) {
        return {
          success: false,
          error: "You do not have access to this resource",
          code: "FORBIDDEN",
        };
      }
    }

    // Execute the action
    try {
      return await action(...args);
    } catch (error) {
      console.error(`Error in secured action (${permission}):`, error);
      throw error;
    }
  }) as T;
}

/**
 * Wrap a query action with permission filters
 */
export function secureQuery<T extends (...args: any[]) => Promise<any>>(
  permission: Permission,
  resource: "exam" | "question" | "result" | "template",
  action: T
): T {
  return (async (...args: Parameters<T>) => {
    // Get permission context
    const context = await getPermissionContext();
    if (!context) {
      return {
        success: false,
        error: "Not authenticated",
        code: "UNAUTHORIZED",
      };
    }

    // Validate base permission
    const validation = await validatePermission(permission);
    if (!validation.allowed) {
      return {
        success: false,
        error: validation.reason || "Permission denied",
        code: "FORBIDDEN",
      };
    }

    // Apply permission filters
    const filters = await applyPermissionFilters(context, resource);

    // Modify the query arguments to include filters
    const modifiedArgs = args.map((arg, index) => {
      // If first argument is a query object, merge filters
      if (index === 0 && typeof arg === "object" && arg !== null) {
        return {
          ...arg,
          where: {
            ...arg.where,
            ...filters,
          },
        };
      }
      return arg;
    }) as Parameters<T>;

    // Execute the action with modified filters
    try {
      return await action(...modifiedArgs);
    } catch (error) {
      console.error(`Error in secured query (${permission}):`, error);
      throw error;
    }
  }) as T;
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
        const firstArg = args[0];
        if (typeof firstArg === "object" && firstArg?.examId) {
          return firstArg.examId;
        }
        if (typeof firstArg === "string") {
          return firstArg;
        }
        return undefined;
      },
      additionalCheck: async (context, args) => {
        const examId = args[0]?.examId || args[0];
        if (examId) {
          return canAccessExam(context, examId);
        }
        return true;
      },
    }),

  update: <T extends (...args: any[]) => Promise<any>>(action: T) =>
    secureAction("exam:update", action, {
      extractResourceId: (args) => args[0]?.id || args[0],
      additionalCheck: async (context, args) => {
        const examId = args[0]?.id || args[0];
        if (examId) {
          return canModifyExam(context, examId);
        }
        return true;
      },
    }),

  delete: <T extends (...args: any[]) => Promise<any>>(action: T) =>
    secureAction("exam:delete", action, {
      extractResourceId: (args) => args[0],
      additionalCheck: async (context, args) => {
        const examId = args[0];
        if (examId) {
          return canModifyExam(context, examId);
        }
        return true;
      },
    }),

  publish: <T extends (...args: any[]) => Promise<any>>(action: T) =>
    secureAction("exam:publish", action, {
      extractResourceId: (args) => args[0],
      additionalCheck: async (context, args) => {
        const examId = args[0];
        if (examId) {
          return canModifyExam(context, examId);
        }
        return true;
      },
    }),
};

/**
 * Secure question-specific actions
 */
export const secureQuestionAction = {
  create: <T extends (...args: any[]) => Promise<any>>(action: T) =>
    secureAction("question:create", action, {
      additionalCheck: async (context, args) => {
        const subjectId = args[0]?.subjectId;
        if (subjectId) {
          return canManageQuestions(context, subjectId);
        }
        return true;
      },
    }),

  read: <T extends (...args: any[]) => Promise<any>>(action: T) =>
    secureQuery("question:read", "question", action),

  update: <T extends (...args: any[]) => Promise<any>>(action: T) =>
    secureAction("question:update", action, {
      extractResourceId: (args) => args[0]?.id || args[0],
      additionalCheck: async (context, args) => {
        const subjectId = args[0]?.subjectId;
        if (subjectId) {
          return canManageQuestions(context, subjectId);
        }
        return true;
      },
    }),

  delete: <T extends (...args: any[]) => Promise<any>>(action: T) =>
    secureAction("question:delete", action, {
      extractResourceId: (args) => args[0],
      additionalCheck: async (ctx, args) => {
        // Check if user created the question or has admin rights
        const context = await getPermissionContext();
        if (!context) return false;
        return ["DEVELOPER", "ADMIN", "TEACHER"].includes(context.userRole);
      },
    }),

  import: <T extends (...args: any[]) => Promise<any>>(action: T) =>
    secureAction("question:import", action),

  export: <T extends (...args: any[]) => Promise<any>>(action: T) =>
    secureAction("question:export", action),
};

/**
 * Secure result-specific actions
 */
export const secureResultAction = {
  create: <T extends (...args: any[]) => Promise<any>>(action: T) =>
    secureAction("result:create", action),

  read: <T extends (...args: any[]) => Promise<any>>(action: T) =>
    secureAction("result:read", action, {
      additionalCheck: async (context, args) => {
        const studentId = args[0]?.studentId;
        if (studentId) {
          return canAccessStudentResult(context, studentId);
        }
        return true;
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
};

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
};

/**
 * Secure analytics-specific actions
 */
export const secureAnalyticsAction = {
  read: <T extends (...args: any[]) => Promise<any>>(action: T) =>
    secureAction("analytics:read", action, {
      additionalCheck: async (context, args) => {
        // Determine scope from arguments
        const firstArg = args[0];
        if (!firstArg) return true;

        if (firstArg.examId) {
          return canAccessExam(context, firstArg.examId);
        }

        if (firstArg.studentId) {
          return canAccessStudentResult(context, firstArg.studentId);
        }

        if (firstArg.scope && firstArg.resourceId) {
          return canAccessAnalytics(context, firstArg.scope, firstArg.resourceId);
        }

        return true;
      },
    }),

  export: <T extends (...args: any[]) => Promise<any>>(action: T) =>
    secureAction("analytics:export", action),
};

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
};
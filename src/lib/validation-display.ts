// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Localized validation resolver for react-hook-form.
 *
 * Wraps zodResolver to replace Zod's English error messages with
 * dictionary-driven translations on the client side. This avoids
 * refactoring 90+ validation.ts files from static schemas to factory functions.
 *
 * Usage:
 *   import { createLocalizedResolver } from "@/lib/validation-display"
 *
 *   const form = useForm({
 *     resolver: createLocalizedResolver(myZodSchema, dictionary.messages.validation),
 *   })
 *
 * How it works:
 * 1. zodResolver validates normally and produces English error messages
 * 2. This wrapper intercepts the errors and replaces known patterns with
 *    dictionary lookups (e.g., "Required" → dictionary.validation.required)
 * 3. Unknown messages pass through as-is (backward compatible)
 */

import type { zodResolver } from "@hookform/resolvers/zod"
import type { FieldErrors, FieldValues, ResolverResult } from "react-hook-form"
import type { ZodSchema } from "zod"

type ValidationDictionary = {
  required?: string
  email?: string
  minLength?: string
  maxLength?: string
  min?: string
  max?: string
  positive?: string
  url?: string
  phone?: string
  date?: string
  invalidFormat?: string
  [key: string]: string | undefined
}

/**
 * Map of Zod default English messages to dictionary keys.
 * Patterns are tested with startsWith/includes for flexibility.
 */
const MESSAGE_PATTERNS: Array<{
  test: (msg: string) => boolean
  key: keyof ValidationDictionary
  extract?: (msg: string) => Record<string, string | number>
}> = [
  {
    test: (msg) => msg === "Required" || msg === "required",
    key: "required",
  },
  {
    test: (msg) =>
      msg === "Invalid email" ||
      msg.includes("email") ||
      msg === "Valid email required",
    key: "email",
  },
  {
    test: (msg) => msg.startsWith("String must contain at least"),
    key: "minLength",
    extract: (msg) => {
      const match = msg.match(/at least (\d+)/)
      return { min: match ? Number(match[1]) : 0 }
    },
  },
  {
    test: (msg) => msg.startsWith("String must contain at most"),
    key: "maxLength",
    extract: (msg) => {
      const match = msg.match(/at most (\d+)/)
      return { max: match ? Number(match[1]) : 0 }
    },
  },
  {
    test: (msg) =>
      msg.startsWith("Number must be greater than or equal to") ||
      msg.startsWith("Must be at least"),
    key: "min",
    extract: (msg) => {
      const match = msg.match(/(\d+)/)
      return { min: match ? Number(match[1]) : 0 }
    },
  },
  {
    test: (msg) =>
      msg.startsWith("Number must be less than or equal to") ||
      msg.startsWith("Must be no more than"),
    key: "max",
    extract: (msg) => {
      const match = msg.match(/(\d+)/)
      return { max: match ? Number(match[1]) : 0 }
    },
  },
  {
    test: (msg) =>
      msg.includes("positive") || msg === "Number must be greater than 0",
    key: "positive",
  },
  {
    test: (msg) => msg === "Invalid url" || msg.includes("URL"),
    key: "url",
  },
  {
    test: (msg) => msg.includes("Invalid date"),
    key: "date",
  },
]

/**
 * Interpolate {key} placeholders in a message template.
 */
function interpolate(
  template: string,
  params?: Record<string, string | number>
): string {
  if (!params) return template
  return Object.entries(params).reduce(
    (msg, [key, value]) =>
      msg.replace(new RegExp(`\\{${key}\\}`, "g"), String(value)),
    template
  )
}

/**
 * Replace a single error message with its translated equivalent.
 */
function translateMessage(message: string, dict: ValidationDictionary): string {
  for (const pattern of MESSAGE_PATTERNS) {
    if (pattern.test(message)) {
      const translated = dict[pattern.key]
      if (translated) {
        const params = pattern.extract?.(message)
        return interpolate(translated, params)
      }
    }
  }

  // Check for exact match in dictionary (handles custom messages like "Name is required")
  // by looking for common suffixes
  if (message.endsWith("is required")) {
    return dict.required ?? message
  }

  return message
}

/**
 * Recursively translate all error messages in a FieldErrors object.
 */
function translateErrors<T extends FieldValues>(
  errors: FieldErrors<T>,
  dict: ValidationDictionary
): FieldErrors<T> {
  const translated: Record<string, unknown> = {}

  for (const [key, error] of Object.entries(errors)) {
    if (!error) continue

    if (typeof error === "object" && "message" in error) {
      translated[key] = {
        ...error,
        message:
          typeof error.message === "string"
            ? translateMessage(error.message, dict)
            : error.message,
      }
    } else if (typeof error === "object") {
      translated[key] = translateErrors(error as FieldErrors<T>, dict)
    } else {
      translated[key] = error
    }
  }

  return translated as FieldErrors<T>
}

/**
 * Creates a localized resolver that wraps zodResolver.
 *
 * @param schema - Zod schema (static, with English messages)
 * @param validationDict - Validation messages from dictionary.messages.validation
 * @param zodResolverFn - The zodResolver function (passed to avoid import issues)
 * @returns A resolver compatible with react-hook-form's useForm
 */
export function createLocalizedResolver<T extends FieldValues>(
  schema: ZodSchema,
  validationDict: ValidationDictionary | undefined,
  zodResolverFn: typeof zodResolver
): ReturnType<typeof zodResolver> {
  const baseResolver = zodResolverFn(schema)

  if (!validationDict) return baseResolver

  return async (values, context, options) => {
    const result = (await (
      baseResolver as (
        values: T,
        context: unknown,
        options: unknown
      ) => Promise<ResolverResult<T>>
    )(values, context, options)) as ResolverResult<T>

    if (Object.keys(result.errors).length > 0) {
      return {
        values: result.values,
        errors: translateErrors(result.errors, validationDict),
      }
    }

    return result
  }
}

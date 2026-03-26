// Name parsing and composition utilities for configurable name input variants.
// Schools can use "split" (first + last fields) or "full" (single field) name input.
// Prisma storage always uses firstName/middleName/lastName — only the UI changes.

export type NameFormat = "split" | "full"

/**
 * Parse a full name string into first/middle/last parts.
 * First word → firstName, last word → lastName, everything in between → middleName.
 */
export function parseFullName(fullName: string): {
  firstName: string
  middleName: string | undefined
  lastName: string
} {
  const parts = fullName.trim().split(/\s+/)
  if (parts.length === 0 || (parts.length === 1 && parts[0] === ""))
    return { firstName: "", middleName: undefined, lastName: "" }
  if (parts.length === 1)
    return { firstName: parts[0], middleName: undefined, lastName: "" }
  if (parts.length === 2)
    return { firstName: parts[0], middleName: undefined, lastName: parts[1] }
  return {
    firstName: parts[0],
    middleName: parts.slice(1, -1).join(" "),
    lastName: parts[parts.length - 1],
  }
}

/** Compose a full name from parts, filtering out empty/null values. */
export function composeFullName(
  firstName?: string | null,
  middleName?: string | null,
  lastName?: string | null
): string {
  return [firstName, middleName, lastName].filter(Boolean).join(" ")
}

/**
 * Prisma database utility functions
 */

export function takeFirstOrNull<TData>(data: TData[]): TData | null {
  return data[0] ?? null;
}

export function takeFirstOrThrow<TData>(
  data: TData[],
  errorMessage?: string
): TData {
  const first = takeFirstOrNull(data);

  if (!first) {
    throw new Error(errorMessage ?? "Item not found");
  }

  return first;
}

/**
 * Helper function to check if a field value represents "empty" data
 * Used for filtering operations
 */
export function isValueEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string" && value === "") return true;
  if (Array.isArray(value) && value.length === 0) return true;
  if (
    typeof value === "object" &&
    value !== null &&
    Object.keys(value).length === 0
  )
    return true;
  return false;
}

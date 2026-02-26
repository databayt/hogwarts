// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Utility function to handle async operations with try-catch
 * Returns a tuple with [data, error] pattern for safer error handling
 */
export async function tryCatch<T>(
  promise: Promise<T>
): Promise<{ data: T; error: null } | { data: null; error: Error }> {
  try {
    const data = await promise
    return { data, error: null }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error : new Error(String(error)),
    }
  }
}

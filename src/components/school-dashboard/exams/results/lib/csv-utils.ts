// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * CSV-safety helpers for result exports.
 *
 * Lives in a plain (non-"use server") module so it can be imported by server
 * actions AND unit-tested directly.
 */

/**
 * Escape a value for safe CSV output.
 *
 * Defends against CSV/formula injection: spreadsheet apps (Excel, Sheets,
 * LibreOffice) execute a cell whose text begins with `=`, `+`, `-`, `@`, or a
 * tab/CR. Such cells are prefixed with a single quote to neutralize them, then
 * standard CSV quoting is applied (wrap in double quotes, double any internal
 * double quotes).
 */
export function escapeCsv(value: unknown): string {
  const str = value === null || value === undefined ? "" : String(value)
  const sanitized = /^[=+\-@\t\r]/.test(str) ? `'${str}` : str
  return `"${sanitized.replace(/"/g, '""')}"`
}

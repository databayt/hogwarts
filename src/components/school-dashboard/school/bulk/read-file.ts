// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import "server-only"

import { parse } from "csv-parse/sync"
import * as XLSX from "xlsx"

/**
 * Any accepted upload → one table of strings. Header row first, empty rows
 * dropped, every cell trimmed. Replaces the old CSV-string round trip, which
 * split on "\n" and broke any cell holding a line break or a quoted comma.
 */

export const MAX_FILE_BYTES = 10 * 1024 * 1024
export const MAX_ROWS = 5000

export class FileReadError extends Error {
  constructor(
    public code:
      | "FILE_TOO_LARGE"
      | "UNSUPPORTED_FORMAT"
      | "EMPTY_FILE"
      | "TOO_MANY_ROWS"
      | "UNREADABLE_FILE"
  ) {
    super(code)
  }
}

export interface Table {
  headers: string[]
  rows: string[][]
}

function clean(table: unknown[][]): Table {
  const cells = table
    .map((r) => (r ?? []).map((c) => (c == null ? "" : String(c).trim())))
    .filter((r) => r.some((c) => c !== ""))
  if (cells.length < 2) throw new FileReadError("EMPTY_FILE")

  const headers = cells[0].map((h) => h.replace(/^﻿/, ""))
  // Drop trailing columns that have neither a header nor any value.
  let width = headers.length
  for (const r of cells) width = Math.max(width, r.length)
  while (width > 0 && !headers[width - 1] && cells.every((r) => !r[width - 1]))
    width--

  const rows = cells
    .slice(1)
    .map((r) => Array.from({ length: width }, (_, i) => r[i] ?? ""))
  if (rows.length > MAX_ROWS) throw new FileReadError("TOO_MANY_ROWS")
  return {
    headers: Array.from({ length: width }, (_, i) => headers[i] ?? ""),
    rows,
  }
}

function readCsv(text: string): Table {
  const firstLine = text.slice(0, text.indexOf("\n") >>> 0)
  // Excel in Arabic locales saves "CSV" with semicolons; tabs come from
  // copy-paste out of a spreadsheet.
  const delimiter =
    (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0)
      ? ";"
      : firstLine.includes("\t") && !firstLine.includes(",")
        ? "\t"
        : ","
  const table = parse(text, {
    bom: true,
    delimiter,
    relax_column_count: true,
    relax_quotes: true,
    skip_empty_lines: true,
  }) as string[][]
  return clean(table)
}

function readJson(text: string): Table {
  const data = JSON.parse(text) as unknown
  if (!Array.isArray(data) || data.length === 0)
    throw new FileReadError("EMPTY_FILE")
  const headers: string[] = []
  for (const row of data)
    if (row && typeof row === "object")
      for (const k of Object.keys(row))
        if (!headers.includes(k)) headers.push(k)
  return clean([
    headers,
    ...data.map((row) =>
      headers.map((h) => (row as Record<string, unknown>)?.[h] ?? "")
    ),
  ])
}

function readWorkbook(buffer: ArrayBuffer): Table {
  const workbook = XLSX.read(buffer, { type: "array", cellDates: true })
  // First sheet that actually has rows — schools often keep an empty or
  // instructions sheet in front.
  for (const name of workbook.SheetNames) {
    const sheet = workbook.Sheets[name]
    if (!sheet) continue
    const table = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
      header: 1,
      raw: false,
      dateNF: "yyyy-mm-dd",
      defval: "",
    })
    if (table.filter((r) => r.some((c) => String(c).trim())).length >= 2)
      return clean(table)
  }
  throw new FileReadError("EMPTY_FILE")
}

async function readDocx(buffer: Buffer): Promise<Table> {
  const mammoth = await import("mammoth")
  const { value: html } = await mammoth.convertToHtml({ buffer })
  const table = html.match(/<table[\s\S]*?<\/table>/i)?.[0]
  if (table) {
    const rows: string[][] = []
    for (const tr of table.match(/<tr[\s>][\s\S]*?<\/tr>/gi) ?? []) {
      rows.push(
        (tr.match(/<(?:td|th)[\s>][\s\S]*?<\/(?:td|th)>/gi) ?? []).map((c) =>
          c
            .replace(/<[^>]+>/g, "")
            .replace(/&amp;/g, "&")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&nbsp;/g, " ")
        )
      )
    }
    return clean(rows)
  }
  const { value: text } = await mammoth.extractRawText({ buffer })
  return readCsv(text)
}

export async function readTable(file: File): Promise<Table> {
  if (file.size > MAX_FILE_BYTES) throw new FileReadError("FILE_TOO_LARGE")
  const name = file.name.toLowerCase()
  try {
    if (name.endsWith(".csv") || name.endsWith(".txt"))
      return readCsv(await file.text())
    if (name.endsWith(".json")) return readJson(await file.text())
    if (name.endsWith(".xlsx") || name.endsWith(".xls"))
      return readWorkbook(await file.arrayBuffer())
    if (name.endsWith(".docx"))
      return await readDocx(Buffer.from(await file.arrayBuffer()))
  } catch (error) {
    if (error instanceof FileReadError) throw error
    throw new FileReadError("UNREADABLE_FILE")
  }
  throw new FileReadError("UNSUPPORTED_FORMAT")
}

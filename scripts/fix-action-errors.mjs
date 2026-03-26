#!/usr/bin/env node
/**
 * Fixes broken actionError patterns left by migrate-action-errors.mjs
 * Converts: { success: false, actionError(ACTION_ERRORS.X) }
 * To:       actionError(ACTION_ERRORS.X)
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from "fs"
import { join, relative } from "path"

const BASE = "src/components/school-dashboard"

function findActionFiles(dir) {
  const results = []
  try {
    const entries = readdirSync(dir)
    for (const entry of entries) {
      const full = join(dir, entry)
      const stat = statSync(full)
      if (stat.isDirectory()) {
        results.push(...findActionFiles(full))
      } else if (entry === "actions.ts") {
        results.push(full)
      }
    }
  } catch {
    // skip
  }
  return results
}

function fixFile(filePath) {
  let content = readFileSync(filePath, "utf-8")
  const original = content

  // Fix: { success: false, actionError(ACTION_ERRORS.XXX) }
  content = content.replace(
    /\{\s*success:\s*false(?:\s+as\s+const)?,\s*actionError\((ACTION_ERRORS\.[A-Z_]+)\)\s*\}/g,
    "actionError($1)"
  )

  // Fix: { success: false as const, actionError(ACTION_ERRORS.XXX) }
  content = content.replace(
    /\{\s*success:\s*false\s+as\s+const,\s*actionError\((ACTION_ERRORS\.[A-Z_]+)\)\s*\}/g,
    "actionError($1)"
  )

  // Also fix any remaining: error: actionError(ACTION_ERRORS.X) in object literals
  // Pattern: { ..., error: actionError(ACTION_ERRORS.X), ... }
  // This shouldn't exist but just in case
  content = content.replace(
    /error:\s*actionError\((ACTION_ERRORS\.[A-Z_]+)\)/g,
    "...actionError($1)"
  )

  // Fix double import lines (script may have added import when it already existed)
  const lines = content.split("\n")
  const importLine =
    'import { actionError, ACTION_ERRORS } from "@/lib/action-errors"'
  let firstFound = false
  const cleaned = lines.filter((line) => {
    if (line.trim() === importLine) {
      if (firstFound) return false
      firstFound = true
    }
    return true
  })
  content = cleaned.join("\n")

  if (content === original) return { changed: false }

  writeFileSync(filePath, content, "utf-8")
  return { changed: true }
}

const files = findActionFiles(BASE)
let fixed = 0

for (const file of files) {
  try {
    const result = fixFile(file)
    if (result.changed) {
      fixed++
      console.log(`✓ ${relative(".", file)}`)
    }
  } catch (err) {
    console.error(`✗ ${relative(".", file)}: ${err.message}`)
  }
}

console.log(`\nFixed: ${fixed} files`)

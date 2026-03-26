#!/usr/bin/env node
/**
 * Removes dictionary={dictionary} prop from page.tsx files where
 * the target content component doesn't accept it in its Props type.
 * These components use useDictionary() hook internally instead.
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from "fs"
import { join, relative } from "path"

const BASE = "src/app/[lang]/s/[subdomain]/(school-dashboard)"
const SRC = "src"

function findPageFiles(dir) {
  const results = []
  try {
    const entries = readdirSync(dir)
    for (const entry of entries) {
      const full = join(dir, entry)
      const stat = statSync(full)
      if (stat.isDirectory()) {
        results.push(...findPageFiles(full))
      } else if (entry === "page.tsx") {
        results.push(full)
      }
    }
  } catch {
    // skip
  }
  return results
}

function resolveComponentPath(importPath, pageFilePath) {
  // Convert @/ imports to relative
  if (importPath.startsWith("@/")) {
    return join(SRC, importPath.slice(2))
  }
  // Relative import
  const dir = pageFilePath.replace(/\/[^/]+$/, "")
  return join(dir, importPath)
}

function componentAcceptsDictionary(componentPath) {
  // Try .tsx and .ts extensions
  for (const ext of [".tsx", ".ts", "/index.tsx", "/index.ts"]) {
    const fullPath =
      componentPath.endsWith(".tsx") || componentPath.endsWith(".ts")
        ? componentPath
        : componentPath + ext
    try {
      const content = readFileSync(fullPath, "utf-8")
      // Check if the component's Props/interface includes dictionary
      if (
        content.includes("dictionary") &&
        (content.includes("dictionary:") || content.includes("dictionary?:"))
      ) {
        return true
      }
      return false
    } catch {
      continue
    }
  }
  return false // Can't find file, assume no
}

function fixPage(filePath) {
  let content = readFileSync(filePath, "utf-8")
  const original = content

  // Only process pages that have dictionary={dictionary}
  if (!content.includes("dictionary={dictionary}")) {
    return { changed: false }
  }

  // Find the content component import
  const importMatch = content.match(
    /import\s+(?:\{[^}]+\}|(\w+))\s+from\s+"([^"]+)"/
  )
  if (!importMatch) {
    return { changed: false }
  }

  // Find all component imports and check which accept dictionary
  const importRegex = /import\s+(?:\{\s*(\w+)\s*\}|(\w+))\s+from\s+"([^"]+)"/g
  let match
  const componentImports = []
  while ((match = importRegex.exec(content)) !== null) {
    const name = match[1] || match[2]
    const path = match[3]
    if (
      name &&
      path &&
      !path.includes("internationalization") &&
      !path.includes("next/") &&
      !path.includes("react")
    ) {
      componentImports.push({ name, path })
    }
  }

  // Check if the component that receives dictionary={dictionary} accepts it
  for (const imp of componentImports) {
    const resolved = resolveComponentPath(imp.path, filePath)
    const accepts = componentAcceptsDictionary(resolved)

    if (!accepts) {
      // Check if this component is the one receiving dictionary prop
      const propPattern = new RegExp(
        `<${imp.name}[^>]*dictionary=\\{dictionary\\}`
      )
      if (propPattern.test(content)) {
        // Remove dictionary={dictionary} prop
        content = content.replace(/\s*dictionary=\{dictionary\}\s*/g, " ")
        // Clean up double spaces
        content = content.replace(/  +/g, " ")
        // Clean up " />" -> " />"
        content = content.replace(/ {2,}\//g, " /")
      }
    }
  }

  if (content === original) {
    return { changed: false }
  }

  writeFileSync(filePath, content, "utf-8")
  return { changed: true }
}

const files = findPageFiles(BASE)
let fixed = 0

for (const file of files) {
  try {
    const result = fixPage(file)
    if (result.changed) {
      fixed++
      console.log(`✓ ${relative(".", file)}`)
    }
  } catch (err) {
    console.error(`✗ ${relative(".", file)}: ${err.message}`)
  }
}

console.log(`\nRemoved unused dictionary props from ${fixed} files`)

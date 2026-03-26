#!/usr/bin/env node
/**
 * Fixes page.tsx files missing getDictionary loading.
 * Adds import, dictionary fetch, and dictionary prop to content components.
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from "fs"
import { join, relative } from "path"

const BASE = "src/app/[lang]/s/[subdomain]/(school-dashboard)"

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

function fixPage(filePath) {
  let content = readFileSync(filePath, "utf-8")
  const original = content

  // Skip if already has getDictionary
  if (content.includes("getDictionary")) {
    return { changed: false, reason: "already has getDictionary" }
  }

  // Skip redirect-only pages (just redirect(), no JSX)
  if (content.includes("redirect(") && !content.includes("return (")) {
    // Check if it's truly a redirect-only page
    const hasJSX = /<[A-Z]/.test(content)
    if (!hasJSX) {
      return { changed: false, reason: "redirect-only page" }
    }
  }

  // Skip pages that don't render a component (pure redirect or notFound)
  if (!/<[A-Z]/.test(content) && !content.includes("return (")) {
    return { changed: false, reason: "no component rendered" }
  }

  // Step 1: Add getDictionary import
  const dictImport =
    'import { getDictionary } from "@/components/internationalization/dictionaries"'

  // Check if Locale import exists
  const hasLocaleImport =
    content.includes("type Locale") || content.includes("Locale")

  // Find the last import line to insert after
  const lines = content.split("\n")
  let lastImportIdx = -1
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith("import ") || lines[i].startsWith("import{")) {
      lastImportIdx = i
    }
    // Handle multi-line imports
    if (
      lastImportIdx >= 0 &&
      !lines[lastImportIdx].includes(" from ") &&
      lines[i].includes(" from ")
    ) {
      lastImportIdx = i
    }
  }

  if (lastImportIdx === -1) {
    return { changed: false, reason: "no imports found" }
  }

  // Add Locale import if missing
  const localeImport =
    'import { type Locale } from "@/components/internationalization/config"'
  if (!hasLocaleImport) {
    lines.splice(lastImportIdx + 1, 0, localeImport)
    lastImportIdx++
  }

  // Add getDictionary import
  lines.splice(lastImportIdx + 1, 0, dictImport)
  content = lines.join("\n")

  // Step 2: Add dictionary fetch after params destructure
  // Pattern: const { lang, ... } = await params
  // or: const { lang } = await params
  // or: const [{ lang }, ...] = await Promise.all([params, ...])

  // Find where lang is destructured
  const langDestructureMatch = content.match(
    /const\s+(?:\{[^}]*lang[^}]*\}|\[[^\]]*\{[^}]*lang[^}]*\}[^\]]*\])\s*=\s*await\s+(?:params|Promise\.all)/
  )

  if (langDestructureMatch) {
    const matchEnd =
      content.indexOf(langDestructureMatch[0]) + langDestructureMatch[0].length
    // Find the end of the statement (next newline after the match)
    let insertPos = content.indexOf("\n", matchEnd)
    if (insertPos === -1) insertPos = content.length

    // Check if it's Promise.all - if so, find the closing )
    if (langDestructureMatch[0].includes("Promise.all")) {
      // Find the matching closing paren and bracket
      let depth = 0
      let pos = content.indexOf(
        "Promise.all",
        content.indexOf(langDestructureMatch[0])
      )
      for (let i = pos; i < content.length; i++) {
        if (content[i] === "(") depth++
        if (content[i] === ")") {
          depth--
          if (depth === 0) {
            insertPos = content.indexOf("\n", i)
            break
          }
        }
      }
    } else {
      // Simple await params - find end of line
      insertPos = content.indexOf(
        "\n",
        content.indexOf(langDestructureMatch[0])
      )
    }

    // Insert dictionary fetch
    const indent = "  "
    const dictLine = `${indent}const dictionary = await getDictionary(lang)`
    content =
      content.slice(0, insertPos) + "\n" + dictLine + content.slice(insertPos)
  } else {
    // No lang destructure found - check for just `await params` with no destructure
    const awaitParamsMatch = content.match(/await\s+params\b/)
    if (awaitParamsMatch) {
      // Replace `await params` with proper destructure
      // Find the line
      const paramsLineIdx = content.indexOf(awaitParamsMatch[0])
      const lineStart = content.lastIndexOf("\n", paramsLineIdx) + 1
      const lineEnd = content.indexOf("\n", paramsLineIdx)
      const line = content.slice(lineStart, lineEnd)

      if (line.trim() === "await params") {
        // Replace bare `await params` with destructured version
        content =
          content.slice(0, lineStart) +
          "  const { lang } = await params\n" +
          "  const dictionary = await getDictionary(lang)" +
          content.slice(lineEnd)
      } else {
        // Has some other pattern - just add after the line
        content =
          content.slice(0, lineEnd) +
          "\n  const { lang } = await params\n  const dictionary = await getDictionary(lang)" +
          content.slice(lineEnd)
      }
    } else {
      // No params handling at all - can't auto-fix
      return { changed: false, reason: "no params handling found" }
    }
  }

  // Step 3: Add dictionary prop to content component
  // Find JSX component renders: <ComponentName ... />
  // Add dictionary={dictionary} prop

  // Match self-closing component tags and opening tags
  const componentPattern = /<([A-Z][A-Za-z]+)(\s[^>]*)?\s*\/?>/g
  let match
  let modified = false

  while ((match = componentPattern.exec(content)) !== null) {
    const fullMatch = match[0]
    const componentName = match[1]

    // Skip common non-content components
    const skipComponents = [
      "Suspense",
      "Metadata",
      "Card",
      "Button",
      "PageHeadingSetter",
      "PageNav",
      "Tabs",
      "TabsContent",
      "TabsList",
      "TabsTrigger",
      "AttendanceProvider",
      "Separator",
      "div",
      "p",
      "h1",
      "h2",
      "span",
    ]
    if (skipComponents.includes(componentName)) continue

    // Skip if already has dictionary prop
    if (fullMatch.includes("dictionary=") || fullMatch.includes("dictionary "))
      continue

    // Check if this looks like a content component (usually the main one)
    const isContent =
      componentName.toLowerCase().includes("content") ||
      componentName.toLowerCase().includes("table") ||
      componentName.toLowerCase().includes("form") ||
      componentName.toLowerCase().includes("client") ||
      componentName.toLowerCase().includes("dashboard") ||
      componentName.toLowerCase().includes("list")

    if (
      !isContent &&
      !fullMatch.includes("locale=") &&
      !fullMatch.includes("lang=")
    )
      continue

    // Add dictionary prop
    const insertPoint =
      content.indexOf(fullMatch) +
      fullMatch.indexOf(componentName) +
      componentName.length

    // Check if self-closing or has props
    if (fullMatch.includes("/>")) {
      // Self-closing: <Component /> -> <Component dictionary={dictionary} />
      if (match[2]) {
        // Has existing props: add after last prop
        const closingIdx = content.indexOf("/>", content.indexOf(fullMatch))
        content =
          content.slice(0, closingIdx) +
          " dictionary={dictionary} " +
          content.slice(closingIdx)
      } else {
        // No props: <Component /> -> <Component dictionary={dictionary} />
        const closingIdx = content.indexOf("/>", content.indexOf(fullMatch))
        content =
          content.slice(0, closingIdx) +
          "dictionary={dictionary} " +
          content.slice(closingIdx)
      }
      modified = true
      break // Only modify the main content component
    } else {
      // Opening tag: <Component> -> <Component dictionary={dictionary}>
      const closingBracket = content.indexOf(
        ">",
        content.indexOf(fullMatch) + componentName.length
      )
      content =
        content.slice(0, closingBracket) +
        " dictionary={dictionary}" +
        content.slice(closingBracket)
      modified = true
      break // Only modify the main content component
    }
  }

  if (content === original) {
    return { changed: false, reason: "no changes needed" }
  }

  writeFileSync(filePath, content, "utf-8")
  return { changed: true, modified }
}

const files = findPageFiles(BASE)
let fixed = 0
let skipped = 0
const failures = []

console.log(`Found ${files.length} page.tsx files\n`)

for (const file of files) {
  try {
    const result = fixPage(file)
    if (result.changed) {
      fixed++
      console.log(`✓ ${relative(".", file)}`)
    } else {
      skipped++
      if (result.reason !== "already has getDictionary") {
        console.log(`⊘ ${relative(".", file)} (${result.reason})`)
      }
    }
  } catch (err) {
    failures.push({ file: relative(".", file), error: err.message })
    console.error(`✗ ${relative(".", file)}: ${err.message}`)
  }
}

console.log(
  `\nFixed: ${fixed} | Skipped: ${skipped} | Failures: ${failures.length}`
)
if (failures.length > 0) {
  console.log("\nFailures:")
  for (const f of failures) {
    console.log(`  ${f.file}: ${f.error}`)
  }
}

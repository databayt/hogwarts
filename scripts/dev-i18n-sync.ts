// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Sync i18n translation keys between Arabic and English.
 * Run: npx tsx scripts/dev-i18n-sync.ts [--check|--fix|--verify]
 *
 * The comparison engine lives in
 * `src/components/internationalization/lib/parity.ts` (shared with the
 * vitest guard `src/tests/i18n/dictionary-parity.test.ts`) — this script
 * is just the CLI shell: pretty printing, exit codes, and --fix scaffolding.
 */
import { readFileSync, writeFileSync } from "fs"
import { join } from "path"
import chalk from "chalk"
import { Command } from "commander"

import {
  checkDictionaryParity,
  DEFAULT_I18N_ROOT,
  findUntranslatedPlaceholders,
  type DictionaryPairReport,
} from "../src/components/internationalization/lib/parity"

const program = new Command()
program
  .option("--fix", "Add missing keys with placeholder text")
  .option("--verify", "Only verify, don't modify files")
  .option("--check", "CI mode: exit 1 if any missing keys or placeholders")
  .parse()

const options = program.opts()

function getNestedValue(obj: unknown, path: string): unknown {
  return path
    .split(".")
    .reduce<unknown>(
      (current, key) => (current as Record<string, unknown>)?.[key],
      obj
    )
}

function setNestedValue(
  obj: Record<string, unknown>,
  path: string,
  value: unknown
): void {
  const keys = path.split(".")
  const lastKey = keys.pop()!
  const target = keys.reduce((current, key) => {
    if (!current[key]) current[key] = {}
    return current[key] as Record<string, unknown>
  }, obj)
  target[lastKey] = value
}

/** Resolve the on-disk path of one side of a pair. */
function pairPath(pair: DictionaryPairReport, lang: "ar" | "en"): string {
  const file = lang === "ar" ? pair.arFile : pair.enFile
  return pair.topLevel
    ? join(DEFAULT_I18N_ROOT, file)
    : join(DEFAULT_I18N_ROOT, "dictionaries", lang, file)
}

function fixPair(pair: DictionaryPairReport): number {
  let added = 0
  for (const missingLang of ["ar", "en"] as const) {
    const missing =
      missingLang === "ar" ? pair.diff.missingInAr : pair.diff.missingInEn
    if (missing.length === 0) continue

    const sourceLang = missingLang === "ar" ? "en" : "ar"
    const sourceContent = JSON.parse(
      readFileSync(pairPath(pair, sourceLang), "utf-8")
    ) as Record<string, unknown>
    const targetPath = pairPath(pair, missingLang)
    const targetContent = JSON.parse(
      readFileSync(targetPath, "utf-8")
    ) as Record<string, unknown>

    for (const key of missing) {
      const sourceValue = getNestedValue(sourceContent, key)
      const tag = missingLang === "ar" ? "[AR]" : "[EN]"
      setNestedValue(targetContent, key, `${tag} ${String(sourceValue)}`)
      added++
    }

    writeFileSync(targetPath, JSON.stringify(targetContent, null, 2) + "\n")
  }
  return added
}

function main() {
  console.log(chalk.cyan("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"))
  console.log(chalk.bold("📝 i18n Synchronization"))
  console.log(chalk.cyan("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"))

  const report = checkDictionaryParity()

  for (const pair of report.pairs) {
    const missing = [
      ...pair.diff.missingInAr.map((k) => ({ key: k, lang: "ar" as const })),
      ...pair.diff.missingInEn.map((k) => ({ key: k, lang: "en" as const })),
    ]
    if (missing.length === 0) {
      console.log(chalk.green(`✓ ${pair.label}: All keys synced`))
    } else {
      console.log(chalk.yellow(`\n${pair.label}:`))
      for (const m of missing) {
        console.log(
          `  ${m.lang === "ar" ? "🇸🇦" : "🇬🇧"} Missing: ${chalk.gray(m.key)}`
        )
      }
    }
  }

  if (report.filesOnlyInAr.length > 0) {
    console.log(chalk.red("\n⚠️  Files only in Arabic:"))
    report.filesOnlyInAr.forEach((f) => console.log(`  • ${f}`))
  }
  if (report.filesOnlyInEn.length > 0) {
    console.log(chalk.red("\n⚠️  Files only in English:"))
    report.filesOnlyInEn.forEach((f) => console.log(`  • ${f}`))
  }

  const placeholders = findUntranslatedPlaceholders()

  console.log(chalk.cyan("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"))
  console.log(chalk.bold("Summary"))
  console.log(chalk.cyan("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"))
  console.log(`Dictionary pairs: ${chalk.green(report.pairs.length)}`)
  console.log(
    `Missing in Arabic: ${report.totalMissingInAr > 0 ? chalk.red(report.totalMissingInAr) : chalk.green("0")}`
  )
  console.log(
    `Missing in English: ${report.totalMissingInEn > 0 ? chalk.red(report.totalMissingInEn) : chalk.green("0")}`
  )
  console.log(
    `Untranslated placeholders: ${placeholders.length > 0 ? chalk.red(placeholders.length) : chalk.green("0")}`
  )

  if (report.isSynced && placeholders.length === 0) {
    console.log(chalk.green("\n✅ All dictionaries are in sync!\n"))
    return
  }

  // --check mode is for CI: any drift is a hard failure.
  if (options.check) {
    console.log(
      chalk.red(
        `\n❌ i18n drift: ${report.totalMissingInAr} missing in AR, ${report.totalMissingInEn} missing in EN, ${placeholders.length} untranslated placeholders\n`
      )
    )
    if (placeholders.length > 0) {
      placeholders
        .slice(0, 20)
        .forEach((p) => console.log(chalk.gray(`  ${p.file}: ${p.key}`)))
    }
    console.log(
      chalk.yellow(
        "\nRun `pnpm i18n:fix` to scaffold placeholders, then translate them.\n"
      )
    )
    process.exit(1)
  }

  if (options.fix && !options.verify) {
    let added = 0
    for (const pair of report.pairs) {
      added += fixPair(pair)
    }
    console.log(chalk.green(`\nAdded ${added} placeholder translations`))
    console.log(
      chalk.yellow(
        "⚠️  Review and translate the [AR]/[EN] placeholders before committing — the parity test rejects them.\n"
      )
    )
  } else if (options.verify) {
    console.log(chalk.yellow("\n⚠️  Run with --fix to add missing keys\n"))
  }
}

main()

/**
 * Verify multi-tenant isolation - ensures all queries include schoolId
 * Run: npx tsx scripts/tenant-verify.ts [--fix]
 */

import { readdirSync, readFileSync, statSync, writeFileSync } from "fs"
import { join } from "path"
import chalk from "chalk"
import { Command } from "commander"
import ora from "ora"

const program = new Command()
program
  .option("--fix", "Automatically fix violations where possible")
  .option(
    "--exclude <patterns>",
    "Comma-separated glob patterns to exclude",
    ""
  )
  .parse()

const options = program.opts()

interface Violation {
  file: string
  line: number
  code: string
  type: "missing-schoolId" | "unscoped-query" | "missing-where-clause"
  severity: "critical" | "warning"
}

const violations: Violation[] = []

// Prisma operations that MUST include schoolId
const SCOPED_OPERATIONS = [
  "findFirst",
  "findMany",
  "findUnique", // When querying by non-ID fields
  "create",
  "update",
  "updateMany",
  "delete",
  "deleteMany",
  "count",
  "aggregate",
]

// Tables that should be globally accessible (no schoolId)
const GLOBAL_TABLES = [
  "User", // Has schoolId but can query across schools for platform admin
  "SubscriptionTier",
  "LegalDocument",
  "Account",
  "Session",
  "VerificationToken",
  "TwoFactorToken",
]

function scanDirectory(dir: string): string[] {
  const files: string[] = []

  const items = readdirSync(dir)

  for (const item of items) {
    const fullPath = join(dir, item)
    const stat = statSync(fullPath)

    if (stat.isDirectory()) {
      if (
        !item.startsWith(".") &&
        !["node_modules", "dist", ".next"].includes(item)
      ) {
        files.push(...scanDirectory(fullPath))
      }
    } else if (item.endsWith(".ts") || item.endsWith(".tsx")) {
      files.push(fullPath)
    }
  }

  return files
}

function analyzeFile(filePath: string) {
  const content = readFileSync(filePath, "utf-8")
  const lines = content.split("\n")

  lines.forEach((line, index) => {
    // Check for Prisma queries
    const prismaMatch = line.match(
      /prisma\.(\w+)\.(findFirst|findMany|create|update|delete|updateMany|deleteMany|count|aggregate|findUnique)\(/g
    )

    if (prismaMatch) {
      prismaMatch.forEach((match) => {
        const modelName = match.match(/prisma\.(\w+)\./)?.[1]

        if (!modelName || GLOBAL_TABLES.includes(modelName)) {
          return // Skip global tables
        }

        // Check if schoolId is mentioned in the same statement or nearby lines
        const contextStart = Math.max(0, index - 2)
        const contextEnd = Math.min(lines.length, index + 10)
        const context = lines.slice(contextStart, contextEnd).join("\n")

        const hasSchoolId =
          context.includes("schoolId") || context.includes("getTenantContext")

        if (!hasSchoolId) {
          violations.push({
            file: filePath,
            line: index + 1,
            code: line.trim(),
            type: "missing-schoolId",
            severity: "critical",
          })
        }
      })
    }

    // Check for raw SQL queries without schoolId
    if (line.includes("$queryRaw") || line.includes("$executeRaw")) {
      const contextStart = Math.max(0, index - 2)
      const contextEnd = Math.min(lines.length, index + 5)
      const context = lines.slice(contextStart, contextEnd).join("\n")

      if (!context.includes("schoolId") && !context.includes("school_id")) {
        violations.push({
          file: filePath,
          line: index + 1,
          code: line.trim(),
          type: "unscoped-query",
          severity: "critical",
        })
      }
    }
  })
}

async function verifyIsolation() {
  const spinner = ora(
    "Scanning codebase for multi-tenant violations..."
  ).start()

  try {
    // Scan source files
    const srcDir = join(process.cwd(), "src")
    const files = scanDirectory(srcDir)

    spinner.text = `Analyzing ${files.length} files...`

    for (const file of files) {
      analyzeFile(file)
    }

    spinner.stop()

    if (violations.length === 0) {
      console.log(chalk.green("\n✅ No multi-tenant violations found!"))
      console.log(chalk.gray(`Analyzed ${files.length} files\n`))
      return
    }

    // Group violations by file
    const violationsByFile = violations.reduce(
      (acc, v) => {
        if (!acc[v.file]) acc[v.file] = []
        acc[v.file].push(v)
        return acc
      },
      {} as Record<string, Violation[]>
    )

    console.log(
      chalk.red(
        `\n❌ Found ${violations.length} multi-tenant violations in ${Object.keys(violationsByFile).length} files:\n`
      )
    )

    let criticalCount = 0
    let warningCount = 0

    for (const [file, fileViolations] of Object.entries(violationsByFile)) {
      const relativePath = file.replace(process.cwd(), ".")
      console.log(chalk.yellow(`\n${relativePath}:`))

      fileViolations.forEach((v) => {
        if (v.severity === "critical") criticalCount++
        else warningCount++

        const icon = v.severity === "critical" ? "🔴" : "🟡"
        console.log(`  ${icon} Line ${v.line}: ${chalk.gray(v.code)}`)
        console.log(`     ${chalk.dim(`Type: ${v.type}`)}`)
      })
    }

    console.log(chalk.red("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"))
    console.log(
      chalk.red(`Total: ${criticalCount} critical, ${warningCount} warnings`)
    )
    console.log(chalk.red("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"))

    if (options.fix) {
      console.log(chalk.yellow("⚠️  Auto-fix is not yet implemented"))
      console.log(chalk.gray("Manual fixes required:\n"))
      console.log(chalk.cyan("1. Add schoolId to where clause:"))
      console.log(chalk.gray("   where: { schoolId, ...otherConditions }\n"))
      console.log(chalk.cyan("2. Use getTenantContext():"))
      console.log(
        chalk.gray("   const { schoolId } = await getTenantContext()\n")
      )
      console.log(chalk.cyan("3. For server actions, get from session:"))
      console.log(
        chalk.gray(
          "   const session = await auth()\n   const schoolId = session?.user?.schoolId\n"
        )
      )
    }

    process.exit(1)
  } catch (error) {
    spinner.fail(chalk.red("Verification failed"))
    console.error(error)
    process.exit(1)
  }
}

verifyIsolation()

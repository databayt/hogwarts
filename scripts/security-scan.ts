/**
 * Security vulnerability scan (dependencies + code patterns)
 * Run: npx tsx scripts/security-scan.ts [--fix]
 */

import { execSync } from "child_process"
import { readdirSync, readFileSync, statSync } from "fs"
import { join } from "path"
import chalk from "chalk"
import { Command } from "commander"
import ora from "ora"

const program = new Command()
program
  .option("--fix", "Auto-fix vulnerabilities where possible")
  .option(
    "--severity <level>",
    "Minimum severity: low|moderate|high|critical",
    "moderate"
  )
  .parse()

const options = program.opts()

interface Vulnerability {
  type: string
  file: string
  line: number
  severity: "low" | "moderate" | "high" | "critical"
  description: string
  fix?: string
}

const vulnerabilities: Vulnerability[] = []

// Security patterns to check
const SECURITY_PATTERNS = [
  {
    pattern: /eval\(/g,
    type: "code-injection",
    severity: "critical" as const,
    description: "Use of eval() can lead to code injection",
    fix: "Remove eval() and use safer alternatives",
  },
  {
    pattern: /dangerouslySetInnerHTML/g,
    type: "xss",
    severity: "high" as const,
    description: "dangerouslySetInnerHTML can lead to XSS attacks",
    fix: "Sanitize HTML content or use safer React patterns",
  },
  {
    pattern: /process\.env\.\w+/g,
    type: "env-exposure",
    severity: "moderate" as const,
    description: "Potential environment variable exposure to client",
    fix: "Ensure env vars are not exposed to client-side code",
  },
  {
    pattern: /password.*=.*["'`]/gi,
    type: "hardcoded-secret",
    severity: "critical" as const,
    description: "Hardcoded password detected",
    fix: "Move credentials to environment variables",
  },
  {
    pattern: /api_key.*=.*["'`]/gi,
    type: "hardcoded-secret",
    severity: "critical" as const,
    description: "Hardcoded API key detected",
    fix: "Move API keys to environment variables",
  },
]

function scanFile(filePath: string) {
  const content = readFileSync(filePath, "utf-8")
  const lines = content.split("\n")

  lines.forEach((line, index) => {
    for (const pattern of SECURITY_PATTERNS) {
      if (pattern.pattern.test(line)) {
        vulnerabilities.push({
          type: pattern.type,
          file: filePath,
          line: index + 1,
          severity: pattern.severity,
          description: pattern.description,
          fix: pattern.fix,
        })
      }
    }
  })
}

function scanDirectory(dir: string) {
  const items = readdirSync(dir)

  for (const item of items) {
    const fullPath = join(dir, item)
    const stat = statSync(fullPath)

    if (stat.isDirectory()) {
      if (
        !item.startsWith(".") &&
        !["node_modules", "dist", ".next"].includes(item)
      ) {
        scanDirectory(fullPath)
      }
    } else if (
      item.endsWith(".ts") ||
      item.endsWith(".tsx") ||
      item.endsWith(".js") ||
      item.endsWith(".jsx")
    ) {
      scanFile(fullPath)
    }
  }
}

async function scanDependencies() {
  const spinner = ora("Scanning dependencies for vulnerabilities...").start()

  try {
    const output = execSync("pnpm audit --json", { encoding: "utf-8" })
    const audit = JSON.parse(output)

    const depVulns = audit.vulnerabilities || {}
    const vulnCount = Object.keys(depVulns).length

    if (vulnCount > 0) {
      spinner.warn(
        chalk.yellow(`Found ${vulnCount} dependency vulnerabilities`)
      )

      Object.entries(depVulns).forEach(([pkg, data]: [string, any]) => {
        if (data.severity) {
          console.log(chalk.red(`  ${data.severity.toUpperCase()}: ${pkg}`))
          console.log(chalk.gray(`  ${data.title || "No description"}`))
        }
      })
    } else {
      spinner.succeed(chalk.green("No dependency vulnerabilities found"))
    }

    return vulnCount
  } catch (error: any) {
    // pnpm audit returns non-zero if vulnerabilities found
    if (error.stdout) {
      try {
        const audit = JSON.parse(error.stdout)
        const metadata = audit.metadata || {}

        spinner.warn(chalk.yellow("Dependency vulnerabilities detected"))

        console.log(chalk.red("\nVulnerability Summary:"))
        console.log(
          `  Critical: ${chalk.red(metadata.vulnerabilities?.critical || 0)}`
        )
        console.log(
          `  High:     ${chalk.red(metadata.vulnerabilities?.high || 0)}`
        )
        console.log(
          `  Moderate: ${chalk.yellow(metadata.vulnerabilities?.moderate || 0)}`
        )
        console.log(
          `  Low:      ${chalk.gray(metadata.vulnerabilities?.low || 0)}`
        )

        if (options.fix) {
          console.log(chalk.yellow("\nAttempting auto-fix..."))
          execSync("pnpm audit fix", { stdio: "inherit" })
        }

        return (
          (metadata.vulnerabilities?.critical || 0) +
          (metadata.vulnerabilities?.high || 0) +
          (metadata.vulnerabilities?.moderate || 0) +
          (metadata.vulnerabilities?.low || 0)
        )
      } catch (parseError) {
        spinner.fail(chalk.red("Failed to parse audit results"))
        return 0
      }
    }
    spinner.fail(chalk.red("Dependency scan failed"))
    return 0
  }
}

async function scanCode() {
  const spinner = ora("Scanning code for security patterns...").start()

  try {
    const srcDir = join(process.cwd(), "src")
    scanDirectory(srcDir)

    spinner.succeed(chalk.green("Code scan complete"))
  } catch (error) {
    spinner.fail(chalk.red("Code scan failed"))
    console.error(error)
  }
}

async function main() {
  console.log(chalk.cyan("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"))
  console.log(chalk.bold("🔒 Security Vulnerability Scan"))
  console.log(chalk.cyan("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"))

  // 1. Scan dependencies
  const depVulns = await scanDependencies()

  // 2. Scan code patterns
  await scanCode()

  // Report code vulnerabilities
  if (vulnerabilities.length > 0) {
    console.log(
      chalk.red(`\n⚠️  Found ${vulnerabilities.length} code vulnerabilities:\n`)
    )

    const critical = vulnerabilities.filter((v) => v.severity === "critical")
    const high = vulnerabilities.filter((v) => v.severity === "high")
    const moderate = vulnerabilities.filter((v) => v.severity === "moderate")

    if (critical.length > 0) {
      console.log(chalk.red("🔴 CRITICAL:\n"))
      critical.forEach((v) => {
        console.log(chalk.white(`  ${v.file}:${v.line}`))
        console.log(chalk.gray(`  ${v.description}`))
        if (v.fix) console.log(chalk.cyan(`  Fix: ${v.fix}\n`))
      })
    }

    if (high.length > 0) {
      console.log(chalk.red("🟠 HIGH:\n"))
      high.forEach((v) => {
        console.log(chalk.white(`  ${v.file}:${v.line}`))
        console.log(chalk.gray(`  ${v.description}`))
        if (v.fix) console.log(chalk.cyan(`  Fix: ${v.fix}\n`))
      })
    }

    if (moderate.length > 0) {
      console.log(chalk.yellow("🟡 MODERATE:\n"))
      moderate.forEach((v) => {
        console.log(chalk.white(`  ${v.file}:${v.line}`))
        console.log(chalk.gray(`  ${v.description}\n`))
      })
    }
  } else {
    console.log(chalk.green("\n✅ No code vulnerabilities found!\n"))
  }

  // Summary
  console.log(chalk.cyan("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"))
  console.log(chalk.bold("Summary"))
  console.log(chalk.cyan("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"))

  console.log(
    `Dependency vulnerabilities: ${depVulns > 0 ? chalk.red(depVulns) : chalk.green("0")}`
  )
  console.log(
    `Code vulnerabilities: ${vulnerabilities.length > 0 ? chalk.red(vulnerabilities.length) : chalk.green("0")}`
  )

  if (vulnerabilities.length > 0 || depVulns > 0) {
    console.log(
      chalk.yellow(
        "\n⚠️  Security issues detected - review and fix before deployment\n"
      )
    )
    process.exit(1)
  } else {
    console.log(chalk.green("\n✅ No security issues detected!\n"))
  }
}

main()

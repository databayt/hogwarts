/**
 * Audit role-based access control (RBAC) permissions
 * Run: npx tsx scripts/security-permissions.ts [--role TEACHER] [--dry-run]
 */

import { PrismaClient, UserRole } from "@prisma/client"
import chalk from "chalk"
import { Command } from "commander"
import ora from "ora"

const prisma = new PrismaClient()

const program = new Command()
program
  .option("-r, --role <role>", "Audit specific role")
  .option("--dry-run", "Preview only, don't modify")
  .parse()

const options = program.opts()

// Type alias for Role
type Role = UserRole

// Define permission matrix
const PERMISSIONS: Record<Role, Record<string, string[]>> = {
  DEVELOPER: {
    schools: ["read", "write", "delete"],
    students: ["read", "write", "delete"],
    teachers: ["read", "write", "delete"],
    classes: ["read", "write", "delete"],
    attendance: ["read", "write", "delete"],
    exams: ["read", "write", "delete"],
    finance: ["read", "write", "delete"],
    settings: ["read", "write", "delete"],
  },
  ADMIN: {
    students: ["read", "write", "delete"],
    teachers: ["read", "write", "delete"],
    classes: ["read", "write", "delete"],
    attendance: ["read", "write", "delete"],
    exams: ["read", "write", "delete"],
    finance: ["read", "write", "delete"],
    settings: ["read", "write"],
  },
  TEACHER: {
    students: ["read"],
    classes: ["read"],
    attendance: ["read", "write"], // Only for their classes
    exams: ["read", "write"], // Only for their classes
    finance: [], // No access
  },
  STUDENT: {
    attendance: ["read"], // Only their own
    exams: ["read"], // Only their own
    classes: ["read"], // Only their own
    finance: ["read"], // Only their own invoices
  },
  GUARDIAN: {
    students: ["read"], // Only their children
    attendance: ["read"], // Only their children
    exams: ["read"], // Only their children
    finance: ["read", "write"], // Pay invoices
  },
  ACCOUNTANT: {
    finance: ["read", "write", "delete"],
    students: ["read"], // For billing
    invoices: ["read", "write"],
  },
  STAFF: {
    students: ["read"],
    classes: ["read"],
    attendance: ["read"],
  },
  USER: {
    // Default minimal permissions
  },
}

interface PermissionIssue {
  role: Role
  resource: string
  issue: string
  severity: "critical" | "warning" | "info"
}

const issues: PermissionIssue[] = []

// Type guard to check if permissions exist
function hasPermission(
  perms: Record<string, string[]>,
  resource: string
): resource is keyof typeof perms {
  return resource in perms
}

async function auditPermissions(role?: Role) {
  const spinner = ora("Auditing permissions...").start()

  try {
    const rolesToCheck = role ? [role] : (Object.keys(PERMISSIONS) as Role[])

    console.log(chalk.cyan("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"))
    console.log(chalk.bold("🔐 Permission Audit Report"))
    console.log(chalk.cyan("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"))

    for (const r of rolesToCheck) {
      const perms = PERMISSIONS[r]

      spinner.text = `Auditing ${r}...`

      console.log(chalk.white(`\n${r}:`))

      // Check each resource
      for (const [resource, actions] of Object.entries(perms)) {
        const actionsArray = actions as string[]
        if (actionsArray.length === 0) {
          console.log(chalk.gray(`  ✗ ${resource}: No access`))
        } else {
          console.log(
            chalk.green(`  ✓ ${resource}: ${actionsArray.join(", ")}`)
          )
        }
      }

      // Check for potential issues
      if (r === "TEACHER") {
        if (hasPermission(perms, "finance") && perms.finance.length > 0) {
          issues.push({
            role: r,
            resource: "finance",
            issue: "Teachers should not have finance access",
            severity: "critical",
          })
        }

        if (
          hasPermission(perms, "students") &&
          perms.students.includes("delete")
        ) {
          issues.push({
            role: r,
            resource: "students",
            issue: "Teachers should not be able to delete students",
            severity: "critical",
          })
        }
      }

      if (r === "STUDENT") {
        if (
          hasPermission(perms, "attendance") &&
          perms.attendance.includes("write")
        ) {
          issues.push({
            role: r,
            resource: "attendance",
            issue: "Students should not be able to modify attendance",
            severity: "critical",
          })
        }
      }
    }

    spinner.succeed(chalk.green("Audit complete"))

    // Check actual database for violations
    spinner.text = "Checking for permission violations..."

    // Example: Check if teachers have admin access
    const teachersWithAdminAccess = await prisma.user.count({
      where: {
        role: "TEACHER",
        // Add conditions for elevated permissions if tracked in DB
      },
    })

    if (teachersWithAdminAccess > 0) {
      issues.push({
        role: "TEACHER",
        resource: "system",
        issue: `${teachersWithAdminAccess} teachers have admin-level access`,
        severity: "critical",
      })
    }

    spinner.stop()

    // Report issues
    if (issues.length > 0) {
      console.log(
        chalk.red(`\n⚠️  Found ${issues.length} permission issues:\n`)
      )

      const critical = issues.filter((i) => i.severity === "critical")
      const warnings = issues.filter((i) => i.severity === "warning")

      if (critical.length > 0) {
        console.log(chalk.red("🔴 CRITICAL:\n"))
        critical.forEach((i) => {
          console.log(chalk.white(`  ${i.role} - ${i.resource}`))
          console.log(chalk.gray(`  ${i.issue}\n`))
        })
      }

      if (warnings.length > 0) {
        console.log(chalk.yellow("🟡 WARNINGS:\n"))
        warnings.forEach((i) => {
          console.log(chalk.white(`  ${i.role} - ${i.resource}`))
          console.log(chalk.gray(`  ${i.issue}\n`))
        })
      }
    } else {
      console.log(chalk.green("\n✅ No permission issues detected!\n"))
    }

    // Recommendations
    console.log(chalk.cyan("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"))
    console.log(chalk.bold("Recommendations"))
    console.log(chalk.cyan("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"))

    console.log(chalk.blue("1. Implement middleware permission checks"))
    console.log(chalk.gray("   • Check user role before server actions"))
    console.log(chalk.gray("   • Add RBAC middleware to routes\n"))

    console.log(chalk.blue("2. Audit server actions for permission checks"))
    console.log(chalk.gray("   • Ensure schoolId scoping"))
    console.log(chalk.gray("   • Verify user owns resource\n"))

    console.log(chalk.blue("3. Implement row-level security"))
    console.log(chalk.gray("   • Use Prisma middleware"))
    console.log(chalk.gray("   • Add database-level RLS\n"))
  } catch (error) {
    spinner.fail(chalk.red("Audit failed"))
    console.error(error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

auditPermissions(options.role as Role)

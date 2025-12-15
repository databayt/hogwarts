/**
 * Generate usage analytics report for schools
 * Run: npx tsx scripts/analytics-usage.ts [--school portsudan] [--period month]
 */

import { PrismaClient } from "@prisma/client"
import chalk from "chalk"
import { Command } from "commander"
import ora from "ora"

const prisma = new PrismaClient()

const program = new Command()
program
  .option("-s, --school <domain>", "Specific school")
  .option("-p, --period <period>", "Period: day|week|month|year", "month")
  .parse()

const options = program.opts()

async function generateUsageReport() {
  const spinner = ora("Generating usage report...").start()

  try {
    const periodMs = {
      day: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000,
      year: 365 * 24 * 60 * 60 * 1000,
    }

    const since = new Date(
      Date.now() - periodMs[options.period as keyof typeof periodMs]
    )

    let whereClause: any = {}
    if (options.school) {
      const school = await prisma.school.findUnique({
        where: { domain: options.school },
      })
      if (!school) {
        spinner.fail(chalk.red(`School "${options.school}" not found`))
        process.exit(1)
      }
      whereClause.schoolId = school.id
    }

    // Get statistics
    spinner.text = "Calculating statistics..."

    const [
      totalStudents,
      totalTeachers,
      totalClasses,
      activeUsers,
      attendanceRecords,
      examsCount,
    ] = await Promise.all([
      prisma.student.count({ where: whereClause }),
      prisma.teacher.count({ where: whereClause }),
      prisma.class.count({ where: whereClause }),
      prisma.user.count({
        where: {
          ...whereClause,
          lastLogin: { gte: since },
        },
      }),
      prisma.attendance.count({
        where: {
          ...whereClause,
          date: { gte: since },
        },
      }),
      prisma.exam.count({
        where: {
          ...whereClause,
          createdAt: { gte: since },
        },
      }),
    ])

    spinner.succeed(chalk.green("Report generated"))

    console.log(chalk.cyan("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"))
    console.log(chalk.bold("📊 Usage Analytics Report"))
    console.log(chalk.cyan("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"))

    if (options.school) {
      console.log(chalk.white("School:"), chalk.green(options.school))
    } else {
      console.log(chalk.white("Scope:"), chalk.green("All schools"))
    }

    console.log(chalk.white("Period:"), chalk.green(options.period))
    console.log(chalk.white("Since:"), chalk.gray(since.toLocaleDateString()))

    console.log(chalk.white("\nUsers:"))
    console.log(`  Students: ${chalk.green(totalStudents)}`)
    console.log(`  Teachers: ${chalk.green(totalTeachers)}`)
    console.log(`  Active (${options.period}): ${chalk.green(activeUsers)}`)

    console.log(chalk.white("\nContent:"))
    console.log(`  Classes: ${chalk.green(totalClasses)}`)
    console.log(`  Exams (${options.period}): ${chalk.green(examsCount)}`)
    console.log(
      `  Attendance records (${options.period}): ${chalk.green(attendanceRecords)}`
    )

    const engagementRate =
      totalStudents > 0
        ? ((activeUsers / (totalStudents + totalTeachers)) * 100).toFixed(1)
        : "0"

    console.log(chalk.white("\nEngagement:"))
    console.log(`  Rate: ${chalk.green(engagementRate + "%")}`)

    console.log(chalk.cyan("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"))
  } catch (error) {
    spinner.fail(chalk.red("Report generation failed"))
    console.error(error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

generateUsageReport()

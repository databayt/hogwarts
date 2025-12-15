/**
 * Bulk import data from CSV/JSON for a school
 * Run: npx tsx scripts/tenant-migrate-data.ts --school portsudan --type students --file data.csv
 */

import { readFileSync } from "fs"
import { PrismaClient } from "@prisma/client"
import chalk from "chalk"
import { Command } from "commander"
import { parse } from "csv-parse/sync"
import ora from "ora"

const prisma = new PrismaClient()

const program = new Command()
program
  .requiredOption("-s, --school <domain>", "School domain")
  .requiredOption("-t, --type <type>", "Data type: students|teachers|classes")
  .requiredOption("-f, --file <path>", "CSV or JSON file path")
  .option("--dry-run", "Preview without importing")
  .option("--validate-only", "Only validate data, don't import")
  .parse()

const options = program.opts()

interface StudentRow {
  firstName: string
  lastName: string
  email: string
  dateOfBirth: string
  gender: "MALE" | "FEMALE"
  enrollmentNumber?: string
  yearLevel: string
}

interface TeacherRow {
  firstName: string
  lastName: string
  email: string
  phone?: string
  department?: string
  subjects?: string
}

async function importStudents(schoolId: string, data: StudentRow[]) {
  const spinner = ora("Importing students...").start()

  try {
    // Get current school year
    const currentYear = await prisma.schoolYear.findFirst({
      where: { schoolId },
      orderBy: { startDate: "desc" },
    })

    if (!currentYear) {
      throw new Error("No school year found for this school")
    }

    // Get year levels mapping
    const yearLevels = await prisma.yearLevel.findMany({
      where: { schoolId },
    })

    const yearLevelMap = new Map(
      yearLevels.map((yl) => [yl.levelName.toLowerCase(), yl.id])
    )

    let imported = 0
    let skipped = 0
    const errors: string[] = []

    for (const row of data) {
      try {
        // Validate required fields
        if (!row.firstName || !row.lastName || !row.email) {
          errors.push(`Missing required fields for ${row.email || "unknown"}`)
          skipped++
          continue
        }

        // Find year level
        const yearLevelId = yearLevelMap.get(row.yearLevel.toLowerCase())
        if (!yearLevelId) {
          errors.push(
            `Year level "${row.yearLevel}" not found for ${row.email}`
          )
          skipped++
          continue
        }

        // Check if student exists
        const existing = await prisma.student.findFirst({
          where: {
            email: row.email,
            schoolId,
          },
        })

        if (existing) {
          skipped++
          continue
        }

        if (!options.dryRun && !options.validateOnly) {
          // Create student with corrected field names
          await prisma.student.create({
            data: {
              givenName: row.firstName,
              surname: row.lastName,
              email: row.email,
              dateOfBirth: new Date(row.dateOfBirth),
              gender: row.gender,
              grNumber: row.enrollmentNumber,
              schoolId,
              studentYearLevels: {
                create: {
                  levelId: yearLevelId,
                  yearId: currentYear.id,
                  schoolId,
                },
              },
            },
          })
        }

        imported++
        spinner.text = `Imported ${imported}/${data.length} students...`
      } catch (error) {
        errors.push(`Error importing ${row.email}: ${error}`)
        skipped++
      }
    }

    spinner.succeed(
      chalk.green(`Import complete: ${imported} imported, ${skipped} skipped`)
    )

    if (errors.length > 0) {
      console.log(chalk.yellow(`\n⚠️  ${errors.length} errors:\n`))
      errors
        .slice(0, 10)
        .forEach((err) => console.log(chalk.gray(`  • ${err}`)))
      if (errors.length > 10) {
        console.log(chalk.gray(`  ... and ${errors.length - 10} more`))
      }
    }
  } catch (error) {
    spinner.fail(chalk.red("Import failed"))
    throw error
  }
}

async function importData() {
  const spinner = ora("Loading data file...").start()

  try {
    // Find school
    const school = await prisma.school.findUnique({
      where: { domain: options.school },
    })

    if (!school) {
      spinner.fail(chalk.red(`School "${options.school}" not found`))
      process.exit(1)
    }

    // Read file
    spinner.text = "Reading file..."
    const fileContent = readFileSync(options.file, "utf-8")

    let data: any[]
    if (options.file.endsWith(".csv")) {
      data = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      })
    } else if (options.file.endsWith(".json")) {
      data = JSON.parse(fileContent)
    } else {
      spinner.fail(chalk.red("Unsupported file format. Use .csv or .json"))
      process.exit(1)
    }

    spinner.succeed(chalk.green(`Loaded ${data.length} records`))

    if (options.dryRun) {
      console.log(chalk.blue("\nDRY RUN - Preview:"))
      console.log(
        chalk.gray(
          `Would import ${data.length} ${options.type} to ${school.name}`
        )
      )
      console.log(chalk.gray("\nSample record:"))
      console.log(data[0])
      return
    }

    if (options.validateOnly) {
      console.log(chalk.blue("\nVALIDATE ONLY - Checking data..."))
    }

    // Import based on type
    switch (options.type) {
      case "students":
        await importStudents(school.id, data as StudentRow[])
        break

      case "teachers":
        console.log(chalk.yellow("Teacher import not yet implemented"))
        break

      case "classes":
        console.log(chalk.yellow("Class import not yet implemented"))
        break

      default:
        console.log(chalk.red(`Unknown type: ${options.type}`))
        process.exit(1)
    }
  } catch (error) {
    spinner.fail(chalk.red("Import failed"))
    console.error(error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

importData()

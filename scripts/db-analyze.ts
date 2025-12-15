/**
 * Analyze database queries for N+1 problems, missing indexes, slow queries
 * Run: npx tsx scripts/db-analyze.ts [--threshold 100]
 */

import { PrismaClient } from "@prisma/client"
import chalk from "chalk"
import { Command } from "commander"
import ora from "ora"

const prisma = new PrismaClient({
  log: [
    { level: "query", emit: "event" },
    { level: "info", emit: "event" },
    { level: "warn", emit: "event" },
  ],
})

const program = new Command()
program
  .option("-t, --threshold <ms>", "Slow query threshold in ms", "100")
  .option("--sample", "Run sample queries to test")
  .parse()

const options = program.opts()

interface QueryStat {
  query: string
  duration: number
  count: number
  params?: string
}

const queryStats: QueryStat[] = []
let queryCount = 0

async function analyzeQueries() {
  const spinner = ora("Analyzing database queries...").start()

  try {
    // Listen to query events
    prisma.$on("query" as any, (e: any) => {
      queryCount++
      const duration = parseFloat(e.duration) || 0

      // Track slow queries
      if (duration > parseFloat(options.threshold)) {
        queryStats.push({
          query: e.query,
          duration,
          count: 1,
          params: e.params,
        })
      }
    })

    if (options.sample) {
      spinner.text = "Running sample queries..."

      // Sample query 1: Potential N+1
      await prisma.school.findMany({
        take: 10,
      })

      // For each school, query students separately (N+1 pattern)
      const schools = await prisma.school.findMany({ take: 5 })
      for (const school of schools) {
        await prisma.student.findMany({
          where: { schoolId: school.id },
          take: 10,
        })
      }

      // Sample query 2: Good - uses include
      await prisma.school.findMany({
        take: 5,
        include: {
          students: { take: 10 },
        },
      })
    }

    spinner.stop()

    // Analyze results
    console.log(chalk.cyan("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"))
    console.log(chalk.bold("📊 Query Analysis Report"))
    console.log(chalk.cyan("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"))

    console.log(chalk.white("Overall Statistics:"))
    console.log(`  Total queries: ${chalk.green(queryCount)}`)
    console.log(
      `  Slow queries:  ${chalk.yellow(queryStats.length)} (>${options.threshold}ms)`
    )

    if (queryStats.length > 0) {
      console.log(chalk.yellow("\n⚠️  Slow Queries Detected:\n"))

      // Sort by duration
      queryStats.sort((a, b) => b.duration - a.duration)

      queryStats.slice(0, 10).forEach((stat, index) => {
        console.log(chalk.red(`${index + 1}. Duration: ${stat.duration}ms`))
        console.log(chalk.gray(`   Query: ${stat.query.substring(0, 100)}...`))
        if (stat.params) {
          console.log(chalk.gray(`   Params: ${stat.params.substring(0, 80)}`))
        }
        console.log()
      })

      if (queryStats.length > 10) {
        console.log(
          chalk.gray(`   ... and ${queryStats.length - 10} more slow queries\n`)
        )
      }
    }

    // Recommendations
    console.log(chalk.cyan("💡 Recommendations:\n"))

    if (queryCount > 50) {
      console.log(chalk.yellow("  1. Potential N+1 detected"))
      console.log(
        chalk.gray("     • Use include/select instead of separate queries")
      )
      console.log(chalk.gray("     • Consider dataloader pattern\n"))
    }

    console.log(chalk.blue("  2. Add missing indexes"))
    console.log(
      chalk.gray("     • Run: npx tsx scripts/db-indexes.ts --suggest\n")
    )

    console.log(chalk.blue("  3. Enable query logging in production"))
    console.log(chalk.gray("     • Set DATABASE_LOGGING=true\n"))

    console.log(chalk.blue("  4. Use connection pooling"))
    console.log(chalk.gray("     • Neon uses connection pooling by default\n"))

    console.log(chalk.cyan("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"))
  } catch (error) {
    spinner.fail(chalk.red("Analysis failed"))
    console.error(error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

analyzeQueries()

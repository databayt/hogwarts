/**
 * Pre-flight checks before deployment
 * Run: npx tsx scripts/deploy-preflight.ts --env production
 */

import { Command } from 'commander'
import chalk from 'chalk'
import ora from 'ora'
import { execSync } from 'child_process'

const program = new Command()
program
  .requiredOption('-e, --env <env>', 'Environment: staging|production')
  .option('--skip-tests', 'Skip test execution')
  .option('--skip-lint', 'Skip linting')
  .parse()

const options = program.opts()

interface Check {
  name: string
  status: 'pending' | 'pass' | 'fail' | 'skip'
  message?: string
}

const checks: Check[] = []

async function runCheck(name: string, fn: () => void, canSkip = false): Promise<boolean> {
  const spinner = ora(name).start()

  const check: Check = { name, status: 'pending' }
  checks.push(check)

  try {
    if (canSkip) {
      spinner.info(chalk.blue(`Skipped: ${name}`))
      check.status = 'skip'
      return true
    }

    await fn()
    spinner.succeed(chalk.green(name))
    check.status = 'pass'
    return true

  } catch (error: any) {
    spinner.fail(chalk.red(name))
    check.status = 'fail'
    check.message = error.message
    console.error(chalk.gray(error.message))
    return false
  }
}

async function preFlightChecks() {
  console.log(chalk.cyan('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'))
  console.log(chalk.bold(`🚀 Pre-Flight Checks (${options.env})`))
  console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'))

  let allPassed = true

  // 1. TypeScript compilation
  allPassed = await runCheck('TypeScript compilation', () => {
    execSync('pnpm tsc --noEmit', { stdio: 'pipe' })
  }) && allPassed

  // 2. Linting
  allPassed = await runCheck('ESLint', () => {
    execSync('pnpm lint', { stdio: 'pipe' })
  }, options.skipLint) && allPassed

  // 3. Tests
  allPassed = await runCheck('Tests', () => {
    execSync('pnpm test --run', { stdio: 'pipe' })
  }, options.skipTests) && allPassed

  // 4. Build
  allPassed = await runCheck('Production build', () => {
    execSync('pnpm build', { stdio: 'pipe' })
  }) && allPassed

  // 5. Environment variables
  allPassed = await runCheck('Environment variables', () => {
    const required = [
      'DATABASE_URL',
      'NEXTAUTH_SECRET',
      'NEXTAUTH_URL',
    ]

    const missing = required.filter(v => !process.env[v])
    if (missing.length > 0) {
      throw new Error(`Missing: ${missing.join(', ')}`)
    }
  }) && allPassed

  // 6. Database connection
  allPassed = await runCheck('Database connection', async () => {
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()
    await prisma.$connect()
    await prisma.$disconnect()
  }) && allPassed

  // Summary
  console.log(chalk.cyan('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'))
  console.log(chalk.bold('Pre-Flight Summary'))
  console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'))

  const passed = checks.filter(c => c.status === 'pass').length
  const failed = checks.filter(c => c.status === 'fail').length
  const skipped = checks.filter(c => c.status === 'skip').length

  console.log(`  Passed: ${chalk.green(passed)}`)
  console.log(`  Failed: ${failed > 0 ? chalk.red(failed) : chalk.green('0')}`)
  console.log(`  Skipped: ${chalk.gray(skipped)}`)

  if (allPassed) {
    console.log(chalk.green('\n✅ All checks passed! Ready to deploy.\n'))
    process.exit(0)
  } else {
    console.log(chalk.red('\n❌ Pre-flight checks failed. Fix issues before deploying.\n'))
    process.exit(1)
  }
}

preFlightChecks()

/**
 * Deep health check (database, APIs, services)
 * Run: npx tsx scripts/deploy-health.ts
 */

import { PrismaClient } from '@prisma/client'
import chalk from 'chalk'
import ora from 'ora'

const prisma = new PrismaClient()

interface HealthCheck {
  service: string
  status: 'healthy' | 'degraded' | 'down'
  responseTime?: number
  message?: string
}

const results: HealthCheck[] = []

async function checkDatabase(): Promise<HealthCheck> {
  const start = Date.now()
  try {
    await prisma.$queryRaw`SELECT 1`
    return {
      service: 'Database',
      status: 'healthy',
      responseTime: Date.now() - start,
    }
  } catch (error: any) {
    return {
      service: 'Database',
      status: 'down',
      message: error.message,
    }
  }
}

async function checkBuild(): Promise<HealthCheck> {
  try {
    const { existsSync } = require('fs')
    const { join } = require('path')

    const nextDir = join(process.cwd(), '.next')
    if (!existsSync(nextDir)) {
      return {
        service: 'Build',
        status: 'down',
        message: 'Build directory not found',
      }
    }

    return {
      service: 'Build',
      status: 'healthy',
    }
  } catch (error: any) {
    return {
      service: 'Build',
      status: 'down',
      message: error.message,
    }
  }
}

async function checkEnv(): Promise<HealthCheck> {
  const required = [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
  ]

  const missing = required.filter(v => !process.env[v])

  if (missing.length > 0) {
    return {
      service: 'Environment',
      status: 'down',
      message: `Missing: ${missing.join(', ')}`,
    }
  }

  return {
    service: 'Environment',
    status: 'healthy',
  }
}

async function runHealthChecks() {
  const spinner = ora('Running health checks...').start()

  console.log(chalk.cyan('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'))
  console.log(chalk.bold('🏥 System Health Check'))
  console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'))

  spinner.stop()

  // Run all checks
  results.push(await checkDatabase())
  results.push(await checkBuild())
  results.push(await checkEnv())

  // Display results
  for (const result of results) {
    const icon = result.status === 'healthy' ? '✅' : result.status === 'degraded' ? '⚠️' : '❌'
    const color = result.status === 'healthy' ? chalk.green : result.status === 'degraded' ? chalk.yellow : chalk.red

    console.log(`${icon} ${color(result.service)}`)

    if (result.responseTime) {
      console.log(chalk.gray(`   Response time: ${result.responseTime}ms`))
    }

    if (result.message) {
      console.log(chalk.gray(`   ${result.message}`))
    }

    console.log()
  }

  // Summary
  const healthy = results.filter(r => r.status === 'healthy').length
  const total = results.length

  console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'))
  console.log(chalk.bold('Health Summary'))
  console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'))

  console.log(`Status: ${healthy}/${total} services healthy`)

  if (healthy === total) {
    console.log(chalk.green('\n✅ All systems operational\n'))
  } else {
    console.log(chalk.red('\n❌ Some services are down\n'))
    process.exit(1)
  }

  await prisma.$disconnect()
}

runHealthChecks()

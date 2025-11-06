/**
 * Analyze bundle size and suggest optimizations
 * Run: npx tsx scripts/perf-bundle.ts
 */

import chalk from 'chalk'
import ora from 'ora'
import { execSync } from 'child_process'
import { readdirSync, statSync } from 'fs'
import { join } from 'path'

async function analyzeBundle() {
  const spinner = ora('Analyzing bundle...').start()

  try {
    console.log(chalk.cyan('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'))
    console.log(chalk.bold('📦 Bundle Size Analysis'))
    console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'))

    // Check if .next exists
    const nextDir = join(process.cwd(), '.next')

    spinner.text = 'Building production bundle...'
    execSync('pnpm build', { stdio: 'inherit' })

    spinner.text = 'Analyzing bundle size...'

    // Get all route files
    const staticDir = join(nextDir, 'static', 'chunks', 'app')

    function formatBytes(bytes: number): string {
      if (bytes < 1024) return bytes + ' B'
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
      return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
    }

    function getSize(dir: string): number {
      let total = 0
      try {
        const items = readdirSync(dir)
        for (const item of items) {
          const fullPath = join(dir, item)
          const stat = statSync(fullPath)
          if (stat.isDirectory()) {
            total += getSize(fullPath)
          } else {
            total += stat.size
          }
        }
      } catch (error) {
        // Directory doesn't exist
      }
      return total
    }

    const totalSize = getSize(nextDir)

    spinner.succeed(chalk.green('Analysis complete'))

    console.log(chalk.white('\nTotal bundle size:'), chalk.green(formatBytes(totalSize)))

    console.log(chalk.cyan('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'))
    console.log(chalk.bold('Optimization Recommendations'))
    console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'))

    console.log(chalk.blue('1. Use Next.js bundle analyzer:'))
    console.log(chalk.gray('   ANALYZE=true pnpm build\n'))

    console.log(chalk.blue('2. Optimize imports:'))
    console.log(chalk.gray('   import { format } from "date-fns/format" (not "date-fns")\n'))

    console.log(chalk.blue('3. Enable tree-shaking:'))
    console.log(chalk.gray('   Use optimizePackageImports in next.config.ts\n'))

    console.log(chalk.blue('4. Dynamic imports for heavy components:'))
    console.log(chalk.gray('   const Chart = dynamic(() => import("./chart"))\n'))

    console.log(chalk.blue('5. Target bundle size:'))
    console.log(chalk.gray('   < 100 KB per route (gzipped)\n'))

  } catch (error) {
    spinner.fail(chalk.red('Analysis failed'))
    console.error(error)
  }
}

analyzeBundle()

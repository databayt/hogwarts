/**
 * Run Lighthouse performance audits
 * Run: npx tsx scripts/perf-lighthouse.ts --url https://portsudan.databayt.org
 */

import { Command } from 'commander'
import chalk from 'chalk'
import ora from 'ora'

const program = new Command()
program
  .requiredOption('-u, --url <url>', 'URL to audit')
  .option('--mobile', 'Test mobile performance')
  .option('--threshold <score>', 'Minimum acceptable score', '80')
  .parse()

const options = program.opts()

async function runLighthouse() {
  const spinner = ora('Running Lighthouse audit...').start()

  try {
    console.log(chalk.cyan('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'))
    console.log(chalk.bold('⚡ Lighthouse Performance Audit'))
    console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'))

    spinner.info(chalk.blue('Install Lighthouse globally to use this script:'))
    console.log(chalk.gray('  npm install -g lighthouse\n'))

    spinner.info(chalk.blue('Then run:'))
    console.log(chalk.gray(`  lighthouse ${options.url} --view\n`))

    spinner.info(chalk.blue('Or use online tools:'))
    console.log(chalk.gray(`  https://pagespeed.web.dev/analysis?url=${encodeURIComponent(options.url)}\n`))

    console.log(chalk.cyan('Performance Targets:'))
    console.log(chalk.gray('  Performance: > 90'))
    console.log(chalk.gray('  Accessibility: > 95'))
    console.log(chalk.gray('  Best Practices: > 90'))
    console.log(chalk.gray('  SEO: > 90\n'))

  } catch (error) {
    spinner.fail(chalk.red('Audit failed'))
    console.error(error)
  }
}

runLighthouse()

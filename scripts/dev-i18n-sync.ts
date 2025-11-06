/**
 * Sync i18n translation keys between Arabic and English
 * Run: npx tsx scripts/dev-i18n-sync.ts [--auto-translate]
 */

import { Command } from 'commander'
import chalk from 'chalk'
import ora from 'ora'
import { readdirSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

const program = new Command()
program
  .option('--auto-translate', 'Auto-translate missing keys (placeholder)')
  .option('--fix', 'Add missing keys with placeholder text')
  .option('--verify', 'Only verify, don\'t modify files')
  .parse()

const options = program.opts()

interface DictionaryKeys {
  [key: string]: any
}

interface MissingKey {
  file: string
  key: string
  language: 'ar' | 'en'
}

const missingKeys: MissingKey[] = []

function getAllKeys(obj: any, prefix = ''): string[] {
  const keys: string[] = []

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      keys.push(...getAllKeys(value, fullKey))
    } else {
      keys.push(fullKey)
    }
  }

  return keys
}

function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj)
}

function setNestedValue(obj: any, path: string, value: any): void {
  const keys = path.split('.')
  const lastKey = keys.pop()!
  const target = keys.reduce((current, key) => {
    if (!current[key]) current[key] = {}
    return current[key]
  }, obj)
  target[lastKey] = value
}

async function syncDictionaries() {
  const spinner = ora('Scanning dictionary files...').start()

  try {
    const dictionariesPath = join(process.cwd(), 'src', 'components', 'internationalization', 'dictionaries')
    const arPath = join(dictionariesPath, 'ar')
    const enPath = join(dictionariesPath, 'en')

    // Get all dictionary files
    const arFiles = readdirSync(arPath).filter(f => f.endsWith('.json'))
    const enFiles = readdirSync(enPath).filter(f => f.endsWith('.json'))

    spinner.succeed(chalk.green(`Found ${arFiles.length} dictionary files`))

    console.log(chalk.cyan('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'))
    console.log(chalk.bold('📝 i18n Synchronization'))
    console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'))

    // Check each file
    for (const file of arFiles) {
      const arFilePath = join(arPath, file)
      const enFilePath = join(enPath, file)

      const arContent = JSON.parse(readFileSync(arFilePath, 'utf-8'))
      const enContent = JSON.parse(readFileSync(enFilePath, 'utf-8'))

      const arKeys = getAllKeys(arContent)
      const enKeys = getAllKeys(enContent)

      // Find missing keys in English
      for (const key of arKeys) {
        if (!enKeys.includes(key)) {
          missingKeys.push({
            file,
            key,
            language: 'en'
          })
        }
      }

      // Find missing keys in Arabic
      for (const key of enKeys) {
        if (!arKeys.includes(key)) {
          missingKeys.push({
            file,
            key,
            language: 'ar'
          })
        }
      }

      // Report for this file
      const fileMissing = missingKeys.filter(m => m.file === file)
      if (fileMissing.length > 0) {
        console.log(chalk.yellow(`\n${file}:`))
        fileMissing.forEach(m => {
          console.log(`  ${m.language === 'ar' ? '🇸🇦' : '🇬🇧'} Missing: ${chalk.gray(m.key)}`)
        })
      } else {
        console.log(chalk.green(`\n✓ ${file}: All keys synced`))
      }
    }

    // Check for files only in one language
    const onlyInAr = arFiles.filter(f => !enFiles.includes(f))
    const onlyInEn = enFiles.filter(f => !arFiles.includes(f))

    if (onlyInAr.length > 0) {
      console.log(chalk.red('\n⚠️  Files only in Arabic:'))
      onlyInAr.forEach(f => console.log(`  • ${f}`))
    }

    if (onlyInEn.length > 0) {
      console.log(chalk.red('\n⚠️  Files only in English:'))
      onlyInEn.forEach(f => console.log(`  • ${f}`))
    }

    // Summary
    console.log(chalk.cyan('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'))
    console.log(chalk.bold('Summary'))
    console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'))

    const arMissing = missingKeys.filter(m => m.language === 'ar')
    const enMissing = missingKeys.filter(m => m.language === 'en')

    console.log(`Total files: ${chalk.green(arFiles.length)}`)
    console.log(`Missing in Arabic: ${arMissing.length > 0 ? chalk.red(arMissing.length) : chalk.green('0')}`)
    console.log(`Missing in English: ${enMissing.length > 0 ? chalk.red(enMissing.length) : chalk.green('0')}`)

    if (missingKeys.length === 0) {
      console.log(chalk.green('\n✅ All dictionaries are in sync!\n'))
      return
    }

    // Fix missing keys
    if (options.fix && !options.verify) {
      const fixSpinner = ora('Adding missing keys...').start()

      for (const missing of missingKeys) {
        const sourceLang = missing.language === 'ar' ? 'en' : 'ar'
        const targetLang = missing.language

        const sourcePath = join(dictionariesPath, sourceLang, missing.file)
        const targetPath = join(dictionariesPath, targetLang, missing.file)

        const sourceContent = JSON.parse(readFileSync(sourcePath, 'utf-8'))
        const targetContent = JSON.parse(readFileSync(targetPath, 'utf-8'))

        const sourceValue = getNestedValue(sourceContent, missing.key)
        const placeholder = targetLang === 'ar' ? `[AR] ${sourceValue}` : `[EN] ${sourceValue}`

        setNestedValue(targetContent, missing.key, placeholder)

        writeFileSync(targetPath, JSON.stringify(targetContent, null, 2) + '\n')
      }

      fixSpinner.succeed(chalk.green(`Added ${missingKeys.length} placeholder translations`))

      console.log(chalk.yellow('\n⚠️  Review and update placeholder translations:\n'))
      missingKeys.forEach(m => {
        console.log(chalk.gray(`  ${m.file}: ${m.key} (${m.language})`))
      })
    } else if (options.verify) {
      console.log(chalk.yellow('\n⚠️  Run with --fix to add missing keys\n'))
    }

  } catch (error) {
    spinner.fail(chalk.red('Sync failed'))
    console.error(error)
    process.exit(1)
  }
}

syncDictionaries()

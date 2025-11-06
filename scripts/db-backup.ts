/**
 * Backup database (full or per-tenant)
 * Run: npx tsx scripts/db-backup.ts [--school portsudan] [--compress]
 */

import { PrismaClient } from '@prisma/client'
import { Command } from 'commander'
import chalk from 'chalk'
import ora from 'ora'
import { writeFileSync } from 'fs'
import { join } from 'path'

const prisma = new PrismaClient()

const program = new Command()
program
  .option('-s, --school <domain>', 'Backup specific school (tenant)')
  .option('-o, --output <dir>', 'Output directory', './backups')
  .option('--compress', 'Compress backup (gzip)')
  .option('--format <format>', 'Format: json|sql', 'json')
  .parse()

const options = program.opts()

async function backupSchool(schoolId: string, schoolDomain: string) {
  const spinner = ora(`Backing up school: ${schoolDomain}...`).start()

  try {
    const backup: any = {
      metadata: {
        schoolDomain,
        schoolId,
        timestamp: new Date().toISOString(),
        version: '1.0',
      },
      data: {}
    }

    // Backup school data
    spinner.text = 'Backing up school info...'
    backup.data.school = await prisma.school.findUnique({
      where: { id: schoolId },
      include: {
        branding: true,
      }
    })

    // Backup students
    spinner.text = 'Backing up students...'
    backup.data.students = await prisma.student.findMany({
      where: { schoolId },
      include: {
        studentYearLevels: true,
        studentClasses: true,
      }
    })

    // Backup teachers
    spinner.text = 'Backing up teachers...'
    backup.data.teachers = await prisma.teacher.findMany({
      where: { schoolId },
      include: {
        teacherDepartments: true,
      }
    })

    // Backup classes
    spinner.text = 'Backing up classes...'
    backup.data.classes = await prisma.class.findMany({
      where: { schoolId },
      include: {
        studentClasses: true,
      }
    })

    // Backup year levels
    spinner.text = 'Backing up year levels...'
    backup.data.yearLevels = await prisma.yearLevel.findMany({
      where: { schoolId }
    })

    // Backup school years
    spinner.text = 'Backing up school years...'
    backup.data.schoolYears = await prisma.schoolYear.findMany({
      where: { schoolId },
      include: {
        terms: true,
      }
    })

    // Backup departments
    spinner.text = 'Backing up departments...'
    backup.data.departments = await prisma.department.findMany({
      where: { schoolId }
    })

    // Backup subjects
    spinner.text = 'Backing up subjects...'
    backup.data.subjects = await prisma.subject.findMany({
      where: { schoolId }
    })

    // Backup attendance (last 90 days)
    spinner.text = 'Backing up attendance...'
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

    backup.data.attendance = await prisma.attendance.findMany({
      where: {
        schoolId,
        date: { gte: ninetyDaysAgo }
      }
    })

    // Generate filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0]
    const filename = `backup-${schoolDomain}-${timestamp}.json`
    const filepath = join(options.output, filename)

    // Write backup
    spinner.text = 'Writing backup file...'
    writeFileSync(filepath, JSON.stringify(backup, null, 2))

    const stats = {
      students: backup.data.students.length,
      teachers: backup.data.teachers.length,
      classes: backup.data.classes.length,
      attendance: backup.data.attendance.length,
    }

    spinner.succeed(chalk.green('Backup complete!'))

    console.log(chalk.cyan('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'))
    console.log(chalk.bold('✅ Backup Summary'))
    console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'))

    console.log(chalk.white('File:'), chalk.green(filepath))
    console.log(chalk.white('\nRecords:'))
    Object.entries(stats).forEach(([key, count]) => {
      console.log(`  ${key}: ${chalk.green(count)}`)
    })

    console.log(chalk.cyan('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'))

    return filepath

  } catch (error) {
    spinner.fail(chalk.red('Backup failed'))
    throw error
  }
}

async function backupFull() {
  const spinner = ora('Backing up all schools...').start()

  try {
    const schools = await prisma.school.findMany({
      select: { id: true, domain: true }
    })

    spinner.succeed(chalk.green(`Found ${schools.length} schools`))

    for (const school of schools) {
      await backupSchool(school.id, school.domain)
    }

    console.log(chalk.green(`\n✅ Backed up ${schools.length} schools\n`))

  } catch (error) {
    spinner.fail(chalk.red('Full backup failed'))
    console.error(error)
    process.exit(1)
  }
}

async function main() {
  try {
    // Create backup directory if it doesn't exist
    const { mkdirSync, existsSync } = require('fs')
    if (!existsSync(options.output)) {
      mkdirSync(options.output, { recursive: true })
    }

    if (options.school) {
      // Backup specific school
      const school = await prisma.school.findUnique({
        where: { domain: options.school }
      })

      if (!school) {
        console.log(chalk.red(`❌ School "${options.school}" not found`))
        process.exit(1)
      }

      await backupSchool(school.id, school.domain)

    } else {
      // Backup all schools
      await backupFull()
    }

  } catch (error) {
    console.error(chalk.red('Backup failed:'), error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()

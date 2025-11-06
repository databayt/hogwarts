/**
 * Detect data anomalies (orphaned records, inconsistencies, data drift)
 * Run: npx tsx scripts/db-anomalies.ts [--fix]
 */

import { PrismaClient } from '@prisma/client'
import { Command } from 'commander'
import chalk from 'chalk'
import ora from 'ora'

const prisma = new PrismaClient()

const program = new Command()
program
  .option('--fix', 'Automatically fix anomalies')
  .option('--type <type>', 'Check specific type: orphans|duplicates|all', 'all')
  .parse()

const options = program.opts()

interface Anomaly {
  type: 'orphan' | 'duplicate' | 'inconsistency'
  table: string
  description: string
  count: number
  severity: 'critical' | 'warning' | 'info'
  fixable: boolean
}

const anomalies: Anomaly[] = []

async function checkOrphans() {
  const spinner = ora('Checking for orphaned records...').start()

  try {
    // Check students without school
    const orphanedStudents = await prisma.student.count({
      where: {
        schoolId: null as any
      }
    })

    if (orphanedStudents > 0) {
      anomalies.push({
        type: 'orphan',
        table: 'students',
        description: 'Students without schoolId',
        count: orphanedStudents,
        severity: 'critical',
        fixable: false
      })
    }

    // Check student classes referencing non-existent classes
    const invalidStudentClasses = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM student_classes sc
      LEFT JOIN classes c ON sc.classId = c.id
      WHERE c.id IS NULL
    ` as any[]

    const count = parseInt(invalidStudentClasses[0]?.count || 0)
    if (count > 0) {
      anomalies.push({
        type: 'orphan',
        table: 'student_classes',
        description: 'Student classes referencing non-existent classes',
        count,
        severity: 'critical',
        fixable: true
      })
    }

    // Check attendance without student
    const orphanedAttendance = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM attendance a
      LEFT JOIN students s ON a.studentId = s.id
      WHERE s.id IS NULL
    ` as any[]

    const attCount = parseInt(orphanedAttendance[0]?.count || 0)
    if (attCount > 0) {
      anomalies.push({
        type: 'orphan',
        table: 'attendance',
        description: 'Attendance records for non-existent students',
        count: attCount,
        severity: 'warning',
        fixable: true
      })
    }

    spinner.succeed('Orphan check complete')

  } catch (error) {
    spinner.fail('Orphan check failed')
    console.error(error)
  }
}

async function checkDuplicates() {
  const spinner = ora('Checking for duplicates...').start()

  try {
    // Check duplicate students (same email + schoolId)
    const duplicateStudents = await prisma.$queryRaw`
      SELECT email, schoolId, COUNT(*) as count
      FROM students
      GROUP BY email, schoolId
      HAVING COUNT(*) > 1
    ` as any[]

    if (duplicateStudents.length > 0) {
      const totalDupes = duplicateStudents.reduce((sum, d) => sum + parseInt(d.count) - 1, 0)
      anomalies.push({
        type: 'duplicate',
        table: 'students',
        description: 'Duplicate students (same email + school)',
        count: totalDupes,
        severity: 'critical',
        fixable: false
      })
    }

    // Check duplicate enrollment numbers
    const duplicateEnrollment = await prisma.$queryRaw`
      SELECT enrollmentNumber, schoolId, COUNT(*) as count
      FROM students
      WHERE enrollmentNumber IS NOT NULL
      GROUP BY enrollmentNumber, schoolId
      HAVING COUNT(*) > 1
    ` as any[]

    if (duplicateEnrollment.length > 0) {
      anomalies.push({
        type: 'duplicate',
        table: 'students',
        description: 'Duplicate enrollment numbers',
        count: duplicateEnrollment.length,
        severity: 'critical',
        fixable: false
      })
    }

    spinner.succeed('Duplicate check complete')

  } catch (error) {
    spinner.fail('Duplicate check failed')
    console.error(error)
  }
}

async function checkInconsistencies() {
  const spinner = ora('Checking for inconsistencies...').start()

  try {
    // Check schools without active subscription
    const schoolsNoSub = await prisma.school.count({
      where: {
        isActive: true,
        subscriptions: {
          none: {
            status: 'ACTIVE'
          }
        }
      }
    })

    if (schoolsNoSub > 0) {
      anomalies.push({
        type: 'inconsistency',
        table: 'schools',
        description: 'Active schools without active subscription',
        count: schoolsNoSub,
        severity: 'warning',
        fixable: false
      })
    }

    // Check students in year levels from different schools
    const crossSchoolYearLevels = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM student_year_levels syl
      JOIN students s ON syl.studentId = s.id
      JOIN year_levels yl ON syl.yearLevelId = yl.id
      WHERE s.schoolId != yl.schoolId
    ` as any[]

    const crossCount = parseInt(crossSchoolYearLevels[0]?.count || 0)
    if (crossCount > 0) {
      anomalies.push({
        type: 'inconsistency',
        table: 'student_year_levels',
        description: 'Students enrolled in year levels from different schools',
        count: crossCount,
        severity: 'critical',
        fixable: false
      })
    }

    spinner.succeed('Inconsistency check complete')

  } catch (error) {
    spinner.fail('Inconsistency check failed')
    console.error(error)
  }
}

async function fixAnomalies() {
  const spinner = ora('Fixing anomalies...').start()

  try {
    const fixable = anomalies.filter(a => a.fixable)

    if (fixable.length === 0) {
      spinner.info('No fixable anomalies found')
      return
    }

    let fixed = 0

    for (const anomaly of fixable) {
      if (anomaly.table === 'student_classes' && anomaly.type === 'orphan') {
        // Delete orphaned student classes
        await prisma.$executeRaw`
          DELETE FROM student_classes
          WHERE classId NOT IN (SELECT id FROM classes)
        `
        fixed++
      }

      if (anomaly.table === 'attendance' && anomaly.type === 'orphan') {
        // Delete orphaned attendance
        await prisma.$executeRaw`
          DELETE FROM attendance
          WHERE studentId NOT IN (SELECT id FROM students)
        `
        fixed++
      }
    }

    spinner.succeed(`Fixed ${fixed} anomalies`)

  } catch (error) {
    spinner.fail('Fix failed')
    console.error(error)
  }
}

async function main() {
  try {
    console.log(chalk.cyan('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'))
    console.log(chalk.bold('🔍 Data Anomaly Detection'))
    console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'))

    if (options.type === 'orphans' || options.type === 'all') {
      await checkOrphans()
    }

    if (options.type === 'duplicates' || options.type === 'all') {
      await checkDuplicates()
    }

    if (options.type === 'all') {
      await checkInconsistencies()
    }

    if (anomalies.length === 0) {
      console.log(chalk.green('\n✅ No anomalies detected!\n'))
      return
    }

    // Report anomalies
    console.log(chalk.yellow(`\n⚠️  Found ${anomalies.length} anomalies:\n`))

    const critical = anomalies.filter(a => a.severity === 'critical')
    const warnings = anomalies.filter(a => a.severity === 'warning')
    const info = anomalies.filter(a => a.severity === 'info')

    if (critical.length > 0) {
      console.log(chalk.red('🔴 Critical:\n'))
      critical.forEach(a => {
        console.log(chalk.white(`  ${a.table}: ${a.description}`))
        console.log(chalk.gray(`  Count: ${a.count}, Fixable: ${a.fixable ? 'Yes' : 'No'}\n`))
      })
    }

    if (warnings.length > 0) {
      console.log(chalk.yellow('🟡 Warnings:\n'))
      warnings.forEach(a => {
        console.log(chalk.white(`  ${a.table}: ${a.description}`))
        console.log(chalk.gray(`  Count: ${a.count}, Fixable: ${a.fixable ? 'Yes' : 'No'}\n`))
      })
    }

    if (info.length > 0) {
      console.log(chalk.blue('🔵 Info:\n'))
      info.forEach(a => {
        console.log(chalk.white(`  ${a.table}: ${a.description}`))
        console.log(chalk.gray(`  Count: ${a.count}\n`))
      })
    }

    const fixableCount = anomalies.filter(a => a.fixable).length
    if (fixableCount > 0) {
      console.log(chalk.cyan(`${fixableCount} anomalies can be auto-fixed`))
      console.log(chalk.gray('Run with --fix to apply fixes\n'))
    }

    if (options.fix) {
      await fixAnomalies()
    }

  } catch (error) {
    console.error(chalk.red('Detection failed:'), error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()

/**
 * Clone a school structure for demos/testing
 * Run: npx tsx scripts/tenant-clone.ts --source portsudan --target demo-school --data structure
 */

import { PrismaClient } from '@prisma/client'
import { Command } from 'commander'
import chalk from 'chalk'
import ora from 'ora'

const prisma = new PrismaClient()

const program = new Command()
program
  .requiredOption('-s, --source <domain>', 'Source school domain')
  .requiredOption('-t, --target <domain>', 'Target school domain')
  .requiredOption('-n, --name <name>', 'Target school name')
  .option('-d, --data <type>', 'What to clone: structure|all', 'structure')
  .option('--admin <email>', 'Admin email for cloned school')
  .option('--dry-run', 'Preview without executing')
  .parse()

const options = program.opts()

async function cloneSchool() {
  const spinner = ora('Cloning school...').start()

  try {
    // Find source school
    spinner.text = 'Finding source school...'
    const sourceSchool = await prisma.school.findUnique({
      where: { domain: options.source },
      include: {
        yearLevels: true,
        schoolYears: {
          include: {
            terms: true,
          }
        },
        departments: true,
        subjects: true,
        classrooms: true,
      }
    })

    if (!sourceSchool) {
      spinner.fail(chalk.red(`Source school "${options.source}" not found`))
      process.exit(1)
    }

    // Check if target exists
    const existingTarget = await prisma.school.findUnique({
      where: { domain: options.target }
    })

    if (existingTarget) {
      spinner.fail(chalk.red(`Target school "${options.target}" already exists`))
      process.exit(1)
    }

    if (options.dryRun) {
      spinner.info(chalk.blue('DRY RUN - Preview'))
      console.log(chalk.cyan('\nWould clone:'))
      console.log(`  From: ${sourceSchool.name} (${sourceSchool.domain})`)
      console.log(`  To: ${options.name} (${options.target})`)
      console.log(`  Year Levels: ${sourceSchool.yearLevels.length}`)
      console.log(`  School Years: ${sourceSchool.schoolYears.length}`)
      console.log(`  Departments: ${sourceSchool.departments.length}`)
      console.log(`  Subjects: ${sourceSchool.subjects.length}`)
      console.log(`  Classrooms: ${sourceSchool.classrooms.length}`)
      return
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create target school
      spinner.text = 'Creating target school...'
      const targetSchool = await tx.school.create({
        data: {
          name: options.name,
          domain: options.target,
          isActive: true,
        }
      })

      // 2. Clone year levels
      spinner.text = 'Cloning year levels...'
      const yearLevelMap = new Map<string, string>()

      for (const yl of sourceSchool.yearLevels) {
        const newYearLevel = await tx.yearLevel.create({
          data: {
            schoolId: targetSchool.id,
            levelName: yl.levelName,
            levelOrder: yl.levelOrder,
          }
        })
        yearLevelMap.set(yl.id, newYearLevel.id)
      }

      // 3. Clone school years and terms
      spinner.text = 'Cloning school years...'
      for (const sy of sourceSchool.schoolYears) {
        const newSchoolYear = await tx.schoolYear.create({
          data: {
            schoolId: targetSchool.id,
            yearName: sy.yearName,
            startDate: sy.startDate,
            endDate: sy.endDate,
          }
        })

        // Clone terms
        for (const term of sy.terms) {
          await tx.term.create({
            data: {
              schoolId: targetSchool.id,
              yearId: newSchoolYear.id,
              termNumber: term.termNumber,
              startDate: term.startDate,
              endDate: term.endDate,
            }
          })
        }
      }

      // 4. Clone departments
      spinner.text = 'Cloning departments...'
      for (const dept of sourceSchool.departments) {
        await tx.department.create({
          data: {
            schoolId: targetSchool.id,
            departmentName: dept.departmentName,
          }
        })
      }

      // 5. Clone subjects
      spinner.text = 'Cloning subjects...'
      for (const subject of sourceSchool.subjects) {
        await tx.subject.create({
          data: {
            schoolId: targetSchool.id,
            departmentId: subject.departmentId,
            subjectName: subject.subjectName,
          }
        })
      }

      // 6. Clone classrooms
      spinner.text = 'Cloning classrooms...'
      for (const classroom of sourceSchool.classrooms) {
        await tx.classroom.create({
          data: {
            schoolId: targetSchool.id,
            typeId: classroom.typeId,
            roomName: classroom.roomName,
            capacity: classroom.capacity,
          }
        })
      }

      return targetSchool
    })

    spinner.succeed(chalk.green('School cloned successfully!'))

    console.log(chalk.cyan('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'))
    console.log(chalk.bold('✅ School Cloning Complete'))
    console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'))

    console.log(chalk.white('Cloned School:'))
    console.log(`  Name:   ${chalk.green(result.name)}`)
    console.log(`  Domain: ${chalk.green(result.domain)}`)
    console.log(`  URL:    ${chalk.blue(`https://${result.domain}.databayt.org`)}`)

    console.log(chalk.white('\nCloned Resources:'))
    console.log(`  ✓ ${sourceSchool.yearLevels.length} Year levels`)
    console.log(`  ✓ ${sourceSchool.schoolYears.length} School years`)
    console.log(`  ✓ ${sourceSchool.schoolYears.reduce((sum, sy) => sum + sy.terms.length, 0)} Terms`)
    console.log(`  ✓ ${sourceSchool.departments.length} Departments`)
    console.log(`  ✓ ${sourceSchool.subjects.length} Subjects`)
    console.log(`  ✓ ${sourceSchool.classrooms.length} Classrooms`)

    if (options.admin) {
      console.log(chalk.yellow('\n⚠️  Create admin user:'))
      console.log(chalk.gray(`  npx tsx scripts/tenant-provision.ts --domain ${options.target} --admin ${options.admin}`))
    }

    console.log(chalk.cyan('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'))

  } catch (error) {
    spinner.fail(chalk.red('Cloning failed'))
    console.error(error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

cloneSchool()

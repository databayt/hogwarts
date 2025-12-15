/**
 * Provision a new school with complete setup
 * Run: npx tsx scripts/tenant-provision.ts --domain portsudan --name "Port Sudan School" --admin admin@school.com
 */

import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"
import chalk from "chalk"
import { Command } from "commander"
import ora from "ora"

const prisma = new PrismaClient()

const program = new Command()
program
  .requiredOption("-d, --domain <domain>", "School subdomain (e.g., portsudan)")
  .requiredOption("-n, --name <name>", "School name")
  .requiredOption("-a, --admin <email>", "Admin user email")
  .option(
    "-t, --tier <tier>",
    "Subscription tier (free|basic|premium)",
    "basic"
  )
  .option("-p, --password <password>", "Admin password", "Welcome123!")
  .option("--dry-run", "Preview without executing")
  .option("--with-demo-data", "Include demo students/teachers")
  .parse()

const options = program.opts()

async function provisionSchool() {
  const spinner = ora("Provisioning school...").start()

  try {
    // Check if domain already exists
    const existing = await prisma.school.findUnique({
      where: { domain: options.domain },
    })

    if (existing) {
      spinner.fail(
        chalk.red(`School with domain "${options.domain}" already exists`)
      )
      process.exit(1)
    }

    if (options.dryRun) {
      spinner.info(chalk.blue("DRY RUN - No changes will be made"))
      console.log(chalk.cyan("\nWould create:"))
      console.log(`  School: ${options.name} (${options.domain})`)
      console.log(`  Admin: ${options.admin}`)
      console.log(`  Tier: ${options.tier}`)
      console.log(`  URL: https://${options.domain}.databayt.org`)
      return
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create school
      spinner.text = "Creating school record..."
      const school = await tx.school.create({
        data: {
          name: options.name,
          domain: options.domain,
          isActive: true,
        },
      })

      // 2. Create default school year
      spinner.text = "Creating school year..."
      const currentYear = new Date().getFullYear()
      const schoolYear = await tx.schoolYear.create({
        data: {
          schoolId: school.id,
          yearName: `${currentYear}-${currentYear + 1}`,
          startDate: new Date(`${currentYear}-09-01`),
          endDate: new Date(`${currentYear + 1}-06-30`),
        },
      })

      // 3. Create default terms
      spinner.text = "Creating terms..."
      await tx.term.createMany({
        data: [
          {
            schoolId: school.id,
            yearId: schoolYear.id,
            termNumber: 1,
            startDate: new Date(`${currentYear}-09-01`),
            endDate: new Date(`${currentYear}-12-15`),
          },
          {
            schoolId: school.id,
            yearId: schoolYear.id,
            termNumber: 2,
            startDate: new Date(`${currentYear + 1}-01-05`),
            endDate: new Date(`${currentYear + 1}-03-31`),
          },
          {
            schoolId: school.id,
            yearId: schoolYear.id,
            termNumber: 3,
            startDate: new Date(`${currentYear + 1}-04-10`),
            endDate: new Date(`${currentYear + 1}-06-30`),
          },
        ],
      })

      // 4. Create default year levels (Grades 1-12)
      spinner.text = "Creating year levels..."
      const yearLevels = []
      for (let i = 1; i <= 12; i++) {
        yearLevels.push({
          schoolId: school.id,
          levelName: `Grade ${i}`,
          levelOrder: i,
        })
      }
      await tx.yearLevel.createMany({ data: yearLevels })

      // 5. Create admin user
      spinner.text = "Creating admin user..."
      const hashedPassword = await bcrypt.hash(options.password, 10)
      const adminUser = await tx.user.create({
        data: {
          email: options.admin,
          username: "School Administrator",
          password: hashedPassword,
          role: "ADMIN",
          schoolId: school.id,
          emailVerified: new Date(),
        },
      })

      // 6. Create subscription
      spinner.text = "Creating subscription..."
      const tier = await tx.subscriptionTier.findFirst({
        where: { name: options.tier.toUpperCase() },
      })

      if (tier) {
        await tx.subscription.create({
          data: {
            schoolId: school.id,
            tierId: tier.id,
            status: "active",
            stripeSubscriptionId: `sub_manual_${Date.now()}`,
            stripeCustomerId: `cus_manual_${Date.now()}`,
            stripePriceId: tier.monthlyPriceStripeId || `price_${tier.id}`,
            currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
            cancelAtPeriodEnd: false,
          },
        })
      }

      return { school, schoolYear, adminUser }
    })

    spinner.succeed(chalk.green("School provisioned successfully!"))

    // Success summary
    console.log(chalk.cyan("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"))
    console.log(chalk.bold("✅ School Provisioning Complete"))
    console.log(chalk.cyan("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"))

    console.log(chalk.white("School Details:"))
    console.log(`  Name:      ${chalk.green(result.school.name)}`)
    console.log(`  Domain:    ${chalk.green(result.school.domain)}`)
    console.log(`  ID:        ${chalk.gray(result.school.id)}`)
    console.log(
      `  URL:       ${chalk.blue(`https://${result.school.domain}.databayt.org`)}`
    )

    console.log(chalk.white("\nAdmin Credentials:"))
    console.log(`  Email:     ${chalk.green(options.admin)}`)
    console.log(`  Password:  ${chalk.yellow(options.password)}`)
    console.log(`  Role:      ${chalk.green("ADMIN")}`)

    console.log(chalk.white("\nResources Created:"))
    console.log(`  ✓ School year: ${result.schoolYear.yearName}`)
    console.log(`  ✓ 3 Terms (Term 1, Term 2, Term 3)`)
    console.log(`  ✓ 12 Year levels (Grade 1-12)`)
    console.log(`  ✓ Subscription: ${options.tier.toUpperCase()}`)

    if (options.withDemoData) {
      console.log(chalk.yellow("\n⚠️  Run demo data script:"))
      console.log(
        chalk.gray(
          `  npx tsx scripts/seed-demo-data.ts --school ${result.school.id}`
        )
      )
    }

    console.log(chalk.cyan("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"))
  } catch (error) {
    spinner.fail(chalk.red("Provisioning failed"))
    console.error(chalk.red("\n❌ Error:"), error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

provisionSchool()

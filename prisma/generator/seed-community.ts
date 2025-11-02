/**
 * Community School Seed Script
 *
 * Creates the special "Community" school account at community.databayt.org
 * for centralized QBank repository accessible across all schools.
 */

import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const db = new PrismaClient()

async function seedCommunitySchool() {
  console.log('🌱 Seeding Community School...')

  try {
    // 1. Create Community School
    const communitySchool = await db.school.upsert({
      where: { domain: 'community' },
      update: {},
      create: {
        name: 'Community Question Bank',
        domain: 'community',
        email: 'community@databayt.org',
        website: 'https://community.databayt.org',
        timezone: 'UTC',
        planType: 'enterprise', // Highest tier for unlimited capacity
        maxStudents: 1000000, // Effectively unlimited
        maxTeachers: 10000,
        isActive: true,
        address: 'Virtual - Global',
        phoneNumber: 'N/A',
      },
    })

    console.log(`✅ Community School created: ${communitySchool.id}`)

    // 2. Create System Admin User for Community School
    const hashedPassword = await hash('community-admin-2024', 10)

    const communityAdmin = await db.user.upsert({
      where: {
        email_schoolId: {
          email: 'admin@community.databayt.org',
          schoolId: communitySchool.id,
        },
      },
      update: {},
      create: {
        email: 'admin@community.databayt.org',
        username: 'community-admin',
        password: hashedPassword,
        emailVerified: new Date(),
        role: 'ADMIN',
        schoolId: communitySchool.id,
      },
    })

    console.log(`✅ Community Admin created: ${communityAdmin.id}`)

    // 3. Create Default School Year
    const schoolYear = await db.schoolYear.upsert({
      where: {
        schoolId_yearName: {
          schoolId: communitySchool.id,
          yearName: '2024-2025',
        },
      },
      update: {},
      create: {
        schoolId: communitySchool.id,
        yearName: '2024-2025',
        startDate: new Date('2024-09-01'),
        endDate: new Date('2025-08-31'),
      },
    })

    console.log(`✅ School Year created: ${schoolYear.id}`)

    // 4. Create Department for Medical Sciences
    const department = await db.department.upsert({
      where: {
        schoolId_departmentName: {
          schoolId: communitySchool.id,
          departmentName: 'Medical Sciences',
        },
      },
      update: {},
      create: {
        schoolId: communitySchool.id,
        departmentName: 'Medical Sciences',
      },
    })

    console.log(`✅ Department created: ${department.id}`)

    // 5. Create Sample Subjects for Different Exam Types
    const subjects = [
      // MRCP Part 1 Subjects
      { subjectName: 'Cardiology' },
      { subjectName: 'Respiratory Medicine' },
      { subjectName: 'Gastroenterology' },
      { subjectName: 'Nephrology' },
      { subjectName: 'Endocrinology' },
      { subjectName: 'Neurology' },
      { subjectName: 'Medical Statistics' },
      { subjectName: 'Clinical Pharmacology' },
      // Future: Add more exam types (USMLE, SAT, etc.)
    ]

    for (const subjectData of subjects) {
      const subject = await db.subject.upsert({
        where: {
          schoolId_departmentId_subjectName: {
            schoolId: communitySchool.id,
            departmentId: department.id,
            subjectName: subjectData.subjectName,
          },
        },
        update: {},
        create: {
          schoolId: communitySchool.id,
          departmentId: department.id,
          subjectName: subjectData.subjectName,
        },
      })

      console.log(`✅ Subject created: ${subject.subjectName}`)
    }

    // 5. Create Sample Source Material (placeholder)
    const sourceMaterial = await db.sourceMaterial.create({
      data: {
        schoolId: communitySchool.id,
        title: 'Sample Medical Textbook',
        type: 'PDF_TEXTBOOK',
        subject: 'Medical Sciences',
        examType: 'MRCP_PART_1',
        language: 'en',
        status: 'PENDING',
        attribution:
          'This is a placeholder. Upload actual source materials to begin question generation.',
        license: 'Educational Use',
      },
    })

    console.log(`✅ Sample Source Material created: ${sourceMaterial.id}`)

    // 6. Display Summary
    console.log('\n' + '='.repeat(60))
    console.log('🎉 Community School Setup Complete!')
    console.log('='.repeat(60))
    console.log(`
📋 Summary:
  - School ID: ${communitySchool.id}
  - Domain: community.databayt.org
  - Admin Email: admin@community.databayt.org
  - Admin Password: community-admin-2024 (⚠️  CHANGE THIS!)
  - Subjects: ${subjects.length} subjects created
  - Plan: Enterprise (unlimited capacity)

🚀 Next Steps:
  1. Change the admin password immediately
  2. Upload PDF source materials via the UI
  3. Configure generation jobs in the dashboard
  4. Set up Vercel cron job for scheduled generation

📖 Documentation:
  - Full guide: src/components/platform/qbank-automation/README.md
  - API docs: See engine/ directory for technical details

🔗 Access:
  - Login at: https://community.databayt.org/login
  - Dashboard: https://community.databayt.org/dashboard
`)

    console.log('✅ Seed completed successfully!\n')
  } catch (error) {
    console.error('❌ Error seeding community school:', error)
    throw error
  } finally {
    await db.$disconnect()
  }
}

// Run seed
seedCommunitySchool()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })

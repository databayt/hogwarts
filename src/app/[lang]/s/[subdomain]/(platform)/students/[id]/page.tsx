import { notFound } from "next/navigation"
import { auth } from "@/auth"

import { getModel } from "@/lib/prisma-guards"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { getTenantContext } from "@/components/operator/lib/tenant"
import { StudentProfile } from "@/components/platform/students/profile/student-profile"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string; id: string }>
}

export default async function StudentDetail({ params }: Props) {
  const { lang, id } = await params
  const dictionary = await getDictionary(lang)
  const { schoolId } = await getTenantContext()
  const studentModel = getModel("student")
  if (!schoolId || !studentModel) return notFound()

  // Get current session to determine ownership
  const session = await auth()

  // Calculate date range for attendance (last 60 days)
  const sixtyDaysAgo = new Date()
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)

  const student = await studentModel.findFirst({
    where: { id, schoolId },
    include: {
      // Classes & Academic enrollment
      studentClasses: {
        include: {
          class: {
            include: {
              subject: true,
              teacher: { select: { id: true, givenName: true, surname: true } },
            },
          },
        },
      },
      // Exam Results
      examResults: {
        orderBy: { createdAt: "desc" },
        take: 20,
        include: {
          exam: true,
          subject: true,
        },
      },
      // Assignment Submissions
      submissions: {
        orderBy: { submittedAt: "desc" },
        take: 20,
        include: {
          assignment: true,
        },
      },
      // Guardians with contact info
      studentGuardians: {
        include: {
          guardian: {
            include: { phoneNumbers: true },
          },
          guardianType: true,
        },
      },
      // Documents
      documents: {
        orderBy: { uploadedAt: "desc" },
      },
      // Health Records
      healthRecords: {
        orderBy: { recordDate: "desc" },
      },
      // Achievements
      achievements: {
        orderBy: { achievementDate: "desc" },
      },
      // Disciplinary Records
      disciplinaryRecords: {
        orderBy: { incidentDate: "desc" },
      },
      // Fee Records
      feeRecords: {
        orderBy: { dueDate: "desc" },
      },
      // Attendance (last 60 days)
      attendances: {
        where: {
          date: { gte: sixtyDaysAgo },
        },
        orderBy: { date: "desc" },
      },
      // Year Levels for academic history
      studentYearLevels: {
        include: {
          yearLevel: true,
          schoolYear: true,
        },
      },
    },
  })

  if (!student) return notFound()

  // Check if current user is the owner of this profile
  const isOwner = session?.user?.id === student.userId

  return (
    <div className="container py-6">
      <StudentProfile
        student={student}
        dictionary={dictionary}
        isOwner={isOwner}
        userId={student.userId || undefined}
      />
    </div>
  )
}

export const metadata = { title: "Student Profile" }

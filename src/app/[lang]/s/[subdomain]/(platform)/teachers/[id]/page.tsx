import { notFound } from "next/navigation"

import { db } from "@/lib/db"
import { ModalProvider } from "@/components/atom/modal/context"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { getTenantContext } from "@/components/operator/lib/tenant"
import { TeacherDetailContent } from "@/components/platform/teachers/detail/content"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string; id: string }>
}

export default async function TeacherDetailPage({ params }: Props) {
  const { lang, id } = await params
  const dictionary = await getDictionary(lang)
  const { schoolId } = await getTenantContext()

  if (!schoolId || !(db as any).teacher) return notFound()

  // Fetch teacher with all related data
  const teacher = await (db as any).teacher.findFirst({
    where: { id, schoolId },
    include: {
      phoneNumbers: {
        select: {
          id: true,
          phoneNumber: true,
          phoneType: true,
          isPrimary: true,
        },
        orderBy: { isPrimary: "desc" },
      },
      qualifications: {
        select: {
          id: true,
          qualificationType: true,
          name: true,
          institution: true,
          major: true,
          dateObtained: true,
          expiryDate: true,
          licenseNumber: true,
        },
        orderBy: { dateObtained: "desc" },
      },
      experiences: {
        select: {
          id: true,
          institution: true,
          position: true,
          startDate: true,
          endDate: true,
          isCurrent: true,
          description: true,
        },
        orderBy: { startDate: "desc" },
      },
      subjectExpertise: {
        select: {
          id: true,
          expertiseLevel: true,
          subject: {
            select: {
              id: true,
              subjectName: true,
              subjectNameAr: true,
            },
          },
        },
      },
      teacherDepartments: {
        select: {
          id: true,
          isPrimary: true,
          department: {
            select: {
              id: true,
              departmentName: true,
              departmentNameAr: true,
            },
          },
        },
      },
      classes: {
        select: {
          id: true,
          className: true,
          classNameAr: true,
        },
      },
      user: {
        select: {
          id: true,
          email: true,
          image: true,
        },
      },
    },
  })

  if (!teacher) return notFound()

  // Get workload data
  let workload:
    | {
        totalPeriods: number
        classCount: number
        subjectCount: number
        workloadStatus: "UNDERUTILIZED" | "NORMAL" | "OVERLOAD"
      }
    | undefined = undefined
  try {
    const timetableSlots =
      (await (db as any).timetableSlot?.findMany?.({
        where: { schoolId, teacherId: id },
      })) || []

    const workloadConfig = (await (db as any).workloadConfig?.findUnique?.({
      where: { schoolId },
    })) || {
      minPeriodsPerWeek: 15,
      maxPeriodsPerWeek: 25,
      overloadThreshold: 25,
    }

    const totalPeriods = timetableSlots.length
    const uniqueClasses = new Set(timetableSlots.map((s: any) => s.classId))
    const uniqueSubjects = new Set(timetableSlots.map((s: any) => s.subjectId))

    let workloadStatus: "UNDERUTILIZED" | "NORMAL" | "OVERLOAD" = "NORMAL"
    if (totalPeriods < workloadConfig.minPeriodsPerWeek) {
      workloadStatus = "UNDERUTILIZED"
    } else if (totalPeriods > workloadConfig.overloadThreshold) {
      workloadStatus = "OVERLOAD"
    }

    workload = {
      totalPeriods,
      classCount: uniqueClasses.size,
      subjectCount: uniqueSubjects.size,
      workloadStatus,
    }
  } catch {
    // Workload data optional
  }

  return (
    <ModalProvider>
      <TeacherDetailContent
        teacher={teacher}
        dictionary={dictionary.school}
        lang={lang}
        workload={workload}
      />
    </ModalProvider>
  )
}

export const metadata = { title: "Teacher Profile" }

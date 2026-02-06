import { notFound } from "next/navigation"
import { auth } from "@/auth"

import { getModel, safeQuery } from "@/lib/prisma-guards"
import { ModalProvider } from "@/components/atom/modal/context"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { getTenantContext } from "@/components/saas-dashboard/lib/tenant"
import { TeacherDetailContent } from "@/components/school-dashboard/listings/teachers/detail/content"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string; id: string }>
}

export default async function TeacherDetailPage({ params }: Props) {
  const { lang, id } = await params
  // Parallelize independent async operations to avoid request waterfalls
  const [dictionary, { schoolId }, session] = await Promise.all([
    getDictionary(lang),
    getTenantContext(),
    auth(),
  ])

  const teacherModel = getModel("teacher")
  if (!schoolId || !teacherModel) return notFound()

  // Fetch teacher with all related data
  const teacher = await teacherModel.findFirst({
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
              lang: true,
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
              lang: true,
            },
          },
        },
      },
      classes: {
        select: {
          id: true,
          className: true,
          lang: true,
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

  // Check if current user is the owner of this profile
  const isOwner = session?.user?.id === teacher.userId

  // Get workload data using type-safe queries
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
      (await safeQuery("timetableSlot", (model) =>
        model.findMany({ where: { schoolId, teacherId: id } })
      )) ?? []

    const workloadConfig = (await safeQuery("workloadConfig", (model) =>
      model.findUnique({ where: { schoolId } })
    )) ?? {
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
        isOwner={isOwner}
      />
    </ModalProvider>
  )
}

export const metadata = { title: "Teacher Profile" }

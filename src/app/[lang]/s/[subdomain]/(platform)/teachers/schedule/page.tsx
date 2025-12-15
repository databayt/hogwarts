import { db } from "@/lib/db"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { getTenantContext } from "@/components/operator/lib/tenant"
import TeacherScheduleContent from "@/components/platform/teachers/schedule/content"

export const metadata = { title: "Dashboard: Teacher Schedule" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function Page({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const { schoolId } = await getTenantContext()

  // Default workload config
  const defaultWorkloadConfig = {
    minPeriodsPerWeek: 15,
    normalPeriodsPerWeek: 20,
    maxPeriodsPerWeek: 25,
    overloadThreshold: 25,
  }

  // Get workload config for school
  const workloadConfig =
    (await (db as any).workloadConfig?.findUnique?.({
      where: { schoolId },
    })) || defaultWorkloadConfig

  // Get all teachers with their workload data
  const teachers =
    (await (db as any).teacher?.findMany?.({
      where: { schoolId },
      select: {
        id: true,
        givenName: true,
        surname: true,
        emailAddress: true,
        profilePhotoUrl: true,
        employmentStatus: true,
        employmentType: true,
        teacherDepartments: {
          select: {
            department: {
              select: {
                departmentName: true,
                departmentNameAr: true,
              },
            },
          },
        },
      },
      orderBy: { givenName: "asc" },
    })) || []

  // Calculate workload for each teacher
  const teachersWithWorkload = await Promise.all(
    teachers.map(async (teacher: any) => {
      // Get timetable slots for this teacher
      const slots =
        (await (db as any).timetableSlot?.findMany?.({
          where: { schoolId, teacherId: teacher.id },
        })) || []

      const totalPeriods = slots.length
      const uniqueClasses = new Set(slots.map((s: any) => s.classId))
      const uniqueSubjects = new Set(slots.map((s: any) => s.subjectId))

      // Determine workload status
      let workloadStatus: "UNDERUTILIZED" | "NORMAL" | "OVERLOAD" = "NORMAL"
      if (totalPeriods < workloadConfig.minPeriodsPerWeek) {
        workloadStatus = "UNDERUTILIZED"
      } else if (totalPeriods > workloadConfig.overloadThreshold) {
        workloadStatus = "OVERLOAD"
      }

      return {
        ...teacher,
        workload: {
          totalPeriods,
          classCount: uniqueClasses.size,
          subjectCount: uniqueSubjects.size,
          workloadStatus,
        },
      }
    })
  )

  return (
    <TeacherScheduleContent
      teachers={teachersWithWorkload}
      workloadConfig={workloadConfig}
      dictionary={dictionary.school}
      lang={lang}
    />
  )
}

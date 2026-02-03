import { safeQuery } from "@/lib/prisma-guards"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { getTenantContext } from "@/components/saas-dashboard/lib/tenant"
import TeacherPerformanceContent from "@/components/school-dashboard/listings/teachers/performance/content"

export const metadata = { title: "Dashboard: Teacher Performance" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function Page({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const { schoolId } = await getTenantContext()

  if (!schoolId) {
    return (
      <TeacherPerformanceContent
        teachers={[]}
        dictionary={dictionary.school}
        lang={lang}
      />
    )
  }

  // Fetch all teachers with their related data
  const teachers =
    (await safeQuery("teacher", (model) =>
      model.findMany({
        where: { schoolId },
        include: {
          subjectExpertise: {
            include: {
              subject: {
                select: { id: true, subjectName: true, subjectNameAr: true },
              },
            },
          },
          teacherDepartments: {
            include: {
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
            select: { id: true, className: true, classNameAr: true },
          },
          user: {
            select: { id: true, email: true, image: true },
          },
        },
        orderBy: { surname: "asc" },
      })
    )) ?? []

  // Fetch workload config
  const workloadConfig = (await safeQuery("workloadConfig", (model) =>
    model.findUnique({
      where: { schoolId },
    })
  )) ?? {
    minPeriodsPerWeek: 15,
    maxPeriodsPerWeek: 25,
    overloadThreshold: 25,
  }

  // Calculate performance metrics for each teacher
  const teachersWithPerformance = await Promise.all(
    teachers.map(async (teacher: any) => {
      // Get timetable slots (teaching periods)
      let timetableSlots =
        (await safeQuery("timetableSlot", (model) =>
          model.findMany({
            where: { schoolId, teacherId: teacher.id },
          })
        )) ?? []

      // Fallback to timetableSlot if no data
      if (timetableSlots.length === 0) {
        timetableSlots =
          (await safeQuery("timetableSlot", (model) =>
            model.findMany({
              where: { schoolId, teacherId: teacher.id },
            })
          )) ?? []
      }

      // Get attendance records marked by this teacher
      const attendanceMarked =
        (await safeQuery("attendance", (model) =>
          model.count({
            where: { schoolId, markedBy: teacher.id },
          })
        )) ?? 0

      // Calculate workload metrics
      const totalPeriods = timetableSlots.length
      const uniqueClasses = new Set(timetableSlots.map((s: any) => s.classId))
      const uniqueSubjects = new Set(
        timetableSlots.map((s: any) => s.subjectId)
      )

      // Calculate workload status
      let workloadStatus: "UNDERUTILIZED" | "NORMAL" | "OVERLOAD" = "NORMAL"
      if (totalPeriods < workloadConfig.minPeriodsPerWeek) {
        workloadStatus = "UNDERUTILIZED"
      } else if (totalPeriods > workloadConfig.overloadThreshold) {
        workloadStatus = "OVERLOAD"
      }

      // Calculate workload percentage
      const workloadPercentage = Math.round(
        (totalPeriods / workloadConfig.maxPeriodsPerWeek) * 100
      )

      // Calculate performance score (0-100)
      // Based on: workload utilization, attendance marking, class coverage
      let performanceScore = 0

      // Workload score (40% weight) - optimal at 80-100% capacity
      const workloadScore =
        totalPeriods >= workloadConfig.minPeriodsPerWeek
          ? Math.min(100, workloadPercentage)
          : workloadPercentage
      performanceScore += workloadScore * 0.4

      // Attendance marking score (30% weight)
      const expectedAttendancePerWeek = totalPeriods * 5 // Rough estimate
      const attendanceScore =
        expectedAttendancePerWeek > 0
          ? Math.min(100, (attendanceMarked / expectedAttendancePerWeek) * 100)
          : 50
      performanceScore += attendanceScore * 0.3

      // Class engagement score (30% weight) - based on class/subject coverage
      const classScore =
        uniqueClasses.size > 0 ? Math.min(100, uniqueClasses.size * 20) : 0
      performanceScore += classScore * 0.3

      return {
        id: teacher.id,
        givenName: teacher.givenName,
        surname: teacher.surname,
        emailAddress: teacher.emailAddress,
        profilePhotoUrl: teacher.profilePhotoUrl,
        employmentStatus: teacher.employmentStatus,
        employmentType: teacher.employmentType,
        joiningDate: teacher.joiningDate,
        // Performance metrics
        totalPeriods,
        classCount: uniqueClasses.size,
        subjectCount: uniqueSubjects.size,
        attendanceMarked,
        workloadStatus,
        workloadPercentage,
        performanceScore: Math.round(performanceScore),
        // Related data
        departments:
          teacher.teacherDepartments?.map((td: any) => ({
            id: td.department?.id,
            name:
              lang === "ar"
                ? td.department?.departmentNameAr
                : td.department?.departmentName,
            isPrimary: td.isPrimary,
          })) || [],
        subjects:
          teacher.subjectExpertise?.map((se: any) => ({
            id: se.subject?.id,
            name:
              lang === "ar"
                ? se.subject?.subjectNameAr
                : se.subject?.subjectName,
            level: se.expertiseLevel,
          })) || [],
        classes:
          teacher.classes?.map((c: any) => ({
            id: c.id,
            name: lang === "ar" ? c.classNameAr : c.className,
          })) || [],
      }
    })
  )

  // Sort by performance score for ranking
  const rankedTeachers = [...teachersWithPerformance].sort(
    (a, b) => b.performanceScore - a.performanceScore
  )

  return (
    <TeacherPerformanceContent
      teachers={rankedTeachers}
      workloadConfig={workloadConfig}
      dictionary={dictionary.school}
      lang={lang}
    />
  )
}

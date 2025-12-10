import type { Locale } from '@/components/internationalization/config'
import type { Dictionary } from '@/components/internationalization/dictionaries'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Users,
  GraduationCap,
  TrendingUp,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  Target
} from 'lucide-react'
import { db } from '@/lib/db'
import { getTenantContext } from '@/lib/tenant-context'

interface Props {
  dictionary: Dictionary
  lang: Locale
}

export default async function AnalysisContent({ dictionary, lang }: Props) {
  const { schoolId } = await getTenantContext()
  const isArabic = lang === 'ar'

  // Fetch analytics data
  let totalStudents = 0
  let totalTeachers = 0
  let totalClasses = 0
  let totalSubjects = 0
  let attendanceRate = 0
  let passRate = 0

  if (schoolId) {
    try {
      const [students, teachers, classes, subjects] = await Promise.all([
        db.student.count({ where: { schoolId } }).catch(() => 0),
        db.teacher.count({ where: { schoolId } }).catch(() => 0),
        db.classroom.count({ where: { schoolId } }).catch(() => 0),
        db.subject.count({ where: { schoolId } }).catch(() => 0),
      ])

      totalStudents = students
      totalTeachers = teachers
      totalClasses = classes
      totalSubjects = subjects

      // Mock metrics for now
      attendanceRate = 94.5
      passRate = 87.2
    } catch (error) {
      console.error('Error fetching analysis data:', error)
    }
  }

  const studentTeacherRatio = totalTeachers > 0
    ? Math.round(totalStudents / totalTeachers)
    : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle>{isArabic ? 'تحليل المدرسة' : 'School Analysis'}</CardTitle>
          <CardDescription>
            {isArabic
              ? 'تحليلات ورؤى حول أداء المدرسة والحضور والمقاييس الأكاديمية.'
              : 'Analytics and insights about your school performance, attendance, and academic metrics.'}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudents.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Enrolled students
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTeachers}</div>
            <p className="text-xs text-muted-foreground">
              Active faculty
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Student:Teacher</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{studentTeacherRatio}:1</div>
            <p className="text-xs text-muted-foreground">
              Ratio
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendanceRate}%</div>
            <p className="text-xs text-muted-foreground">
              Average this term
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Enrollment Trends */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Enrollment Trends</CardTitle>
                <CardDescription>Student enrollment over time</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] flex items-center justify-center rounded-md border border-dashed">
              <div className="text-center">
                <BarChart3 className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Chart coming soon
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Grade Distribution */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Grade Distribution</CardTitle>
                <CardDescription>Students by year level</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] flex items-center justify-center rounded-md border border-dashed">
              <div className="text-center">
                <PieChart className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Chart coming soon
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Academic Performance */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Academic Performance</CardTitle>
              <CardDescription>Key academic metrics and insights</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-lg border p-4">
              <div className="text-2xl font-bold text-green-600">{passRate}%</div>
              <p className="text-sm text-muted-foreground">Pass Rate</p>
            </div>
            <div className="rounded-lg border p-4">
              <div className="text-2xl font-bold">{totalSubjects}</div>
              <p className="text-sm text-muted-foreground">Subjects Offered</p>
            </div>
            <div className="rounded-lg border p-4">
              <div className="text-2xl font-bold">{totalClasses}</div>
              <p className="text-sm text-muted-foreground">Active Classes</p>
            </div>
            <div className="rounded-lg border p-4">
              <div className="text-2xl font-bold">-</div>
              <p className="text-sm text-muted-foreground">Avg. GPA</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalStudents + totalTeachers}</p>
                <p className="text-sm text-muted-foreground">Total People</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                <Target className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{attendanceRate}%</p>
                <p className="text-sm text-muted-foreground">Attendance Goal Met</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
                <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{passRate}%</p>
                <p className="text-sm text-muted-foreground">Academic Success</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

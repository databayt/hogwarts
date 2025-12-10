import type { Locale } from '@/components/internationalization/config'
import type { Dictionary } from '@/components/internationalization/dictionaries'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { School, Calendar, Building, Users, CheckCircle2, AlertCircle } from "lucide-react"
import { db } from '@/lib/db'
import { getTenantContext } from '@/lib/tenant-context'
import { SchoolIdentityForm } from './school-identity-form'
import { CapacitySection } from './capacity-section'
import { AcademicSection } from './academic-section'

interface Props {
  dictionary: Dictionary
  lang: Locale
}

export default async function ConfigurationContent({ dictionary, lang }: Props) {
  const { schoolId } = await getTenantContext()

  // Get comprehensive configuration data
  let schoolInfo: any = null
  let academicYearsCount = 0
  let termsCount = 0
  let yearLevelsCount = 0
  let departmentsCount = 0
  let classroomsCount = 0
  let teachersCount = 0
  let studentsCount = 0
  let scoreRangesCount = 0
  let currentAcademicYear: any = null

  if (schoolId) {
    try {
      ;[
        schoolInfo,
        academicYearsCount,
        termsCount,
        yearLevelsCount,
        departmentsCount,
        classroomsCount,
        teachersCount,
        studentsCount,
        scoreRangesCount,
        currentAcademicYear,
      ] = await Promise.all([
        db.school.findUnique({
          where: { id: schoolId },
        }).catch(() => null),
        db.schoolYear.count({ where: { schoolId } }).catch(() => 0),
        db.term.count({ where: { schoolId } }).catch(() => 0),
        db.yearLevel.count({ where: { schoolId } }).catch(() => 0),
        db.department.count({ where: { schoolId } }).catch(() => 0),
        db.classroom.count({ where: { schoolId } }).catch(() => 0),
        db.teacher.count({ where: { schoolId } }).catch(() => 0),
        db.student.count({ where: { schoolId } }).catch(() => 0),
        db.scoreRange.count({ where: { schoolId } }).catch(() => 0),
        db.schoolYear.findFirst({
          where: { schoolId },
          orderBy: { startDate: 'desc' },
          include: { terms: true },
        }).catch(() => null),
      ])
    } catch (error) {
      console.error('Error fetching configuration data:', error)
    }
  }

  // Calculate setup completion (removed Branding step)
  const setupSteps = [
    { name: 'School Profile', completed: !!schoolInfo?.name },
    { name: 'Location', completed: !!schoolInfo?.address },
    { name: 'Academic Year', completed: academicYearsCount > 0 },
    { name: 'Year Levels', completed: yearLevelsCount > 0 },
    { name: 'Departments', completed: departmentsCount > 0 },
    { name: 'Grading System', completed: scoreRangesCount > 0 },
  ]
  const completedSteps = setupSteps.filter(s => s.completed).length
  const setupProgress = Math.round((completedSteps / setupSteps.length) * 100)

  return (
    <div className="space-y-6">
      {/* Quick Stats Row */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">School Profile</CardTitle>
            <School className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {schoolInfo?.name ? 'Configured' : 'Not Set'}
            </div>
            <p className="text-xs text-muted-foreground">
              {schoolInfo?.name || 'Configure school details'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Academic Years</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{academicYearsCount}</div>
            <p className="text-xs text-muted-foreground">
              {termsCount} terms configured
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Departments</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{departmentsCount}</div>
            <p className="text-xs text-muted-foreground">
              Academic departments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Classrooms</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{classroomsCount}</div>
            <p className="text-xs text-muted-foreground">
              {yearLevelsCount} year levels
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Setup Progress */}
      {setupProgress < 100 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-primary" />
                Complete Your School Setup
              </CardTitle>
              <Badge variant="secondary">{completedSteps}/{setupSteps.length} Steps</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Progress value={setupProgress} className="h-2" />
            <div className="flex flex-wrap gap-2">
              {setupSteps.map((step, index) => (
                <Badge
                  key={index}
                  variant={step.completed ? "default" : "outline"}
                  className="gap-1"
                >
                  {step.completed ? (
                    <CheckCircle2 className="h-3 w-3" />
                  ) : (
                    <AlertCircle className="h-3 w-3" />
                  )}
                  {step.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* School Identity Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <School className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>School Identity</CardTitle>
                <CardDescription>Basic information about your school</CardDescription>
              </div>
            </div>
            {schoolInfo?.name && (
              <Badge variant="outline" className="gap-1">
                <CheckCircle2 className="h-3 w-3 text-green-500" />
                Configured
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <SchoolIdentityForm
            schoolId={schoolId || ''}
            initialData={{
              name: schoolInfo?.name || '',
              domain: schoolInfo?.domain || '',
              email: schoolInfo?.email || '',
              phoneNumber: schoolInfo?.phoneNumber || '',
              address: schoolInfo?.address || '',
              website: schoolInfo?.website || '',
              timezone: schoolInfo?.timezone || 'Africa/Khartoum',
            }}
            lang={lang}
          />
        </CardContent>
      </Card>

      {/* School Capacity Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <CardTitle>School Capacity</CardTitle>
                <CardDescription>Students, teachers, and facilities overview</CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <CapacitySection
            schoolId={schoolId || ''}
            initialData={{
              studentCount: studentsCount,
              teacherCount: teachersCount,
              classroomCount: classroomsCount,
              departmentCount: departmentsCount,
            }}
            lang={lang}
          />
        </CardContent>
      </Card>

      {/* Academic Structure Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-green-500" />
              <div>
                <CardTitle>Academic Structure</CardTitle>
                <CardDescription>Years, terms, grading, and schedule</CardDescription>
              </div>
            </div>
            {currentAcademicYear && (
              <Badge variant="outline" className="gap-1">
                <CheckCircle2 className="h-3 w-3 text-green-500" />
                {currentAcademicYear.yearName}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <AcademicSection
            schoolId={schoolId || ''}
            currentAcademicYear={currentAcademicYear}
            stats={{
              academicYears: academicYearsCount,
              terms: termsCount,
              yearLevels: yearLevelsCount,
              scoreRanges: scoreRangesCount,
            }}
            lang={lang}
          />
        </CardContent>
      </Card>
    </div>
  )
}

import PageHeader from '@/components/atom/page-header'
import type { Locale } from '@/components/internationalization/config'
import type { Dictionary } from '@/components/internationalization/dictionaries'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  School,
  Calendar,
  Building,
  GraduationCap,
  Palette,
  FileText,
  Settings,
  Users,
  Clock,
  Globe,
  BookOpen,
  Layers,
} from 'lucide-react'
import Link from 'next/link'
import { db } from '@/lib/db'
import { getTenantContext } from '@/lib/tenant-context'

interface Props {
  dictionary: Dictionary
  lang: Locale
}

export default async function ConfigurationContent({ dictionary, lang }: Props) {
  const { schoolId } = await getTenantContext()

  // Get configuration stats
  let schoolInfo: any = null
  let academicYearsCount = 0
  let termsCount = 0
  let yearLevelsCount = 0
  let departmentsCount = 0
  let classroomsCount = 0
  let classroomTypesCount = 0
  let scoreRangesCount = 0

  if (schoolId) {
    try {
      ;[
        schoolInfo,
        academicYearsCount,
        termsCount,
        yearLevelsCount,
        departmentsCount,
        classroomsCount,
        classroomTypesCount,
        scoreRangesCount,
      ] = await Promise.all([
        db.school.findUnique({
          where: { id: schoolId },
          include: {
            branding: true
          }
        }).catch(() => null),
        db.schoolYear.count({ where: { schoolId } }).catch(() => 0),
        db.term.count({ where: { schoolId } }).catch(() => 0),
        db.yearLevel.count({ where: { schoolId } }).catch(() => 0),
        db.department.count({ where: { schoolId } }).catch(() => 0),
        db.classroom.count({ where: { schoolId } }).catch(() => 0),
        db.classroomType.count({ where: { schoolId } }).catch(() => 0),
        db.scoreRange.count({ where: { schoolId } }).catch(() => 0),
      ])
    } catch (error) {
      console.error('Error fetching configuration data:', error)
    }
  }

  const d = dictionary?.admin

  return (
    <div className="space-y-6">
      <PageHeader
        title={d?.navigation?.configuration || 'Configuration'}
        description={d?.cards?.configuration?.description || 'School settings and academic configuration'}
        className="text-start max-w-none"
      />

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">School Profile</CardTitle>
            <School className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {schoolInfo ? 'Configured' : 'Not Set'}
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
              {classroomTypesCount} types defined
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Configuration Sections */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* School Profile */}
        <Card className="border-primary/20 hover:border-primary/40 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <School className="h-5 w-5 text-primary" />
              School Profile
            </CardTitle>
            <CardDescription>
              Basic school information and settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Configure school name, contact information, address, logo, and other essential details.
            </p>
            <div className="flex flex-col gap-2">
              <Button asChild>
                <Link href={`/${lang}/admin/configuration/school`}>
                  <Settings className="mr-2 h-4 w-4" />
                  Configure School
                </Link>
              </Button>
              {schoolInfo && (
                <div className="text-xs space-y-1 mt-2">
                  <p><span className="font-medium">Name:</span> {schoolInfo.name}</p>
                  <p><span className="font-medium">Type:</span> {schoolInfo.type}</p>
                  <p><span className="font-medium">Email:</span> {schoolInfo.email}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Branding */}
        <Card className="border-blue-500/20 hover:border-blue-500/40 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-blue-500" />
              School Branding
            </CardTitle>
            <CardDescription>
              Logo, colors, and visual identity
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Customize school logo, primary colors, secondary colors, and other branding elements.
            </p>
            <div className="flex flex-col gap-2">
              <Button asChild variant="secondary">
                <Link href={`/${lang}/admin/configuration/branding`}>
                  <Palette className="mr-2 h-4 w-4" />
                  Configure Branding
                </Link>
              </Button>
              {schoolInfo?.branding && (
                <div className="flex gap-2 mt-2">
                  {schoolInfo.branding.primaryColor && (
                    <div
                      className="w-8 h-8 rounded border"
                      style={{ backgroundColor: schoolInfo.branding.primaryColor }}
                      title="Primary Color"
                    />
                  )}
                  {schoolInfo.branding.secondaryColor && (
                    <div
                      className="w-8 h-8 rounded border"
                      style={{ backgroundColor: schoolInfo.branding.secondaryColor }}
                      title="Secondary Color"
                    />
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Academic Structure */}
        <Card className="border-green-500/20 hover:border-green-500/40 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-green-500" />
              Academic Structure
            </CardTitle>
            <CardDescription>
              Years, terms, and periods
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Set up academic years, terms, periods, and holiday schedules for your school calendar.
            </p>
            <div className="flex flex-col gap-2">
              <Button asChild variant="secondary">
                <Link href={`/${lang}/admin/configuration/academic`}>
                  <Calendar className="mr-2 h-4 w-4" />
                  Configure Academic
                </Link>
              </Button>
              <div className="text-xs space-y-1 mt-2">
                <p><span className="font-medium">Academic Years:</span> {academicYearsCount}</p>
                <p><span className="font-medium">Terms:</span> {termsCount}</p>
                <p><span className="font-medium">Year Levels:</span> {yearLevelsCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Departments */}
        <Card className="border-purple-500/20 hover:border-purple-500/40 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5 text-purple-500" />
              Departments
            </CardTitle>
            <CardDescription>
              Academic departments and units
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Manage academic departments, assign department heads, and organize subjects by department.
            </p>
            <div className="flex flex-col gap-2">
              <Button asChild variant="secondary">
                <Link href={`/${lang}/admin/configuration/departments`}>
                  <Building className="mr-2 h-4 w-4" />
                  Manage Departments
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href={`/${lang}/admin/configuration/departments/new`}>
                  Add Department
                </Link>
              </Button>
              <p className="text-xs mt-2">
                <span className="font-medium">Total:</span> {departmentsCount} departments
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Classrooms */}
        <Card className="border-orange-500/20 hover:border-orange-500/40 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-orange-500" />
              Classrooms
            </CardTitle>
            <CardDescription>
              Physical and virtual classrooms
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Configure classroom types, capacities, facilities, and assign classrooms to departments.
            </p>
            <div className="flex flex-col gap-2">
              <Button asChild variant="secondary">
                <Link href={`/${lang}/admin/configuration/classrooms`}>
                  <Users className="mr-2 h-4 w-4" />
                  Manage Classrooms
                </Link>
              </Button>
              <div className="text-xs space-y-1 mt-2">
                <p><span className="font-medium">Total Classrooms:</span> {classroomsCount}</p>
                <p><span className="font-medium">Classroom Types:</span> {classroomTypesCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Grading System */}
        <Card className="border-red-500/20 hover:border-red-500/40 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-red-500" />
              Grading System
            </CardTitle>
            <CardDescription>
              Grades, scales, and assessment
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Define grading scales, score ranges, GPA calculations, and assessment criteria.
            </p>
            <div className="flex flex-col gap-2">
              <Button asChild variant="secondary">
                <Link href={`/${lang}/admin/configuration/grading`}>
                  <GraduationCap className="mr-2 h-4 w-4" />
                  Configure Grading
                </Link>
              </Button>
              <p className="text-xs mt-2">
                <span className="font-medium">Score Ranges:</span> {scoreRangesCount} defined
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Timetable Settings */}
        <Card className="border-cyan-500/20 hover:border-cyan-500/40 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-cyan-500" />
              Timetable Settings
            </CardTitle>
            <CardDescription>
              School week and schedule configuration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Configure school week, daily schedule, period durations, and break times.
            </p>
            <div className="flex flex-col gap-2">
              <Button asChild variant="secondary">
                <Link href={`/${lang}/admin/configuration/timetable`}>
                  <Clock className="mr-2 h-4 w-4" />
                  Configure Timetable
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Localization */}
        <Card className="border-indigo-500/20 hover:border-indigo-500/40 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-indigo-500" />
              Localization
            </CardTitle>
            <CardDescription>
              Language and regional settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Configure default language, timezone, date format, currency, and regional preferences.
            </p>
            <div className="flex flex-col gap-2">
              <Button asChild variant="secondary">
                <Link href={`/${lang}/admin/configuration/localization`}>
                  <Globe className="mr-2 h-4 w-4" />
                  Configure Localization
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Configuration Workflow */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration Checklist</CardTitle>
          <CardDescription>
            Complete these steps to fully configure your school platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3">
            <li className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">
                1
              </div>
              <div className="space-y-1">
                <p className="font-medium text-sm">Set up school profile</p>
                <p className="text-xs text-muted-foreground">
                  Add school name, contact information, and basic details
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">
                2
              </div>
              <div className="space-y-1">
                <p className="font-medium text-sm">Configure academic structure</p>
                <p className="text-xs text-muted-foreground">
                  Define academic years, terms, and periods
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">
                3
              </div>
              <div className="space-y-1">
                <p className="font-medium text-sm">Create departments</p>
                <p className="text-xs text-muted-foreground">
                  Add academic departments and assign department heads
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">
                4
              </div>
              <div className="space-y-1">
                <p className="font-medium text-sm">Set up grading system</p>
                <p className="text-xs text-muted-foreground">
                  Define grading scales and assessment criteria
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">
                5
              </div>
              <div className="space-y-1">
                <p className="font-medium text-sm">Customize branding</p>
                <p className="text-xs text-muted-foreground">
                  Upload logo and set school colors
                </p>
              </div>
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}
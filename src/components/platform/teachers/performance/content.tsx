/**
 * Teacher Performance Analytics Content
 *
 * Displays comprehensive teacher performance metrics and rankings with multi-dimensional analysis:
 * - Summary stats: total count, average performance score, workload distribution
 * - Three interactive views: Overview (charts), Ranking (sortable table), Metrics (grid cards)
 * - Filters: search by name/email, employment status, performance level
 * - Workload assessment: categorizes teachers as UNDERUTILIZED, NORMAL, or OVERLOAD
 *
 * Client component strategy:
 * - Server passes pre-fetched teacher data (list with computed scores)
 * - Client handles filtering, sorting, and UI state
 * - Avoids re-queries unless data refresh is triggered
 *
 * Multi-tenant: Data is pre-filtered on server by schoolId before reaching component
 * i18n: Fully bilingual with dynamic string interpolation for Arabic/English
 */
'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Search,
  TrendingUp,
  TrendingDown,
  Award,
  Users,
  Clock,
  BookOpen,
  ClipboardCheck,
  BarChart3,
  Trophy,
  Medal,
  Star,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Filter,
  Download
} from 'lucide-react'
import { type Dictionary } from '@/components/internationalization/dictionaries'
import { type Locale } from '@/components/internationalization/config'
import Link from 'next/link'

interface TeacherPerformance {
  id: string
  givenName: string
  surname: string
  emailAddress?: string
  profilePhotoUrl?: string
  employmentStatus?: string
  employmentType?: string
  joiningDate?: Date
  totalPeriods: number
  classCount: number
  subjectCount: number
  attendanceMarked: number
  workloadStatus: 'UNDERUTILIZED' | 'NORMAL' | 'OVERLOAD'
  workloadPercentage: number
  performanceScore: number
  departments: { id: string; name: string; isPrimary: boolean }[]
  subjects: { id: string; name: string; level: string }[]
  classes: { id: string; name: string }[]
}

interface WorkloadConfig {
  minPeriodsPerWeek: number
  maxPeriodsPerWeek: number
  overloadThreshold: number
}

interface Props {
  teachers: TeacherPerformance[]
  workloadConfig?: WorkloadConfig
  dictionary: Dictionary['school']
  lang: Locale
}

export default function TeacherPerformanceContent({
  teachers,
  workloadConfig,
  dictionary,
  lang
}: Props) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [performanceFilter, setPerformanceFilter] = useState<string>('all')

  const t = {
    title: lang === 'ar' ? 'تحليلات الأداء' : 'Performance Analytics',
    subtitle: lang === 'ar' ? 'تتبع وتحليل أداء المعلمين' : 'Track and analyze teacher performance',
    search: lang === 'ar' ? 'بحث عن معلم...' : 'Search for a teacher...',
    allStatuses: lang === 'ar' ? 'جميع الحالات' : 'All Statuses',
    active: lang === 'ar' ? 'نشط' : 'Active',
    inactive: lang === 'ar' ? 'غير نشط' : 'Inactive',
    allPerformance: lang === 'ar' ? 'جميع المستويات' : 'All Levels',
    excellent: lang === 'ar' ? 'ممتاز' : 'Excellent',
    good: lang === 'ar' ? 'جيد' : 'Good',
    needsImprovement: lang === 'ar' ? 'يحتاج تحسين' : 'Needs Improvement',
    overview: lang === 'ar' ? 'نظرة عامة' : 'Overview',
    ranking: lang === 'ar' ? 'الترتيب' : 'Ranking',
    metrics: lang === 'ar' ? 'المقاييس' : 'Metrics',
    totalTeachers: lang === 'ar' ? 'إجمالي المعلمين' : 'Total Teachers',
    avgPerformance: lang === 'ar' ? 'متوسط الأداء' : 'Avg. Performance',
    avgWorkload: lang === 'ar' ? 'متوسط العبء' : 'Avg. Workload',
    topPerformers: lang === 'ar' ? 'أفضل المعلمين' : 'Top Performers',
    attendanceMarked: lang === 'ar' ? 'الحضور المسجل' : 'Attendance Marked',
    periods: lang === 'ar' ? 'الحصص' : 'Periods',
    classes: lang === 'ar' ? 'الفصول' : 'Classes',
    subjects: lang === 'ar' ? 'المواد' : 'Subjects',
    score: lang === 'ar' ? 'الدرجة' : 'Score',
    rank: lang === 'ar' ? 'الترتيب' : 'Rank',
    teacher: lang === 'ar' ? 'المعلم' : 'Teacher',
    department: lang === 'ar' ? 'القسم' : 'Department',
    workload: lang === 'ar' ? 'العبء' : 'Workload',
    performance: lang === 'ar' ? 'الأداء' : 'Performance',
    details: lang === 'ar' ? 'التفاصيل' : 'Details',
    noTeachers: lang === 'ar' ? 'لا يوجد معلمون' : 'No teachers found',
    exportReport: lang === 'ar' ? 'تصدير التقرير' : 'Export Report',
    underutilized: lang === 'ar' ? 'أقل من المطلوب' : 'Underutilized',
    normal: lang === 'ar' ? 'طبيعي' : 'Normal',
    overload: lang === 'ar' ? 'زائد' : 'Overload',
    performanceBreakdown: lang === 'ar' ? 'تحليل الأداء' : 'Performance Breakdown',
    workloadDistribution: lang === 'ar' ? 'توزيع العبء' : 'Workload Distribution',
  }

  // Filter teachers based on search and filters
  const filteredTeachers = useMemo(() => {
    return teachers.filter((teacher) => {
      // Search filter
      const fullName = `${teacher.givenName} ${teacher.surname}`.toLowerCase()
      const matchesSearch = searchQuery === '' || fullName.includes(searchQuery.toLowerCase())

      // Status filter
      const matchesStatus = statusFilter === 'all' ||
        (statusFilter === 'active' && teacher.employmentStatus === 'ACTIVE') ||
        (statusFilter === 'inactive' && teacher.employmentStatus !== 'ACTIVE')

      // Performance filter
      let matchesPerformance = true
      if (performanceFilter === 'excellent') {
        matchesPerformance = teacher.performanceScore >= 80
      } else if (performanceFilter === 'good') {
        matchesPerformance = teacher.performanceScore >= 50 && teacher.performanceScore < 80
      } else if (performanceFilter === 'needs-improvement') {
        matchesPerformance = teacher.performanceScore < 50
      }

      return matchesSearch && matchesStatus && matchesPerformance
    })
  }, [teachers, searchQuery, statusFilter, performanceFilter])

  // Calculate summary statistics across all teachers
  // Includes performance bands, workload distribution, and aggregates
  const stats = useMemo(() => {
    if (teachers.length === 0) {
      return {
        total: 0,
        avgPerformance: 0,
        avgWorkload: 0,
        totalAttendance: 0,
        excellentCount: 0,
        goodCount: 0,
        needsImprovementCount: 0,
        underutilizedCount: 0,
        normalCount: 0,
        overloadCount: 0
      }
    }

    const total = teachers.length
    // Average performance score (0-100) rounded to nearest integer for dashboard display
    const avgPerformance = Math.round(
      teachers.reduce((sum, t) => sum + t.performanceScore, 0) / total
    )
    // Average workload percentage across all teachers, rounded for UI consistency
    const avgWorkload = Math.round(
      teachers.reduce((sum, t) => sum + t.workloadPercentage, 0) / total
    )
    // Total attendance marking events across all teachers (for volume metrics)
    const totalAttendance = teachers.reduce((sum, t) => sum + t.attendanceMarked, 0)

    return {
      total,
      avgPerformance,
      avgWorkload,
      totalAttendance,
      excellentCount: teachers.filter((t) => t.performanceScore >= 80).length,
      goodCount: teachers.filter((t) => t.performanceScore >= 50 && t.performanceScore < 80).length,
      needsImprovementCount: teachers.filter((t) => t.performanceScore < 50).length,
      underutilizedCount: teachers.filter((t) => t.workloadStatus === 'UNDERUTILIZED').length,
      normalCount: teachers.filter((t) => t.workloadStatus === 'NORMAL').length,
      overloadCount: teachers.filter((t) => t.workloadStatus === 'OVERLOAD').length
    }
  }, [teachers])

  // Get top 3 performers
  const topPerformers = useMemo(() => {
    return teachers.slice(0, 3)
  }, [teachers])

  const getPerformanceColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 50) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getPerformanceBadge = (score: number) => {
    if (score >= 80) return { label: t.excellent, variant: 'default' as const, className: 'bg-green-100 text-green-800' }
    if (score >= 50) return { label: t.good, variant: 'secondary' as const, className: 'bg-yellow-100 text-yellow-800' }
    return { label: t.needsImprovement, variant: 'destructive' as const, className: 'bg-red-100 text-red-800' }
  }

  const getWorkloadBadge = (status: string) => {
    switch (status) {
      case 'UNDERUTILIZED':
        return { label: t.underutilized, className: 'bg-blue-100 text-blue-800' }
      case 'NORMAL':
        return { label: t.normal, className: 'bg-green-100 text-green-800' }
      case 'OVERLOAD':
        return { label: t.overload, className: 'bg-red-100 text-red-800' }
      default:
        return { label: status, className: 'bg-gray-100 text-gray-800' }
    }
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />
      case 3:
        return <Medal className="h-5 w-5 text-amber-600" />
      default:
        return <span className="text-sm font-medium text-muted-foreground">#{rank}</span>
    }
  }

  const getInitials = (givenName: string, surname: string) => {
    return `${givenName?.charAt(0) || ''}${surname?.charAt(0) || ''}`.toUpperCase()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t.title}</h1>
          <p className="text-muted-foreground">{t.subtitle}</p>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          {t.exportReport}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t.totalTeachers}</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t.avgPerformance}</p>
                <p className={`text-2xl font-bold ${getPerformanceColor(stats.avgPerformance)}`}>
                  {stats.avgPerformance}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t.avgWorkload}</p>
                <p className="text-2xl font-bold">{stats.avgWorkload}%</p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t.attendanceMarked}</p>
                <p className="text-2xl font-bold">{stats.totalAttendance.toLocaleString()}</p>
              </div>
              <ClipboardCheck className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">
            <BarChart3 className="mr-2 h-4 w-4" />
            {t.overview}
          </TabsTrigger>
          <TabsTrigger value="ranking">
            <Trophy className="mr-2 h-4 w-4" />
            {t.ranking}
          </TabsTrigger>
          <TabsTrigger value="metrics">
            <TrendingUp className="mr-2 h-4 w-4" />
            {t.metrics}
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Top Performers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-yellow-500" />
                  {t.topPerformers}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {topPerformers.length > 0 ? (
                  <div className="space-y-4">
                    {topPerformers.map((teacher, index) => (
                      <div key={teacher.id} className="flex items-center gap-4">
                        <div className="flex h-8 w-8 items-center justify-center">
                          {getRankIcon(index + 1)}
                        </div>
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={teacher.profilePhotoUrl || ''} />
                          <AvatarFallback>
                            {getInitials(teacher.givenName, teacher.surname)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium">
                            {teacher.givenName} {teacher.surname}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {teacher.departments[0]?.name || '-'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`text-lg font-bold ${getPerformanceColor(teacher.performanceScore)}`}>
                            {teacher.performanceScore}%
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-4">{t.noTeachers}</p>
                )}
              </CardContent>
            </Card>

            {/* Performance Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>{t.performanceBreakdown}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-green-500" />
                      <span className="text-sm">{t.excellent} (80%+)</span>
                    </div>
                    <span className="font-medium">{stats.excellentCount}</span>
                  </div>
                  <Progress
                    value={stats.total > 0 ? (stats.excellentCount / stats.total) * 100 : 0}
                    className="h-2 bg-green-100"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-yellow-500" />
                      <span className="text-sm">{t.good} (50-79%)</span>
                    </div>
                    <span className="font-medium">{stats.goodCount}</span>
                  </div>
                  <Progress
                    value={stats.total > 0 ? (stats.goodCount / stats.total) * 100 : 0}
                    className="h-2 bg-yellow-100"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-red-500" />
                      <span className="text-sm">{t.needsImprovement} (&lt;50%)</span>
                    </div>
                    <span className="font-medium">{stats.needsImprovementCount}</span>
                  </div>
                  <Progress
                    value={stats.total > 0 ? (stats.needsImprovementCount / stats.total) * 100 : 0}
                    className="h-2 bg-red-100"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Workload Distribution */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>{t.workloadDistribution}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-lg border p-4 text-center">
                    <div className="mb-2 flex items-center justify-center">
                      <TrendingDown className="h-6 w-6 text-blue-500" />
                    </div>
                    <p className="text-2xl font-bold text-blue-600">{stats.underutilizedCount}</p>
                    <p className="text-sm text-muted-foreground">{t.underutilized}</p>
                    <p className="text-xs text-muted-foreground">
                      &lt;{workloadConfig?.minPeriodsPerWeek || 15} {t.periods}
                    </p>
                  </div>

                  <div className="rounded-lg border p-4 text-center">
                    <div className="mb-2 flex items-center justify-center">
                      <Minus className="h-6 w-6 text-green-500" />
                    </div>
                    <p className="text-2xl font-bold text-green-600">{stats.normalCount}</p>
                    <p className="text-sm text-muted-foreground">{t.normal}</p>
                    <p className="text-xs text-muted-foreground">
                      {workloadConfig?.minPeriodsPerWeek || 15}-{workloadConfig?.overloadThreshold || 25} {t.periods}
                    </p>
                  </div>

                  <div className="rounded-lg border p-4 text-center">
                    <div className="mb-2 flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-red-500" />
                    </div>
                    <p className="text-2xl font-bold text-red-600">{stats.overloadCount}</p>
                    <p className="text-sm text-muted-foreground">{t.overload}</p>
                    <p className="text-xs text-muted-foreground">
                      &gt;{workloadConfig?.overloadThreshold || 25} {t.periods}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Ranking Tab */}
        <TabsContent value="ranking" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder={t.search}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder={t.allStatuses} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t.allStatuses}</SelectItem>
                    <SelectItem value="active">{t.active}</SelectItem>
                    <SelectItem value="inactive">{t.inactive}</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={performanceFilter} onValueChange={setPerformanceFilter}>
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder={t.allPerformance} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t.allPerformance}</SelectItem>
                    <SelectItem value="excellent">{t.excellent}</SelectItem>
                    <SelectItem value="good">{t.good}</SelectItem>
                    <SelectItem value="needs-improvement">{t.needsImprovement}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Ranking Table */}
          <Card>
            <CardContent className="p-0">
              {filteredTeachers.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[60px]">{t.rank}</TableHead>
                      <TableHead>{t.teacher}</TableHead>
                      <TableHead>{t.department}</TableHead>
                      <TableHead className="text-center">{t.periods}</TableHead>
                      <TableHead className="text-center">{t.classes}</TableHead>
                      <TableHead className="text-center">{t.workload}</TableHead>
                      <TableHead className="text-center">{t.score}</TableHead>
                      <TableHead>{t.details}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTeachers.map((teacher, index) => {
                      const performanceBadge = getPerformanceBadge(teacher.performanceScore)
                      const workloadBadge = getWorkloadBadge(teacher.workloadStatus)
                      // Find original rank in full list
                      const originalRank = teachers.findIndex((t) => t.id === teacher.id) + 1

                      return (
                        <TableRow key={teacher.id}>
                          <TableCell>
                            <div className="flex items-center justify-center">
                              {getRankIcon(originalRank)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={teacher.profilePhotoUrl || ''} />
                                <AvatarFallback className="text-xs">
                                  {getInitials(teacher.givenName, teacher.surname)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">
                                  {teacher.givenName} {teacher.surname}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {teacher.emailAddress}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {teacher.departments[0]?.name || '-'}
                          </TableCell>
                          <TableCell className="text-center">
                            {teacher.totalPeriods}
                          </TableCell>
                          <TableCell className="text-center">
                            {teacher.classCount}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="secondary" className={workloadBadge.className}>
                              {workloadBadge.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex flex-col items-center gap-1">
                              <span className={`text-lg font-bold ${getPerformanceColor(teacher.performanceScore)}`}>
                                {teacher.performanceScore}%
                              </span>
                              <Progress
                                value={teacher.performanceScore}
                                className="h-1.5 w-16"
                              />
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/${lang}/teachers/${teacher.id}`}>
                                <ArrowUpRight className="h-4 w-4" />
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Users className="mb-4 h-12 w-12" />
                  <p>{t.noTeachers}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Metrics Tab */}
        <TabsContent value="metrics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredTeachers.slice(0, 9).map((teacher) => {
              const performanceBadge = getPerformanceBadge(teacher.performanceScore)
              const workloadBadge = getWorkloadBadge(teacher.workloadStatus)

              return (
                <Card key={teacher.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={teacher.profilePhotoUrl || ''} />
                          <AvatarFallback>
                            {getInitials(teacher.givenName, teacher.surname)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-base">
                            {teacher.givenName} {teacher.surname}
                          </CardTitle>
                          <CardDescription>
                            {teacher.departments[0]?.name || '-'}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge variant="secondary" className={performanceBadge.className}>
                        {teacher.performanceScore}%
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{t.performance}</span>
                          <span className={getPerformanceColor(teacher.performanceScore)}>
                            {performanceBadge.label}
                          </span>
                        </div>
                        <Progress value={teacher.performanceScore} className="h-2" />
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="rounded-lg bg-muted/50 p-2">
                          <Clock className="mx-auto mb-1 h-4 w-4 text-muted-foreground" />
                          <p className="text-lg font-semibold">{teacher.totalPeriods}</p>
                          <p className="text-xs text-muted-foreground">{t.periods}</p>
                        </div>
                        <div className="rounded-lg bg-muted/50 p-2">
                          <Users className="mx-auto mb-1 h-4 w-4 text-muted-foreground" />
                          <p className="text-lg font-semibold">{teacher.classCount}</p>
                          <p className="text-xs text-muted-foreground">{t.classes}</p>
                        </div>
                        <div className="rounded-lg bg-muted/50 p-2">
                          <BookOpen className="mx-auto mb-1 h-4 w-4 text-muted-foreground" />
                          <p className="text-lg font-semibold">{teacher.subjectCount}</p>
                          <p className="text-xs text-muted-foreground">{t.subjects}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className={workloadBadge.className}>
                          {workloadBadge.label}
                        </Badge>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/${lang}/teachers/${teacher.id}`}>
                            {t.details}
                            <ArrowUpRight className="ml-1 h-3 w-3" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {filteredTeachers.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <BarChart3 className="mb-4 h-12 w-12" />
                <p>{t.noTeachers}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

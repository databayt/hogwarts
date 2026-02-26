"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useMemo, useState } from "react"
import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  Clock,
  Minus,
  Search,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

// ============================================================================
// Types
// ============================================================================

interface TeacherScheduleData {
  id: string
  givenName: string
  surname: string
  emailAddress: string
  profilePhotoUrl?: string | null
  employmentStatus: string
  employmentType: string
  teacherDepartments?: Array<{
    department: {
      departmentName: string
      lang?: string
    }
  }>
  workload: {
    totalPeriods: number
    classCount: number
    subjectCount: number
    workloadStatus: "UNDERUTILIZED" | "NORMAL" | "OVERLOAD"
  }
}

interface WorkloadConfig {
  minPeriodsPerWeek: number
  normalPeriodsPerWeek: number
  maxPeriodsPerWeek: number
  overloadThreshold: number
}

interface Props {
  teachers: TeacherScheduleData[]
  workloadConfig: WorkloadConfig
  dictionary?: Dictionary["school"]
  lang: Locale
}

// ============================================================================
// Helper Functions
// ============================================================================

function getInitials(givenName: string, surname: string): string {
  return `${givenName.charAt(0)}${surname.charAt(0)}`.toUpperCase()
}

function getWorkloadColor(status: string): string {
  switch (status) {
    case "UNDERUTILIZED":
      return "text-yellow-600 bg-yellow-100"
    case "OVERLOAD":
      return "text-red-600 bg-red-100"
    default:
      return "text-green-600 bg-green-100"
  }
}

function getWorkloadIcon(status: string) {
  switch (status) {
    case "UNDERUTILIZED":
      return <TrendingDown className="h-4 w-4" />
    case "OVERLOAD":
      return <TrendingUp className="h-4 w-4" />
    default:
      return <Minus className="h-4 w-4" />
  }
}

function calculateProgress(periods: number, config: WorkloadConfig): number {
  return Math.min(100, Math.round((periods / config.maxPeriodsPerWeek) * 100))
}

// ============================================================================
// Component
// ============================================================================

export function TeacherScheduleContent({
  teachers,
  workloadConfig,
  dictionary,
  lang,
}: Props) {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [workloadFilter, setWorkloadFilter] = useState<string>("all")

  const d = dictionary?.teachers?.schedule
  const t = {
    title: d?.pageTitle || "Teacher Schedules & Workload",
    subtitle: d?.subtitle || "View teacher schedules and workload distribution",
    search: d?.searchPlaceholder || "Search teachers...",
    all: d?.all || "All",
    active: d?.active || "Active",
    onLeave: d?.onLeave || "On Leave",
    underutilized: d?.underutilized || "Underutilized",
    normal: d?.normal || "Normal",
    overload: d?.overloaded || "Overloaded",
    teacher: d?.teacher || "Teacher",
    department: d?.department || "Department",
    periods: d?.periods || "Periods",
    classes: d?.classes || "Classes",
    subjects: d?.subjects || "Subjects",
    status: d?.status || "Status",
    workload: d?.workload || "Workload",
    summary: d?.summary || "Summary",
    totalTeachers: d?.totalTeachers || "Total Teachers",
    avgPeriods: d?.avgPeriods || "Avg. Periods",
    periodsPerWeek: d?.periodsPerWeek || "periods/week",
    config: d?.config || "Workload Config",
    min: d?.min || "Minimum",
    max: d?.max || "Maximum",
    threshold: d?.threshold || "Overload Threshold",
    noTeachers: d?.noTeachers || "No teachers found",
  }

  // Filter teachers
  const filteredTeachers = useMemo(() => {
    return teachers.filter((teacher) => {
      const fullName = `${teacher.givenName} ${teacher.surname}`.toLowerCase()
      const matchesSearch =
        fullName.includes(searchTerm.toLowerCase()) ||
        teacher.emailAddress.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus =
        statusFilter === "all" || teacher.employmentStatus === statusFilter

      const matchesWorkload =
        workloadFilter === "all" ||
        teacher.workload.workloadStatus === workloadFilter

      return matchesSearch && matchesStatus && matchesWorkload
    })
  }, [teachers, searchTerm, statusFilter, workloadFilter])

  // Calculate summary stats
  const stats = useMemo(() => {
    const totalTeachers = filteredTeachers.length
    const totalPeriods = filteredTeachers.reduce(
      (sum, t) => sum + t.workload.totalPeriods,
      0
    )
    const underutilized = filteredTeachers.filter(
      (t) => t.workload.workloadStatus === "UNDERUTILIZED"
    ).length
    const normal = filteredTeachers.filter(
      (t) => t.workload.workloadStatus === "NORMAL"
    ).length
    const overloaded = filteredTeachers.filter(
      (t) => t.workload.workloadStatus === "OVERLOAD"
    ).length

    return {
      totalTeachers,
      avgPeriods:
        totalTeachers > 0 ? Math.round(totalPeriods / totalTeachers) : 0,
      underutilized,
      normal,
      overloaded,
    }
  }, [filteredTeachers])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">{t.title}</h1>
        <p className="text-muted-foreground">{t.subtitle}</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">
                  {t.totalTeachers}
                </p>
                <p className="text-2xl font-bold">{stats.totalTeachers}</p>
              </div>
              <Users className="text-muted-foreground h-8 w-8" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">{t.avgPeriods}</p>
                <p className="text-2xl font-bold">
                  {stats.avgPeriods}{" "}
                  <span className="text-muted-foreground text-sm font-normal">
                    {t.periodsPerWeek}
                  </span>
                </p>
              </div>
              <Clock className="text-muted-foreground h-8 w-8" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-muted-foreground text-sm">{t.workload}</p>
              <div className="flex gap-2">
                <Badge
                  variant="outline"
                  className="bg-yellow-100 text-yellow-800"
                >
                  <TrendingDown className="me-1 h-3 w-3" />
                  {stats.underutilized}
                </Badge>
                <Badge
                  variant="outline"
                  className="bg-green-100 text-green-800"
                >
                  <CheckCircle className="me-1 h-3 w-3" />
                  {stats.normal}
                </Badge>
                <Badge variant="outline" className="bg-red-100 text-red-800">
                  <AlertTriangle className="me-1 h-3 w-3" />
                  {stats.overloaded}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-muted-foreground text-sm">{t.config}</p>
              <div className="space-y-1 text-xs">
                <p>
                  {t.min}: <strong>{workloadConfig.minPeriodsPerWeek}</strong>
                </p>
                <p>
                  {t.max}: <strong>{workloadConfig.maxPeriodsPerWeek}</strong>
                </p>
                <p>
                  {t.threshold}:{" "}
                  <strong>{workloadConfig.overloadThreshold}</strong>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="text-muted-foreground absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2" />
              <Input
                placeholder={t.search}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="ps-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder={t.status} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.all}</SelectItem>
                <SelectItem value="ACTIVE">{t.active}</SelectItem>
                <SelectItem value="ON_LEAVE">{t.onLeave}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={workloadFilter} onValueChange={setWorkloadFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder={t.workload} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.all}</SelectItem>
                <SelectItem value="UNDERUTILIZED">{t.underutilized}</SelectItem>
                <SelectItem value="NORMAL">{t.normal}</SelectItem>
                <SelectItem value="OVERLOAD">{t.overload}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Teachers Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.teacher}</TableHead>
                <TableHead>{t.department}</TableHead>
                <TableHead className="text-center">{t.periods}</TableHead>
                <TableHead className="text-center">{t.classes}</TableHead>
                <TableHead className="text-center">{t.subjects}</TableHead>
                <TableHead>{t.workload}</TableHead>
                <TableHead>{t.status}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTeachers.length > 0 ? (
                filteredTeachers.map((teacher) => (
                  <TableRow key={teacher.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={teacher.profilePhotoUrl || undefined}
                          />
                          <AvatarFallback className="text-xs">
                            {getInitials(teacher.givenName, teacher.surname)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {teacher.givenName} {teacher.surname}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            {teacher.emailAddress}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {teacher.teacherDepartments &&
                      teacher.teacherDepartments.length > 0 ? (
                        <span className="text-sm">
                          {
                            teacher.teacherDepartments[0].department
                              .departmentName
                          }
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="font-medium">
                        {teacher.workload.totalPeriods}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span>{teacher.workload.classCount}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span>{teacher.workload.subjectCount}</span>
                    </TableCell>
                    <TableCell>
                      <div className="w-32 space-y-1">
                        <Progress
                          value={calculateProgress(
                            teacher.workload.totalPeriods,
                            workloadConfig
                          )}
                          className={cn(
                            "h-2",
                            teacher.workload.workloadStatus === "OVERLOAD" &&
                              "[&>div]:bg-red-500",
                            teacher.workload.workloadStatus ===
                              "UNDERUTILIZED" && "[&>div]:bg-yellow-500",
                            teacher.workload.workloadStatus === "NORMAL" &&
                              "[&>div]:bg-green-500"
                          )}
                        />
                        <p className="text-muted-foreground text-xs">
                          {teacher.workload.totalPeriods}/
                          {workloadConfig.maxPeriodsPerWeek}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "gap-1",
                          getWorkloadColor(teacher.workload.workloadStatus)
                        )}
                      >
                        {getWorkloadIcon(teacher.workload.workloadStatus)}
                        {teacher.workload.workloadStatus === "UNDERUTILIZED" &&
                          t.underutilized}
                        {teacher.workload.workloadStatus === "NORMAL" &&
                          t.normal}
                        {teacher.workload.workloadStatus === "OVERLOAD" &&
                          t.overload}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-muted-foreground py-8 text-center"
                  >
                    <Calendar className="mx-auto mb-2 h-12 w-12 opacity-50" />
                    <p>{t.noTeachers}</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

export default TeacherScheduleContent

"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import {
  eachDayOfInterval,
  endOfWeek,
  format,
  isSameDay,
  startOfWeek,
  subDays,
} from "date-fns"
import {
  AlertTriangle,
  Calendar,
  CircleAlert,
  CircleCheck,
  CircleX,
  Clock,
  FileText,
  TrendingDown,
  TrendingUp,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  getExcusesForStudent,
  getUnexcusedAbsences,
} from "@/components/platform/attendance/actions"

import {
  ExcuseForm,
  ExcuseStatusBadge,
  UnexcusedAbsenceCard,
} from "./excuse-form"

interface Attendance {
  id: string
  date: Date
  status: string
  classId: string
  className: string
  notes: string | null
  excuse?: {
    id: string
    status: string
    reason: string
  } | null
}

interface UnexcusedAbsence {
  id: string
  studentId: string
  studentName: string
  classId: string
  className: string
  date: string
  status: string
}

interface StudentExcuse {
  id: string
  attendanceId: string
  date: string
  className: string
  reason: string
  description: string | null
  status: string
  submittedAt: string
  reviewedAt: string | null
  reviewNotes: string | null
}

interface Student {
  id: string
  name: string
  email: string | null
  classes: Array<{
    id: string
    name: string
    teacher: string
  }>
  attendances: Attendance[]
}

interface AttendanceViewProps {
  students: Student[]
  locale?: string
}

export function AttendanceView({
  students,
  locale = "en",
}: AttendanceViewProps) {
  const [selectedStudent, setSelectedStudent] = useState(students[0]?.id || "")
  const [selectedClass, setSelectedClass] = useState<string>("all")
  const [dateRange, setDateRange] = useState<"week" | "month" | "90days">(
    "week"
  )

  // Excuse management state
  const [unexcusedAbsences, setUnexcusedAbsences] = useState<
    UnexcusedAbsence[]
  >([])
  const [selectedAbsence, setSelectedAbsence] =
    useState<UnexcusedAbsence | null>(null)
  const [isExcuseFormOpen, setIsExcuseFormOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const student = students.find((s) => s.id === selectedStudent)
  const isArabic = locale === "ar"

  // Fetch unexcused absences when student changes
  useEffect(() => {
    if (selectedStudent) {
      startTransition(async () => {
        const result = await getUnexcusedAbsences(selectedStudent)
        if (result.success && result.data) {
          setUnexcusedAbsences(result.data.absences)
        }
      })
    }
  }, [selectedStudent])

  const handleSubmitExcuse = (absence: UnexcusedAbsence) => {
    setSelectedAbsence(absence)
    setIsExcuseFormOpen(true)
  }

  const handleExcuseSuccess = () => {
    // Refresh unexcused absences list
    if (selectedStudent) {
      startTransition(async () => {
        const result = await getUnexcusedAbsences(selectedStudent)
        if (result.success && result.data) {
          setUnexcusedAbsences(result.data.absences)
        }
      })
    }
  }

  const filteredAttendances = useMemo(() => {
    if (!student) return []

    let filtered = student.attendances

    // Filter by class
    if (selectedClass !== "all") {
      filtered = filtered.filter((a) => a.classId === selectedClass)
    }

    // Filter by date range
    const now = new Date()
    let startDate: Date

    switch (dateRange) {
      case "week":
        startDate = startOfWeek(now)
        break
      case "month":
        startDate = subDays(now, 30)
        break
      case "90days":
        startDate = subDays(now, 90)
        break
    }

    filtered = filtered.filter((a) => new Date(a.date) >= startDate)

    return filtered
  }, [student, selectedClass, dateRange])

  // Calculate attendance statistics
  const stats = useMemo(() => {
    const total = filteredAttendances.length
    const present = filteredAttendances.filter(
      (a) => a.status === "present"
    ).length
    const absent = filteredAttendances.filter(
      (a) => a.status === "absent"
    ).length
    const late = filteredAttendances.filter((a) => a.status === "late").length
    const excused = filteredAttendances.filter(
      (a) => a.status === "excused"
    ).length

    const attendanceRate = total > 0 ? (present / total) * 100 : 0

    return { total, present, absent, late, excused, attendanceRate }
  }, [filteredAttendances])

  // Group attendances by date for calendar view
  const attendanceByDate = useMemo(() => {
    const map = new Map<string, Attendance[]>()

    filteredAttendances.forEach((attendance) => {
      const dateKey = format(new Date(attendance.date), "yyyy-MM-dd")
      if (!map.has(dateKey)) {
        map.set(dateKey, [])
      }
      map.get(dateKey)!.push(attendance)
    })

    return map
  }, [filteredAttendances])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "present":
        return <CircleCheck className="h-4 w-4 text-green-500" />
      case "absent":
        return <CircleX className="h-4 w-4 text-red-500" />
      case "late":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "excused":
        return <CircleAlert className="h-4 w-4 text-blue-500" />
      default:
        return null
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "present":
        return <Badge className="bg-green-100 text-green-800">Present</Badge>
      case "absent":
        return <Badge className="bg-red-100 text-red-800">Absent</Badge>
      case "late":
        return <Badge className="bg-yellow-100 text-yellow-800">Late</Badge>
      case "excused":
        return <Badge className="bg-blue-100 text-blue-800">Excused</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (!student) {
    return (
      <div className="py-12 text-center">
        <p className="muted">No students found.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Student Selector */}
      {students.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Select Student</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedStudent} onValueChange={setSelectedStudent}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {students.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select class" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              {student.classes.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={dateRange}
            onValueChange={(v) => setDateRange(v as typeof dateRange)}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">Last 30 Days</SelectItem>
              <SelectItem value="90days">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Attendance Rate
            </CardTitle>
            {stats.attendanceRate >= 90 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <h3>{stats.attendanceRate.toFixed(1)}%</h3>
            <Progress value={stats.attendanceRate} className="mt-2" />
            <p className="muted mt-2">
              {stats.present} of {stats.total} classes attended
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Present</CardTitle>
            <CircleCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <h3>{stats.present}</h3>
            <p className="muted">classes attended</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Absent</CardTitle>
            <CircleX className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <h3>{stats.absent}</h3>
            <p className="muted">classes missed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Late</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <h3>{stats.late}</h3>
            <p className="muted">late arrivals</p>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Details */}
      <Tabs defaultValue="list" className="w-full">
        <TabsList>
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <Card>
            <CardHeader>
              <CardTitle>Attendance History</CardTitle>
              <CardDescription>
                Detailed attendance records for {student.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {filteredAttendances.length === 0 ? (
                  <p className="muted py-4 text-center">
                    No attendance records found.
                  </p>
                ) : (
                  filteredAttendances.map((attendance) => (
                    <div
                      key={attendance.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex items-center gap-3">
                        {getStatusIcon(attendance.status)}
                        <div>
                          <h6>{attendance.className}</h6>
                          <p className="muted">
                            {format(new Date(attendance.date), "PPP")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(attendance.status)}
                        {attendance.notes && (
                          <Badge variant="outline" className="text-xs">
                            {attendance.notes}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendar">
          <Card>
            <CardHeader>
              <CardTitle>Calendar View</CardTitle>
              <CardDescription>
                Visual attendance overview for {student.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                  (day) => (
                    <h6
                      key={day}
                      className="text-muted-foreground py-2 text-center"
                    >
                      {day}
                    </h6>
                  )
                )}
                {/* Simple calendar grid - would need more implementation for full calendar */}
                {Array.from({ length: 35 }, (_, i) => {
                  const date = subDays(new Date(), 35 - i)
                  const dateKey = format(date, "yyyy-MM-dd")
                  const dayAttendances = attendanceByDate.get(dateKey) || []

                  const hasPresent = dayAttendances.some(
                    (a) => a.status === "present"
                  )
                  const hasAbsent = dayAttendances.some(
                    (a) => a.status === "absent"
                  )
                  const hasLate = dayAttendances.some(
                    (a) => a.status === "late"
                  )

                  return (
                    <div
                      key={i}
                      className={cn(
                        "aspect-square rounded-lg border p-1 text-xs",
                        hasAbsent && "border-red-200 bg-red-50",
                        hasPresent &&
                          !hasAbsent &&
                          "border-green-200 bg-green-50",
                        hasLate &&
                          !hasAbsent &&
                          !hasPresent &&
                          "border-yellow-200 bg-yellow-50"
                      )}
                    >
                      <h6>{format(date, "d")}</h6>
                      {dayAttendances.length > 0 && (
                        <small className="mt-1">
                          {dayAttendances.length} class
                          {dayAttendances.length > 1 ? "es" : ""}
                        </small>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Unexcused Absences Section */}
      {unexcusedAbsences.length > 0 && (
        <Card className="border-red-200 bg-red-50/30">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <CardTitle className="text-red-900">
                {isArabic ? "غياب بدون عذر" : "Unexcused Absences"}
              </CardTitle>
            </div>
            <CardDescription>
              {isArabic
                ? "يمكنك تقديم عذر لهذه الغيابات للمراجعة"
                : "You can submit an excuse for these absences for review"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {unexcusedAbsences.map((absence) => (
                <UnexcusedAbsenceCard
                  key={absence.id}
                  absence={absence}
                  onSubmitExcuse={handleSubmitExcuse}
                  locale={locale}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Excuse Form Dialog */}
      {selectedAbsence && (
        <ExcuseForm
          absence={selectedAbsence}
          open={isExcuseFormOpen}
          onOpenChange={setIsExcuseFormOpen}
          onSuccess={handleExcuseSuccess}
          locale={locale}
        />
      )}
    </div>
  )
}

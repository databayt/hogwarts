/**
 * Parent Profile Academic Tab
 * Consolidated academic view for all children
 */

"use client"

import React, { useState } from "react"
import { format } from "date-fns"
import {
  Award,
  BarChart3,
  BookOpen,
  Calendar,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  CircleX,
  Clock,
  Download,
  FileText,
  GraduationCap,
  PieChart,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import type { ParentProfile } from "../../types"

// ============================================================================
// Types
// ============================================================================

interface AcademicTabProps {
  profile: ParentProfile
  dictionary?: Dictionary
  lang?: "ar" | "en"
  className?: string
}

interface Assignment {
  id: string
  childId: string
  childName: string
  subject: string
  title: string
  dueDate: Date
  status: "pending" | "submitted" | "graded" | "late" | "missing"
  grade?: string
  score?: number
  maxScore: number
  weight: number
}

interface Exam {
  id: string
  childId: string
  childName: string
  subject: string
  type: "quiz" | "midterm" | "final" | "test"
  date: Date
  score?: number
  maxScore: number
  grade?: string
  percentile?: number
}

interface AttendanceRecord {
  childId: string
  childName: string
  date: Date
  status: "present" | "absent" | "late" | "excused"
  period?: string
  reason?: string
}

interface ReportCard {
  childId: string
  childName: string
  term: string
  year: number
  subjects: {
    name: string
    grade: string
    score: number
    credits: number
    teacher: string
    remarks?: string
  }[]
  gpa: number
  rank: number
  totalStudents: number
}

// ============================================================================
// Mock Data
// ============================================================================

const mockAssignments: Assignment[] = [
  {
    id: "assign-1",
    childId: "student-1",
    childName: "Alex Thompson",
    subject: "Mathematics",
    title: "Chapter 5 Problem Set",
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    status: "pending",
    maxScore: 100,
    weight: 15,
  },
  {
    id: "assign-2",
    childId: "student-1",
    childName: "Alex Thompson",
    subject: "Science",
    title: "Lab Report - Chemical Reactions",
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    status: "submitted",
    maxScore: 50,
    weight: 20,
  },
  {
    id: "assign-3",
    childId: "student-2",
    childName: "Emma Thompson",
    subject: "English",
    title: "Essay: Shakespeare Analysis",
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    status: "pending",
    maxScore: 100,
    weight: 25,
  },
  {
    id: "assign-4",
    childId: "student-2",
    childName: "Emma Thompson",
    subject: "Mathematics",
    title: "Geometry Worksheet",
    dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    status: "graded",
    grade: "A",
    score: 95,
    maxScore: 100,
    weight: 10,
  },
  {
    id: "assign-5",
    childId: "student-1",
    childName: "Alex Thompson",
    subject: "History",
    title: "Research Paper: World War II",
    dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    status: "graded",
    grade: "A-",
    score: 88,
    maxScore: 100,
    weight: 30,
  },
]

const mockExams: Exam[] = [
  {
    id: "exam-1",
    childId: "student-1",
    childName: "Alex Thompson",
    subject: "Mathematics",
    type: "midterm",
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    maxScore: 100,
  },
  {
    id: "exam-2",
    childId: "student-2",
    childName: "Emma Thompson",
    subject: "Science",
    type: "quiz",
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    score: 48,
    maxScore: 50,
    grade: "A",
    percentile: 95,
  },
  {
    id: "exam-3",
    childId: "student-1",
    childName: "Alex Thompson",
    subject: "English",
    type: "test",
    date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    score: 85,
    maxScore: 100,
    grade: "B+",
    percentile: 78,
  },
]

const mockAttendance: AttendanceRecord[] = [
  {
    childId: "student-1",
    childName: "Alex Thompson",
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    status: "present",
  },
  {
    childId: "student-2",
    childName: "Emma Thompson",
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    status: "present",
  },
  {
    childId: "student-1",
    childName: "Alex Thompson",
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    status: "late",
    period: "First Period",
    reason: "Traffic",
  },
]

const mockReportCards: ReportCard[] = [
  {
    childId: "student-1",
    childName: "Alex Thompson",
    term: "Fall",
    year: 2023,
    subjects: [
      {
        name: "Mathematics",
        grade: "A",
        score: 92,
        credits: 4,
        teacher: "Mr. Smith",
        remarks: "Excellent problem-solving skills",
      },
      {
        name: "Science",
        grade: "A-",
        score: 88,
        credits: 4,
        teacher: "Ms. Johnson",
        remarks: "Shows great curiosity",
      },
      {
        name: "English",
        grade: "B+",
        score: 85,
        credits: 4,
        teacher: "Mrs. Davis",
        remarks: "Improving writing skills",
      },
      {
        name: "History",
        grade: "A",
        score: 90,
        credits: 3,
        teacher: "Mr. Wilson",
      },
      {
        name: "Art",
        grade: "A+",
        score: 95,
        credits: 2,
        teacher: "Ms. Chen",
        remarks: "Very creative",
      },
    ],
    gpa: 3.8,
    rank: 5,
    totalStudents: 120,
  },
  {
    childId: "student-2",
    childName: "Emma Thompson",
    term: "Fall",
    year: 2023,
    subjects: [
      {
        name: "Mathematics",
        grade: "A",
        score: 95,
        credits: 4,
        teacher: "Mr. Brown",
        remarks: "Outstanding performance",
      },
      {
        name: "Science",
        grade: "A",
        score: 94,
        credits: 4,
        teacher: "Dr. Lee",
        remarks: "Natural scientist",
      },
      {
        name: "English",
        grade: "A",
        score: 91,
        credits: 4,
        teacher: "Ms. Taylor",
        remarks: "Excellent essays",
      },
      {
        name: "History",
        grade: "B+",
        score: 86,
        credits: 3,
        teacher: "Mr. Anderson",
      },
      {
        name: "Music",
        grade: "A+",
        score: 98,
        credits: 2,
        teacher: "Ms. Rodriguez",
        remarks: "Gifted musician",
      },
    ],
    gpa: 3.9,
    rank: 3,
    totalStudents: 100,
  },
]

// ============================================================================
// Component
// ============================================================================

export function AcademicTab({
  profile,
  dictionary,
  lang = "en",
  className,
}: AcademicTabProps) {
  const [selectedChild, setSelectedChild] = useState<string>("all")
  const [selectedSubject, setSelectedSubject] = useState<string>("all")

  const { children } = profile

  // Filter assignments based on selection
  const filteredAssignments = mockAssignments.filter((assignment) => {
    if (selectedChild !== "all" && assignment.childId !== selectedChild)
      return false
    if (selectedSubject !== "all" && assignment.subject !== selectedSubject)
      return false
    return true
  })

  // Filter exams based on selection
  const filteredExams = mockExams.filter((exam) => {
    if (selectedChild !== "all" && exam.childId !== selectedChild) return false
    if (selectedSubject !== "all" && exam.subject !== selectedSubject)
      return false
    return true
  })

  // Get unique subjects
  const subjects = Array.from(
    new Set([
      ...mockAssignments.map((a) => a.subject),
      ...mockExams.map((e) => e.subject),
    ])
  )

  // Calculate statistics
  const pendingAssignments = mockAssignments.filter(
    (a) => a.status === "pending"
  ).length
  const upcomingExams = mockExams.filter((e) => e.date > new Date()).length
  const averageGrade =
    mockAssignments
      .filter((a) => a.score !== undefined)
      .reduce((sum, a) => sum + (a.score! / a.maxScore) * 100, 0) /
      mockAssignments.filter((a) => a.score !== undefined).length || 0

  const getStatusColor = (status: Assignment["status"]) => {
    switch (status) {
      case "graded":
        return "text-green-500"
      case "submitted":
        return "text-blue-500"
      case "pending":
        return "text-yellow-500"
      case "late":
        return "text-orange-500"
      case "missing":
        return "text-red-500"
      default:
        return ""
    }
  }

  const getStatusIcon = (status: Assignment["status"]) => {
    switch (status) {
      case "graded":
        return <CircleCheck className="h-4 w-4" />
      case "submitted":
        return <Clock className="h-4 w-4" />
      case "pending":
        return <CircleAlert className="h-4 w-4" />
      case "late":
        return <CircleAlert className="h-4 w-4" />
      case "missing":
        return <CircleX className="h-4 w-4" />
      default:
        return null
    }
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-yellow-500/10 p-2">
                <FileText className="h-4 w-4 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingAssignments}</p>
                <p className="text-muted-foreground text-xs">Pending Tasks</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-500/10 p-2">
                <BookOpen className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{upcomingExams}</p>
                <p className="text-muted-foreground text-xs">Upcoming Exams</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-500/10 p-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{averageGrade.toFixed(0)}%</p>
                <p className="text-muted-foreground text-xs">Average Grade</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-500/10 p-2">
                <Award className="h-4 w-4 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">96%</p>
                <p className="text-muted-foreground text-xs">Attendance Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <select
          className="rounded-md border px-3 py-2 text-sm"
          value={selectedChild}
          onChange={(e) => setSelectedChild(e.target.value)}
        >
          <option value="all">All Children</option>
          {(children || []).map((child) => (
            <option key={child.id} value={child.id}>
              {child.givenName} {child.surname}
            </option>
          ))}
        </select>

        <select
          className="rounded-md border px-3 py-2 text-sm"
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
        >
          <option value="all">All Subjects</option>
          {subjects.map((subject) => (
            <option key={subject} value={subject}>
              {subject}
            </option>
          ))}
        </select>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="assignments" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="exams">Exams</TabsTrigger>
          <TabsTrigger value="grades">Grades</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
        </TabsList>

        <TabsContent value="assignments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4" />
                Assignments & Homework
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {filteredAssignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="hover:bg-muted/50 rounded-lg border p-4 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold">
                          {assignment.title}
                        </h4>
                        <Badge variant="secondary" className="text-xs">
                          {assignment.subject}
                        </Badge>
                      </div>
                      <div className="text-muted-foreground mt-1 flex items-center gap-3 text-xs">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {assignment.childName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Due: {format(assignment.dueDate, "MMM dd, yyyy")}
                        </span>
                        <span>Weight: {assignment.weight}%</span>
                      </div>
                      {assignment.score !== undefined && (
                        <div className="mt-2 flex items-center gap-4">
                          <Badge variant="outline">{assignment.grade}</Badge>
                          <span className="text-sm">
                            {assignment.score}/{assignment.maxScore} (
                            {(
                              (assignment.score / assignment.maxScore) *
                              100
                            ).toFixed(0)}
                            %)
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className={cn(
                          "text-xs",
                          getStatusColor(assignment.status)
                        )}
                      >
                        <span className="flex items-center gap-1">
                          {getStatusIcon(assignment.status)}
                          {assignment.status}
                        </span>
                      </Badge>
                      <Button variant="ghost" size="sm">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              {filteredAssignments.length === 0 && (
                <div className="text-muted-foreground py-8 text-center">
                  No assignments found
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="exams" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BookOpen className="h-4 w-4" />
                Exams & Assessments
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {filteredExams.map((exam) => (
                <div key={exam.id} className="rounded-lg border p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold">
                          {exam.subject} -{" "}
                          {exam.type.charAt(0).toUpperCase() +
                            exam.type.slice(1)}
                        </h4>
                        {exam.score !== undefined && (
                          <Badge variant="outline">{exam.grade}</Badge>
                        )}
                      </div>
                      <div className="text-muted-foreground mt-1 flex items-center gap-3 text-xs">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {exam.childName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(exam.date, "MMM dd, yyyy")}
                        </span>
                      </div>
                      {exam.score !== undefined ? (
                        <div className="mt-2 flex items-center gap-4">
                          <span className="text-sm">
                            Score: {exam.score}/{exam.maxScore} (
                            {((exam.score / exam.maxScore) * 100).toFixed(0)}%)
                          </span>
                          {exam.percentile && (
                            <Badge variant="secondary" className="text-xs">
                              {exam.percentile}th percentile
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <Badge variant="outline" className="mt-2 text-xs">
                          Upcoming
                        </Badge>
                      )}
                    </div>
                    <Button variant="ghost" size="sm">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              {filteredExams.length === 0 && (
                <div className="text-muted-foreground py-8 text-center">
                  No exams found
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="grades" className="space-y-4">
          {/* Report Cards */}
          {mockReportCards
            .filter(
              (card) =>
                selectedChild === "all" || card.childId === selectedChild
            )
            .map((card) => (
              <Card key={`${card.childId}-${card.term}-${card.year}`}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-base">
                    <span className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4" />
                      {card.childName} - {card.term} {card.year} Report Card
                    </span>
                    <Button variant="outline" size="sm">
                      <Download className="mr-1 h-4 w-4" />
                      Download PDF
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Overall Stats */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-muted/50 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold">{card.gpa}</p>
                        <p className="text-muted-foreground text-xs">GPA</p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold">#{card.rank}</p>
                        <p className="text-muted-foreground text-xs">
                          Class Rank (of {card.totalStudents})
                        </p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold">
                          {((card.rank / card.totalStudents) * 100).toFixed(0)}%
                        </p>
                        <p className="text-muted-foreground text-xs">
                          Percentile
                        </p>
                      </div>
                    </div>

                    {/* Subject Grades */}
                    <div className="space-y-2">
                      {card.subjects.map((subject) => (
                        <div
                          key={subject.name}
                          className="flex items-center justify-between rounded-lg border p-3"
                        >
                          <div className="flex-1">
                            <p className="text-sm font-medium">
                              {subject.name}
                            </p>
                            <p className="text-muted-foreground text-xs">
                              {subject.teacher} • {subject.credits} credits
                            </p>
                            {subject.remarks && (
                              <p className="text-muted-foreground mt-1 text-xs italic">
                                "{subject.remarks}"
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge variant="outline">{subject.grade}</Badge>
                            <span className="text-sm font-medium">
                              {subject.score}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
        </TabsContent>

        <TabsContent value="attendance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="h-4 w-4" />
                Attendance Records
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Attendance Summary */}
              <div className="mb-6 grid grid-cols-2 gap-4">
                {(children || []).map((child) => {
                  const childAttendance = mockAttendance.filter(
                    (a) => a.childId === child.id
                  )
                  const presentDays = childAttendance.filter(
                    (a) => a.status === "present"
                  ).length
                  const totalDays = childAttendance.length
                  const rate =
                    totalDays > 0 ? (presentDays / totalDays) * 100 : 100

                  return (
                    <div key={child.id} className="rounded-lg border p-4">
                      <div className="mb-3 flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={child.profilePhotoUrl || undefined}
                          />
                          <AvatarFallback>
                            {child.givenName?.[0] || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">
                            {child.givenName} {child.surname}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            Grade {child.grade}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Attendance Rate</span>
                          <span className="font-medium">
                            {rate.toFixed(0)}%
                          </span>
                        </div>
                        <Progress value={rate} className="h-2" />
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-muted-foreground">
                              Present:{" "}
                            </span>
                            <span className="font-medium">{presentDays}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">
                              Absent:{" "}
                            </span>
                            <span className="font-medium">
                              {totalDays - presentDays}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Recent Attendance */}
              <div className="space-y-2">
                <p className="mb-2 text-sm font-medium">Recent Attendance</p>
                {mockAttendance
                  .filter(
                    (a) =>
                      selectedChild === "all" || a.childId === selectedChild
                  )
                  .sort((a, b) => b.date.getTime() - a.date.getTime())
                  .slice(0, 10)
                  .map((record, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-lg border p-2"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "rounded p-1",
                            record.status === "present" && "bg-green-500/10",
                            record.status === "absent" && "bg-red-500/10",
                            record.status === "late" && "bg-yellow-500/10",
                            record.status === "excused" && "bg-blue-500/10"
                          )}
                        >
                          {record.status === "present" && (
                            <CircleCheck className="h-4 w-4 text-green-500" />
                          )}
                          {record.status === "absent" && (
                            <CircleX className="h-4 w-4 text-red-500" />
                          )}
                          {record.status === "late" && (
                            <Clock className="h-4 w-4 text-yellow-500" />
                          )}
                          {record.status === "excused" && (
                            <CircleAlert className="h-4 w-4 text-blue-500" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            {record.childName}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            {format(record.date, "MMM dd, yyyy")}
                            {record.period && ` • ${record.period}`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant={
                            record.status === "present"
                              ? "default"
                              : record.status === "absent"
                                ? "destructive"
                                : "secondary"
                          }
                          className="text-xs"
                        >
                          {record.status}
                        </Badge>
                        {record.reason && (
                          <p className="text-muted-foreground mt-1 text-xs">
                            {record.reason}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

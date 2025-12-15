/**
 * Student Profile Academic Tab
 * Comprehensive academic information and performance
 */

"use client"

import React from "react"
import { format } from "date-fns"
import {
  Award,
  BookOpen,
  Calendar,
  ChevronDown,
  ChevronUp,
  Clock,
  Download,
  Eye,
  FileText,
  GraduationCap,
  Minus,
  TrendingUp,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import type { StudentProfile } from "../../types"

// ============================================================================
// Types
// ============================================================================

interface AcademicTabProps {
  profile: StudentProfile
  dictionary?: Dictionary
  lang?: "ar" | "en"
  className?: string
}

interface Course {
  id: string
  code: string
  name: string
  credits: number
  instructor: string
  schedule: string
  room: string
  grade?: number
  attendance: number
  status: "enrolled" | "completed" | "dropped"
}

interface Assignment {
  id: string
  title: string
  course: string
  dueDate: Date
  submittedDate?: Date
  grade?: number
  status: "pending" | "submitted" | "graded" | "late" | "missing"
}

interface Exam {
  id: string
  title: string
  course: string
  date: Date
  type: "midterm" | "final" | "quiz" | "test"
  score?: number
  total: number
  weight: number
}

// ============================================================================
// Mock Data
// ============================================================================

const mockCourses: Course[] = [
  {
    id: "1",
    code: "CS101",
    name: "Fundamentals of Programming using C",
    credits: 4,
    instructor: "Dr. John Smith",
    schedule: "Mon/Wed/Fri 10:00-11:00",
    room: "Room 301",
    grade: 92,
    attendance: 100,
    status: "enrolled",
  },
  {
    id: "2",
    code: "MKT201",
    name: "Digital and Mobile Media Marketing",
    credits: 3,
    instructor: "Prof. Sarah Johnson",
    schedule: "Tue/Thu 14:00-15:30",
    room: "Room 205",
    grade: 85,
    attendance: 95,
    status: "enrolled",
  },
  {
    id: "3",
    code: "MATH101",
    name: "Mathematical Aptitude",
    credits: 3,
    instructor: "Dr. Michael Brown",
    schedule: "Mon/Wed 14:00-15:30",
    room: "Room 102",
    grade: 90,
    attendance: 93,
    status: "enrolled",
  },
]

const mockAssignments: Assignment[] = [
  {
    id: "1",
    title: "Programming Assignment #5",
    course: "CS101",
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    status: "pending",
  },
  {
    id: "2",
    title: "Marketing Case Study",
    course: "MKT201",
    dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    submittedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    grade: 88,
    status: "graded",
  },
  {
    id: "3",
    title: "Math Problem Set #10",
    course: "MATH101",
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    status: "pending",
  },
]

const mockExams: Exam[] = [
  {
    id: "1",
    title: "Midterm Exam",
    course: "CS101",
    date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    type: "midterm",
    score: 92,
    total: 100,
    weight: 30,
  },
  {
    id: "2",
    title: "Quiz #3",
    course: "MKT201",
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    type: "quiz",
    score: 18,
    total: 20,
    weight: 5,
  },
  {
    id: "3",
    title: "Final Exam",
    course: "CS101",
    date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
    type: "final",
    total: 100,
    weight: 40,
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
  const { academicInfo, performance } = profile

  // Get grade color
  const getGradeColor = (grade: number) => {
    if (grade >= 90) return "text-green-600"
    if (grade >= 80) return "text-blue-600"
    if (grade >= 70) return "text-yellow-600"
    if (grade >= 60) return "text-orange-600"
    return "text-red-600"
  }

  // Get status badge variant
  const getStatusVariant = (status: string) => {
    switch (status) {
      case "enrolled":
      case "submitted":
        return "default"
      case "completed":
      case "graded":
        return "secondary"
      case "pending":
        return "outline"
      case "late":
        return "destructive"
      case "missing":
      case "dropped":
        return "destructive"
      default:
        return "outline"
    }
  }

  // Calculate overall statistics
  const totalEnrolledCredits = mockCourses
    .filter((c) => c.status === "enrolled")
    .reduce((sum, c) => sum + c.credits, 0)

  const averageGrade = mockCourses
    .filter((c) => c.grade !== undefined)
    .reduce((sum, c, _, arr) => sum + (c.grade || 0) / arr.length, 0)

  return (
    <div className={cn("space-y-6", className)}>
      {/* Academic Summary */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="mb-2 flex items-center gap-2">
              <GraduationCap className="text-muted-foreground h-4 w-4" />
              <p className="text-muted-foreground text-sm">Current Semester</p>
            </div>
            <p className="text-xl font-bold">{academicInfo.currentYearLevel}</p>
            <p className="text-muted-foreground text-xs">
              {academicInfo.currentSection}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="mb-2 flex items-center gap-2">
              <BookOpen className="text-muted-foreground h-4 w-4" />
              <p className="text-muted-foreground text-sm">Enrolled Credits</p>
            </div>
            <p className="text-xl font-bold">{totalEnrolledCredits}</p>
            <p className="text-muted-foreground text-xs">This semester</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="mb-2 flex items-center gap-2">
              <TrendingUp className="text-muted-foreground h-4 w-4" />
              <p className="text-muted-foreground text-sm">Average Grade</p>
            </div>
            <p className={cn("text-xl font-bold", getGradeColor(averageGrade))}>
              {averageGrade.toFixed(1)}%
            </p>
            <p className="text-muted-foreground text-xs">All courses</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="mb-2 flex items-center gap-2">
              <Award className="text-muted-foreground h-4 w-4" />
              <p className="text-muted-foreground text-sm">Total Credits</p>
            </div>
            <p className="text-xl font-bold">
              {academicInfo.totalCredits || 0}
            </p>
            <p className="text-muted-foreground text-xs">Earned to date</p>
          </CardContent>
        </Card>
      </div>

      {/* Course Details */}
      <Tabs defaultValue="courses" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 md:w-auto">
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="exams">Exams</TabsTrigger>
        </TabsList>

        {/* Courses Tab */}
        <TabsContent value="courses">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Current Courses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockCourses.map((course) => (
                  <div key={course.id} className="rounded-lg border p-4">
                    <div className="mb-3 flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{course.name}</h4>
                          <Badge variant={getStatusVariant(course.status)}>
                            {course.status}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground mt-1 text-sm">
                          {course.code} • {course.credits} credits •{" "}
                          {course.instructor}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <div>
                        <p className="text-muted-foreground mb-1 text-xs">
                          Schedule
                        </p>
                        <p className="text-sm">{course.schedule}</p>
                        <p className="text-muted-foreground text-xs">
                          {course.room}
                        </p>
                      </div>

                      {course.grade !== undefined && (
                        <div>
                          <p className="text-muted-foreground mb-1 text-xs">
                            Current Grade
                          </p>
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                "text-lg font-bold",
                                getGradeColor(course.grade)
                              )}
                            >
                              {course.grade}%
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {course.grade >= 90
                                ? "A"
                                : course.grade >= 80
                                  ? "B"
                                  : course.grade >= 70
                                    ? "C"
                                    : course.grade >= 60
                                      ? "D"
                                      : "F"}
                            </Badge>
                          </div>
                        </div>
                      )}

                      <div>
                        <p className="text-muted-foreground mb-1 text-xs">
                          Attendance
                        </p>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span>{course.attendance}%</span>
                            {course.attendance >= 90 ? (
                              <ChevronUp className="h-3 w-3 text-green-500" />
                            ) : course.attendance >= 75 ? (
                              <Minus className="h-3 w-3 text-yellow-500" />
                            ) : (
                              <ChevronDown className="h-3 w-3 text-red-500" />
                            )}
                          </div>
                          <Progress value={course.attendance} className="h-2" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Assignments Tab */}
        <TabsContent value="assignments">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Assignments</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Assignment</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockAssignments.map((assignment) => (
                    <TableRow key={assignment.id}>
                      <TableCell className="font-medium">
                        {assignment.title}
                      </TableCell>
                      <TableCell>{assignment.course}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="text-muted-foreground h-3 w-3" />
                          <span className="text-sm">
                            {format(assignment.dueDate, "MMM dd, yyyy")}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(assignment.status)}>
                          {assignment.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {assignment.grade !== undefined ? (
                          <span
                            className={cn(
                              "font-bold",
                              getGradeColor(assignment.grade)
                            )}
                          >
                            {assignment.grade}%
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Exams Tab */}
        <TabsContent value="exams">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Exams & Assessments</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Exam</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Weight</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockExams.map((exam) => (
                    <TableRow key={exam.id}>
                      <TableCell className="font-medium">
                        {exam.title}
                      </TableCell>
                      <TableCell>{exam.course}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="text-muted-foreground h-3 w-3" />
                          <span className="text-sm">
                            {format(exam.date, "MMM dd, yyyy")}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{exam.type}</Badge>
                      </TableCell>
                      <TableCell>
                        {exam.score !== undefined ? (
                          <span
                            className={cn(
                              "font-bold",
                              getGradeColor((exam.score / exam.total) * 100)
                            )}
                          >
                            {exam.score}/{exam.total}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">
                            -/{exam.total}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{exam.weight}%</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Grade Progression Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-base">
            <span className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Grade Progression
            </span>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export Transcript
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {performance.subjectPerformance.map((subject, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {subject.subjectName}
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "font-bold",
                        getGradeColor(subject.currentGrade || 0)
                      )}
                    >
                      {subject.currentGrade}%
                    </span>
                    {subject.trend === "up" && (
                      <ChevronUp className="h-4 w-4 text-green-500" />
                    )}
                    {subject.trend === "down" && (
                      <ChevronDown className="h-4 w-4 text-red-500" />
                    )}
                    {subject.trend === "stable" && (
                      <Minus className="h-4 w-4 text-gray-500" />
                    )}
                  </div>
                </div>
                <Progress value={subject.currentGrade || 0} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

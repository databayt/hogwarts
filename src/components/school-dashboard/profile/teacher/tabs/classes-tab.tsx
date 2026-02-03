/**
 * Teacher Profile Classes Tab
 * Current and past classes, student lists, and performance
 */

"use client"

import React, { useState } from "react"
import { format } from "date-fns"
import {
  Activity,
  Award,
  BarChart,
  BookOpen,
  Calendar,
  ChevronRight,
  Clock,
  Download,
  Eye,
  PieChart,
  TrendingUp,
  Users,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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

import type { TeacherProfile } from "../../types"

// ============================================================================
// Types
// ============================================================================

interface ClassesTabProps {
  profile: TeacherProfile
  dictionary?: Dictionary
  lang?: "ar" | "en"
  className?: string
}

interface ClassInfo {
  id: string
  name: string
  code: string
  subject: string
  level: string
  schedule: string
  room: string
  students: number
  averageGrade: number
  attendanceRate: number
  assignmentsGiven: number
  status: "active" | "completed" | "upcoming"
  startDate: Date
  endDate?: Date
}

interface StudentInfo {
  id: string
  name: string
  avatar?: string
  rollNumber: string
  attendance: number
  grade: number
  lastSubmission?: Date
  status: "active" | "inactive"
}

// ============================================================================
// Mock Data
// ============================================================================

const mockClasses: ClassInfo[] = [
  {
    id: "1",
    name: "Programming Fundamentals",
    code: "CS101",
    subject: "Computer Science",
    level: "Semester 1",
    schedule: "Mon/Wed/Fri 9:00-10:30",
    room: "Room 301",
    students: 45,
    averageGrade: 87.5,
    attendanceRate: 92,
    assignmentsGiven: 12,
    status: "active",
    startDate: new Date("2024-01-15"),
  },
  {
    id: "2",
    name: "Data Structures & Algorithms",
    code: "CS201",
    subject: "Computer Science",
    level: "Semester 3",
    schedule: "Tue/Thu 14:00-15:30",
    room: "Lab 205",
    students: 38,
    averageGrade: 82.3,
    attendanceRate: 89,
    assignmentsGiven: 10,
    status: "active",
    startDate: new Date("2024-01-15"),
  },
  {
    id: "3",
    name: "Machine Learning Basics",
    code: "CS301",
    subject: "Computer Science",
    level: "Semester 5",
    schedule: "Mon/Wed 16:00-17:30",
    room: "Room 410",
    students: 25,
    averageGrade: 79.8,
    attendanceRate: 85,
    assignmentsGiven: 8,
    status: "active",
    startDate: new Date("2024-01-15"),
  },
  {
    id: "4",
    name: "Web Development",
    code: "CS202",
    subject: "Computer Science",
    level: "Semester 2",
    schedule: "Completed",
    room: "Lab 302",
    students: 50,
    averageGrade: 85.2,
    attendanceRate: 91,
    assignmentsGiven: 15,
    status: "completed",
    startDate: new Date("2023-08-15"),
    endDate: new Date("2023-12-20"),
  },
]

const mockStudents: StudentInfo[] = [
  {
    id: "1",
    name: "Emma Parker",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emma",
    rollNumber: "CS2024001",
    attendance: 95,
    grade: 92,
    lastSubmission: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    status: "active",
  },
  {
    id: "2",
    name: "John Smith",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=John",
    rollNumber: "CS2024002",
    attendance: 88,
    grade: 85,
    lastSubmission: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    status: "active",
  },
  {
    id: "3",
    name: "Sarah Williams",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
    rollNumber: "CS2024003",
    attendance: 92,
    grade: 88,
    lastSubmission: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    status: "active",
  },
  {
    id: "4",
    name: "Michael Brown",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Michael",
    rollNumber: "CS2024004",
    attendance: 75,
    grade: 72,
    lastSubmission: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    status: "active",
  },
]

// ============================================================================
// Component
// ============================================================================

export function ClassesTab({
  profile,
  dictionary,
  lang = "en",
  className,
}: ClassesTabProps) {
  const [selectedClass, setSelectedClass] = useState(mockClasses[0])
  const [activeTab, setActiveTab] = useState("current")

  // Filter classes by status
  const currentClasses = mockClasses.filter((c) => c.status === "active")
  const completedClasses = mockClasses.filter((c) => c.status === "completed")

  // Calculate statistics
  const totalStudents = mockClasses.reduce((sum, c) => sum + c.students, 0)
  const averageAttendance =
    mockClasses.reduce((sum, c) => sum + c.attendanceRate, 0) /
    mockClasses.length
  const averagePerformance =
    mockClasses.reduce((sum, c) => sum + c.averageGrade, 0) / mockClasses.length

  // Get grade color
  const getGradeColor = (grade: number) => {
    if (grade >= 90) return "text-green-600"
    if (grade >= 80) return "text-blue-600"
    if (grade >= 70) return "text-yellow-600"
    if (grade >= 60) return "text-orange-600"
    return "text-red-600"
  }

  // Get attendance color
  const getAttendanceColor = (attendance: number) => {
    if (attendance >= 90) return "text-green-600"
    if (attendance >= 75) return "text-yellow-600"
    return "text-red-600"
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Class Summary */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="mb-2 flex items-center gap-2">
              <BookOpen className="text-muted-foreground h-4 w-4" />
              <p className="text-muted-foreground text-sm">Total Classes</p>
            </div>
            <p className="text-2xl font-bold">{mockClasses.length}</p>
            <p className="text-muted-foreground text-xs">
              {currentClasses.length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="mb-2 flex items-center gap-2">
              <Users className="text-muted-foreground h-4 w-4" />
              <p className="text-muted-foreground text-sm">Total Students</p>
            </div>
            <p className="text-2xl font-bold">{totalStudents}</p>
            <p className="text-muted-foreground text-xs">Across all classes</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="mb-2 flex items-center gap-2">
              <Activity className="text-muted-foreground h-4 w-4" />
              <p className="text-muted-foreground text-sm">Avg Attendance</p>
            </div>
            <p className="text-2xl font-bold">
              {averageAttendance.toFixed(1)}%
            </p>
            <Progress value={averageAttendance} className="mt-2 h-1" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="mb-2 flex items-center gap-2">
              <TrendingUp className="text-muted-foreground h-4 w-4" />
              <p className="text-muted-foreground text-sm">Avg Performance</p>
            </div>
            <p className="text-2xl font-bold">
              {averagePerformance.toFixed(1)}%
            </p>
            <Progress value={averagePerformance} className="mt-2 h-1" />
          </CardContent>
        </Card>
      </div>

      {/* Classes Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="current">
            Current Classes ({currentClasses.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({completedClasses.length})
          </TabsTrigger>
        </TabsList>

        {/* Current Classes */}
        <TabsContent value="current" className="space-y-4">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Classes List */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-base">My Classes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {currentClasses.map((cls) => (
                  <button
                    key={cls.id}
                    onClick={() => setSelectedClass(cls)}
                    className={cn(
                      "w-full rounded-lg p-3 text-left transition-colors",
                      selectedClass.id === cls.id
                        ? "bg-primary/10"
                        : "hover:bg-muted"
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium">{cls.code}</p>
                        <p className="text-muted-foreground text-xs">
                          {cls.name}
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {cls.students} students
                      </Badge>
                    </div>
                    <div className="text-muted-foreground mt-2 text-xs">
                      <p>{cls.schedule}</p>
                      <p>{cls.room}</p>
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>

            {/* Selected Class Details */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-base">
                  <span>
                    {selectedClass.code} - {selectedClass.name}
                  </span>
                  <Button variant="outline" size="sm">
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Class Info */}
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <div>
                    <p className="text-muted-foreground text-xs">Students</p>
                    <p className="font-medium">{selectedClass.students}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">
                      Average Grade
                    </p>
                    <p
                      className={cn(
                        "font-medium",
                        getGradeColor(selectedClass.averageGrade)
                      )}
                    >
                      {selectedClass.averageGrade.toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Attendance</p>
                    <p
                      className={cn(
                        "font-medium",
                        getAttendanceColor(selectedClass.attendanceRate)
                      )}
                    >
                      {selectedClass.attendanceRate}%
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Assignments</p>
                    <p className="font-medium">
                      {selectedClass.assignmentsGiven}
                    </p>
                  </div>
                </div>

                {/* Performance Chart */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      Class Performance
                    </span>
                    <Button variant="ghost" size="sm">
                      <BarChart className="mr-2 h-4 w-4" />
                      Analytics
                    </Button>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <div className="mb-1 flex justify-between text-xs">
                        <span>Excellent (90-100%)</span>
                        <span>30%</span>
                      </div>
                      <Progress value={30} className="h-2 bg-green-100" />
                    </div>
                    <div>
                      <div className="mb-1 flex justify-between text-xs">
                        <span>Good (80-89%)</span>
                        <span>45%</span>
                      </div>
                      <Progress value={45} className="h-2 bg-blue-100" />
                    </div>
                    <div>
                      <div className="mb-1 flex justify-between text-xs">
                        <span>Average (70-79%)</span>
                        <span>20%</span>
                      </div>
                      <Progress value={20} className="h-2 bg-yellow-100" />
                    </div>
                    <div>
                      <div className="mb-1 flex justify-between text-xs">
                        <span>Below Average (&lt;70%)</span>
                        <span>5%</span>
                      </div>
                      <Progress value={5} className="h-2 bg-red-100" />
                    </div>
                  </div>
                </div>

                {/* Top Students */}
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-medium">Top Performers</span>
                    <Button variant="ghost" size="sm">
                      View All
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {mockStudents.slice(0, 3).map((student, index) => (
                      <div
                        key={student.id}
                        className="hover:bg-muted/50 flex items-center justify-between rounded-lg p-2"
                      >
                        <div className="flex items-center gap-3">
                          <Badge
                            variant="outline"
                            className="flex h-6 w-6 items-center justify-center p-0"
                          >
                            {index + 1}
                          </Badge>
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={student.avatar} />
                            <AvatarFallback>{student.name[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">
                              {student.name}
                            </p>
                            <p className="text-muted-foreground text-xs">
                              {student.rollNumber}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p
                            className={cn(
                              "text-sm font-medium",
                              getGradeColor(student.grade)
                            )}
                          >
                            {student.grade}%
                          </p>
                          <p className="text-muted-foreground text-xs">
                            {student.attendance}% attendance
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Student List Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                <span>Student List - {selectedClass.code}</span>
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Roll Number</TableHead>
                    <TableHead>Attendance</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Last Submission</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={student.avatar} />
                            <AvatarFallback>{student.name[0]}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{student.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{student.rollNumber}</TableCell>
                      <TableCell>
                        <span
                          className={cn(getAttendanceColor(student.attendance))}
                        >
                          {student.attendance}%
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "font-medium",
                            getGradeColor(student.grade)
                          )}
                        >
                          {student.grade}%
                        </span>
                      </TableCell>
                      <TableCell>
                        {student.lastSubmission ? (
                          <span className="text-muted-foreground text-sm">
                            {format(student.lastSubmission, "MMM dd, yyyy")}
                          </span>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            student.status === "active"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {student.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Completed Classes */}
        <TabsContent value="completed">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Completed Classes</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Class</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Students</TableHead>
                    <TableHead>Avg Grade</TableHead>
                    <TableHead>Attendance</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {completedClasses.map((cls) => (
                    <TableRow key={cls.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{cls.code}</p>
                          <p className="text-muted-foreground text-sm">
                            {cls.name}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{format(cls.startDate, "MMM yyyy")}</p>
                          <p className="text-muted-foreground">
                            to{" "}
                            {cls.endDate
                              ? format(cls.endDate, "MMM yyyy")
                              : "Present"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{cls.students}</TableCell>
                      <TableCell>
                        <span className={cn(getGradeColor(cls.averageGrade))}>
                          {cls.averageGrade.toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(getAttendanceColor(cls.attendanceRate))}
                        >
                          {cls.attendanceRate}%
                        </span>
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
      </Tabs>
    </div>
  )
}

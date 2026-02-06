/**
 * Teacher Directory Component
 * Browse and search all teacher profiles
 */

"use client"

import React, { useMemo, useState } from "react"
import Link from "next/link"
import { format } from "date-fns"
import {
  Award,
  BookOpen,
  Calendar,
  ChevronRight,
  Clock,
  GraduationCap,
  LayoutGrid,
  List,
  ListFilter,
  Mail,
  MapPin,
  Phone,
  Search,
  Star,
  User,
  Users,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Dictionary } from "@/components/internationalization/dictionaries"

// ============================================================================
// Types
// ============================================================================

interface TeacherDirectoryContentProps {
  dictionary?: Dictionary
  lang?: "ar" | "en"
}

interface Teacher {
  id: string
  name: string
  email: string
  phone?: string
  avatar?: string
  employeeId: string
  department: string
  designation: string
  specialization: string[]
  qualifications: string
  experience: number
  subjects: string[]
  classes: number
  students: number
  rating: number
  reviews: number
  status: "active" | "on-leave" | "inactive"
  joiningDate: Date
  location?: string
  isOnline?: boolean
  teachingHours: number
}

// Mock data
const mockTeachers: Teacher[] = [
  {
    id: "1",
    name: "Dr. Sarah Mitchell",
    email: "sarah.mitchell@school.edu",
    phone: "+1 234 567 8901",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
    employeeId: "TCH2015001",
    department: "Science",
    designation: "Senior Teacher",
    specialization: ["Physics", "Chemistry"],
    qualifications: "Ph.D. in Physics",
    experience: 15,
    subjects: ["Physics Grade 11", "Physics Grade 12", "Advanced Chemistry"],
    classes: 5,
    students: 142,
    rating: 4.8,
    reviews: 87,
    status: "active",
    joiningDate: new Date("2015-08-15"),
    location: "Science Block, Room 301",
    isOnline: true,
    teachingHours: 24,
  },
  {
    id: "2",
    name: "Prof. James Anderson",
    email: "james.anderson@school.edu",
    phone: "+1 234 567 8902",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=James",
    employeeId: "TCH2012003",
    department: "Mathematics",
    designation: "Head of Department",
    specialization: ["Advanced Mathematics", "Calculus"],
    qualifications: "M.Sc. Mathematics",
    experience: 20,
    subjects: ["Calculus", "Advanced Mathematics", "Statistics"],
    classes: 4,
    students: 118,
    rating: 4.9,
    reviews: 102,
    status: "active",
    joiningDate: new Date("2012-06-10"),
    location: "Math Building, Room 201",
    isOnline: true,
    teachingHours: 20,
  },
  {
    id: "3",
    name: "Ms. Emily Chen",
    email: "emily.chen@school.edu",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emily",
    employeeId: "TCH2018007",
    department: "English",
    designation: "Teacher",
    specialization: ["Literature", "Creative Writing"],
    qualifications: "M.A. English Literature",
    experience: 8,
    subjects: ["English Grade 10", "English Grade 11", "Creative Writing"],
    classes: 6,
    students: 165,
    rating: 4.7,
    reviews: 68,
    status: "active",
    joiningDate: new Date("2018-09-01"),
    location: "Arts Building, Room 102",
    isOnline: false,
    teachingHours: 26,
  },
  {
    id: "4",
    name: "Mr. David Wilson",
    email: "david.wilson@school.edu",
    phone: "+1 234 567 8903",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=David",
    employeeId: "TCH2019010",
    department: "History",
    designation: "Teacher",
    specialization: ["World History", "Modern History"],
    qualifications: "M.A. History",
    experience: 6,
    subjects: ["World History", "Modern History", "Social Studies"],
    classes: 4,
    students: 95,
    rating: 4.5,
    reviews: 52,
    status: "on-leave",
    joiningDate: new Date("2019-07-15"),
    location: "Main Building, Room 405",
    isOnline: false,
    teachingHours: 18,
  },
  {
    id: "5",
    name: "Dr. Maria Rodriguez",
    email: "maria.rodriguez@school.edu",
    phone: "+1 234 567 8904",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Maria",
    employeeId: "TCH2016004",
    department: "Biology",
    designation: "Senior Teacher",
    specialization: ["Biology", "Environmental Science"],
    qualifications: "Ph.D. in Biology",
    experience: 12,
    subjects: ["Biology Grade 11", "Biology Grade 12", "Environmental Science"],
    classes: 5,
    students: 138,
    rating: 4.9,
    reviews: 95,
    status: "active",
    joiningDate: new Date("2016-08-20"),
    location: "Science Block, Room 205",
    isOnline: true,
    teachingHours: 22,
  },
  {
    id: "6",
    name: "Mr. Robert Taylor",
    email: "robert.taylor@school.edu",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Robert",
    employeeId: "TCH2020012",
    department: "Computer Science",
    designation: "Teacher",
    specialization: ["Programming", "Web Development"],
    qualifications: "M.Sc. Computer Science",
    experience: 5,
    subjects: ["Programming", "Web Development", "Database Management"],
    classes: 4,
    students: 88,
    rating: 4.6,
    reviews: 43,
    status: "active",
    joiningDate: new Date("2020-01-10"),
    location: "Computer Lab, Room 3",
    isOnline: true,
    teachingHours: 20,
  },
]

// ============================================================================
// Component
// ============================================================================

export function TeacherDirectoryContent({
  dictionary,
  lang = "en",
}: TeacherDirectoryContentProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [departmentFilter, setDepartmentFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [experienceFilter, setExperienceFilter] = useState("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  // Get unique departments for filter
  const departments = useMemo(() => {
    const depts = new Set(mockTeachers.map((t) => t.department))
    return Array.from(depts).sort()
  }, [])

  // Filter teachers based on search and filters
  const filteredTeachers = useMemo(() => {
    return mockTeachers.filter((teacher) => {
      const matchesSearch =
        teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        teacher.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        teacher.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        teacher.specialization.some((s) =>
          s.toLowerCase().includes(searchQuery.toLowerCase())
        )
      const matchesDepartment =
        departmentFilter === "all" || teacher.department === departmentFilter
      const matchesStatus =
        statusFilter === "all" || teacher.status === statusFilter
      const matchesExperience =
        experienceFilter === "all" ||
        (experienceFilter === "0-5" && teacher.experience <= 5) ||
        (experienceFilter === "6-10" &&
          teacher.experience > 5 &&
          teacher.experience <= 10) ||
        (experienceFilter === "11-15" &&
          teacher.experience > 10 &&
          teacher.experience <= 15) ||
        (experienceFilter === "15+" && teacher.experience > 15)
      return (
        matchesSearch && matchesDepartment && matchesStatus && matchesExperience
      )
    })
  }, [searchQuery, departmentFilter, statusFilter, experienceFilter])

  const getStatusColor = (status: Teacher["status"]) => {
    switch (status) {
      case "active":
        return "bg-green-50 text-green-600"
      case "on-leave":
        return "bg-yellow-50 text-yellow-600"
      case "inactive":
        return "bg-gray-50 text-gray-600"
      default:
        return "bg-gray-50 text-gray-600"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold">Teacher Directory</h1>
          <p className="text-muted-foreground mt-1">
            Browse and connect with teaching faculty
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("grid")}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
            <Input
              placeholder="Search by name, email, employee ID, or specialization..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ps-10"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Select
              value={departmentFilter}
              onValueChange={setDepartmentFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={experienceFilter}
              onValueChange={setExperienceFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder="Experience" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Experience</SelectItem>
                <SelectItem value="0-5">0-5 years</SelectItem>
                <SelectItem value="6-10">6-10 years</SelectItem>
                <SelectItem value="11-15">11-15 years</SelectItem>
                <SelectItem value="15+">15+ years</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="on-leave">On Leave</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="text-muted-foreground flex items-center justify-between text-sm">
            <span>{filteredTeachers.length} teachers found</span>
            {(searchQuery ||
              departmentFilter !== "all" ||
              statusFilter !== "all" ||
              experienceFilter !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery("")
                  setDepartmentFilter("all")
                  setStatusFilter("all")
                  setExperienceFilter("all")
                }}
              >
                Clear filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Teachers Grid/List */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredTeachers.map((teacher) => (
            <Card
              key={teacher.id}
              className="transition-shadow hover:shadow-lg"
            >
              <CardContent className="p-6">
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={teacher.avatar} alt={teacher.name} />
                      <AvatarFallback>
                        {teacher.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium">{teacher.name}</h3>
                      <p className="text-muted-foreground text-sm">
                        {teacher.employeeId}
                      </p>
                    </div>
                  </div>
                  {teacher.isOnline && (
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                  )}
                </div>

                <div className="mb-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <BookOpen className="text-muted-foreground h-3 w-3" />
                    <span className="text-muted-foreground">
                      {teacher.designation}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <GraduationCap className="text-muted-foreground h-3 w-3" />
                    <span className="text-muted-foreground">
                      {teacher.department}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Award className="text-muted-foreground h-3 w-3" />
                    <span className="text-muted-foreground">
                      {teacher.experience} years exp
                    </span>
                  </div>
                </div>

                {/* Specialization Tags */}
                <div className="mb-4 flex flex-wrap gap-1">
                  {teacher.specialization.slice(0, 2).map((spec) => (
                    <Badge key={spec} variant="secondary" className="text-xs">
                      {spec}
                    </Badge>
                  ))}
                  {teacher.specialization.length > 2 && (
                    <Badge variant="secondary" className="text-xs">
                      +{teacher.specialization.length - 2}
                    </Badge>
                  )}
                </div>

                {/* Stats */}
                <div className="mb-4 grid grid-cols-3 gap-2 text-center text-sm">
                  <div>
                    <div className="font-semibold">{teacher.classes}</div>
                    <div className="text-muted-foreground text-xs">Classes</div>
                  </div>
                  <div>
                    <div className="font-semibold">{teacher.students}</div>
                    <div className="text-muted-foreground text-xs">
                      Students
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-1 font-semibold">
                      <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                      {teacher.rating}
                    </div>
                    <div className="text-muted-foreground text-xs">Rating</div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Badge className={cn(getStatusColor(teacher.status))}>
                    {teacher.status.replace("-", " ")}
                  </Badge>
                  <Link href={`/profile/${teacher.id}`}>
                    <Button size="sm" variant="ghost">
                      View
                      <ChevronRight className="ms-1 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="p-4 text-start">Teacher</th>
                  <th className="hidden p-4 text-start md:table-cell">
                    Department
                  </th>
                  <th className="hidden p-4 text-start lg:table-cell">
                    Experience
                  </th>
                  <th className="hidden p-4 text-start lg:table-cell">
                    Students
                  </th>
                  <th className="hidden p-4 text-start xl:table-cell">
                    Rating
                  </th>
                  <th className="p-4 text-start">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTeachers.map((teacher) => (
                  <tr key={teacher.id} className="hover:bg-accent/50 border-b">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage
                            src={teacher.avatar}
                            alt={teacher.name}
                          />
                          <AvatarFallback>
                            {teacher.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{teacher.name}</span>
                            {teacher.isOnline && (
                              <div className="h-2 w-2 rounded-full bg-green-500" />
                            )}
                          </div>
                          <p className="text-muted-foreground text-sm">
                            {teacher.designation}
                          </p>
                          <p className="text-muted-foreground text-xs md:hidden">
                            {teacher.department}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="hidden p-4 md:table-cell">
                      <span className="text-sm">{teacher.department}</span>
                    </td>
                    <td className="hidden p-4 lg:table-cell">
                      <span className="text-sm">
                        {teacher.experience} years
                      </span>
                    </td>
                    <td className="hidden p-4 lg:table-cell">
                      <div>
                        <span className="text-sm">
                          {teacher.students} students
                        </span>
                        <p className="text-muted-foreground text-xs">
                          {teacher.classes} classes
                        </p>
                      </div>
                    </td>
                    <td className="hidden p-4 xl:table-cell">
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                        <span className="text-sm">{teacher.rating}</span>
                        <span className="text-muted-foreground text-xs">
                          ({teacher.reviews})
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <Link href={`/profile/teachers/${teacher.id}`}>
                        <Button size="sm" variant="ghost">
                          View Profile
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

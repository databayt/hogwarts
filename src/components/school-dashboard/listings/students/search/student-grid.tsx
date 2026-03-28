"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { format } from "date-fns"
import {
  Calendar,
  EllipsisVertical,
  Eye,
  Mail,
  MapPin,
  Phone,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import type { Student } from "../registration/types"

interface StudentGridProps {
  students: Student[]
  onStudentSelect?: (student: Student) => void
  dictionary?: any
}

const statusColors = {
  ACTIVE: "bg-green-100 text-green-800",
  INACTIVE: "bg-gray-100 text-gray-800",
  SUSPENDED: "bg-red-100 text-red-800",
  GRADUATED: "bg-blue-100 text-blue-800",
  TRANSFERRED: "bg-yellow-100 text-yellow-800",
  DROPPED_OUT: "bg-red-700 text-white",
}

export function StudentGrid({
  students,
  onStudentSelect,
  dictionary,
}: StudentGridProps) {
  const d = dictionary?.school?.students?.search
  const getInitials = (student: Student) => {
    return `${student.firstName?.[0] || ""}${student.lastName?.[0] || ""}`.toUpperCase()
  }

  const getFullName = (student: Student) => {
    return [student.firstName, student.middleName, student.lastName]
      .filter(Boolean)
      .join(" ")
  }

  const getAge = (dateOfBirth?: Date) => {
    if (!dateOfBirth) return null
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--
    }
    return age
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {students.map((student) => (
        <Card
          key={student.id}
          className="cursor-pointer transition-shadow hover:shadow-lg"
          onClick={() => onStudentSelect?.(student)}
        >
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage
                    src={student.profilePhotoUrl}
                    alt={getFullName(student)}
                  />
                  <AvatarFallback>{getInitials(student)}</AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-medium">{getFullName(student)}</h4>
                  <p className="text-muted-foreground text-xs">
                    {student.grNumber ||
                      student.studentId ||
                      d?.noId ||
                      "No ID"}
                  </p>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger
                  asChild
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <EllipsisVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>
                    {d?.gridActions?.actions || "Actions"}
                  </DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => onStudentSelect?.(student)}>
                    <Eye className="me-2 h-4 w-4" />
                    {d?.gridActions?.viewProfile || "View Profile"}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    {d?.gridActions?.edit || "Edit"}
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    {d?.gridActions?.generateReport || "Generate Report"}
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-red-600">
                    {d?.gridActions?.delete || "Delete"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>

          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <Badge
                variant="secondary"
                className={statusColors[student.status]}
              >
                {student.status}
              </Badge>
              {student.studentType && student.studentType !== "REGULAR" && (
                <Badge variant="outline">{student.studentType}</Badge>
              )}
            </div>

            <div className="space-y-2 text-sm">
              {student.email && (
                <div className="text-muted-foreground flex items-center gap-2">
                  <Mail className="h-3 w-3" />
                  <span className="truncate">{student.email}</span>
                </div>
              )}
              {student.mobileNumber && (
                <div className="text-muted-foreground flex items-center gap-2">
                  <Phone className="h-3 w-3" />
                  <span>{student.mobileNumber}</span>
                </div>
              )}
              {student.dateOfBirth && (
                <div className="text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-3 w-3" />
                  <span>
                    {getAge(student.dateOfBirth)} {d?.years || "years"} •{" "}
                    {student.gender}
                  </span>
                </div>
              )}
              {student.city && (
                <div className="text-muted-foreground flex items-center gap-2">
                  <MapPin className="h-3 w-3" />
                  <span>
                    {student.city}, {student.country}
                  </span>
                </div>
              )}
            </div>

            <div className="border-t pt-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {d?.gridLabels?.class || "Class"}
                </span>
                <span className="font-medium">Grade 10-A</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {d?.gridLabels?.enrolled || "Enrolled"}
                </span>
                <span className="font-medium">
                  {student.enrollmentDate &&
                    format(new Date(student.enrollmentDate), "MMM yyyy")}
                </span>
              </div>
            </div>
          </CardContent>

          <CardFooter className="pt-3">
            <Button
              variant="outline"
              className="w-full"
              onClick={(e) => {
                e.stopPropagation()
                onStudentSelect?.(student)
              }}
            >
              <Eye className="me-2 h-4 w-4" />
              {d?.gridLabels?.viewDetails || "View Details"}
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}

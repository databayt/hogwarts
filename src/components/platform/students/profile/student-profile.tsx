"use client"

import { useState } from "react"
import { format } from "date-fns"
import {
  Award,
  BookOpen,
  Calendar,
  CreditCard,
  Download,
  EllipsisVertical,
  FileText,
  Heart,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Printer,
  School,
  Share2,
  TriangleAlert,
  User,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import type { Student } from "../registration/types"
import { AcademicTab } from "./tabs/academic-tab"
import { AchievementsTab } from "./tabs/achievements-tab"
import { AttendanceTab } from "./tabs/attendance-tab"
import { DocumentsTab } from "./tabs/documents-tab"
import { FeesTab } from "./tabs/fees-tab"
import { GuardianTab } from "./tabs/guardian-tab"
import { HealthTab } from "./tabs/health-tab"
// Import tab components
import { PersonalTab } from "./tabs/personal-tab"

interface StudentProfileProps {
  student: Student
  dictionary?: any
  onEdit?: () => void
}

const statusColors = {
  ACTIVE: "bg-chart-2", // Green semantic token
  INACTIVE: "bg-muted",
  SUSPENDED: "bg-destructive",
  GRADUATED: "bg-primary",
  TRANSFERRED: "bg-chart-4", // Yellow/accent semantic token
  DROPPED_OUT: "bg-destructive",
}

const statusLabels = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  SUSPENDED: "Suspended",
  GRADUATED: "Graduated",
  TRANSFERRED: "Transferred",
  DROPPED_OUT: "Dropped Out",
}

export function StudentProfile({
  student,
  dictionary,
  onEdit,
}: StudentProfileProps) {
  const [activeTab, setActiveTab] = useState("personal")

  const getInitials = () => {
    return `${student.givenName?.[0] || ""}${student.surname?.[0] || ""}`.toUpperCase()
  }

  const getFullName = () => {
    return [student.givenName, student.middleName, student.surname]
      .filter(Boolean)
      .join(" ")
  }

  const getAge = () => {
    if (!student.dateOfBirth) return null
    const today = new Date()
    const birthDate = new Date(student.dateOfBirth)
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

  const handlePrint = () => {
    window.print()
  }

  const handleDownload = () => {
    // Implement PDF download functionality
    console.log("Download student profile as PDF")
  }

  const handleShare = () => {
    // Implement share functionality
    console.log("Share student profile")
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-6 md:flex-row">
            {/* Profile Photo */}
            <div className="flex-shrink-0">
              <Avatar className="h-32 w-32">
                <AvatarImage
                  src={student.profilePhotoUrl || undefined}
                  alt={getFullName()}
                />
                <AvatarFallback className="text-2xl">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* Basic Info */}
            <div className="flex-1 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="flex items-center gap-2">
                    {getFullName()}
                    <Badge
                      className={cn(statusColors[student.status], "text-white")}
                    >
                      {statusLabels[student.status]}
                    </Badge>
                  </h2>
                  <div className="text-muted-foreground mt-2 flex items-center gap-4">
                    {student.grNumber && (
                      <span className="flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        GR: {student.grNumber}
                      </span>
                    )}
                    {student.admissionNumber && (
                      <span className="flex items-center gap-1">
                        <School className="h-4 w-4" />
                        Admission: {student.admissionNumber}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={onEdit}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Pencil
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <EllipsisVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handlePrint}>
                        <Printer className="mr-2 h-4 w-4" />
                        Print Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleDownload}>
                        <Download className="mr-2 h-4 w-4" />
                        Download PDF
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleShare}>
                        <Share2 className="mr-2 h-4 w-4" />
                        Share Profile
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600">
                        Generate ID Card
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Quick Info Grid */}
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <div className="space-y-1">
                  <p className="text-muted-foreground text-sm">Date of Birth</p>
                  <p className="font-medium">
                    {student.dateOfBirth
                      ? format(new Date(student.dateOfBirth), "dd MMM yyyy")
                      : "-"}
                  </p>
                  {getAge() && (
                    <p className="text-muted-foreground text-xs">
                      {getAge()} years old
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground text-sm">Gender</p>
                  <p className="font-medium">{student.gender || "-"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground text-sm">Blood Group</p>
                  <p className="font-medium">{student.bloodGroup || "-"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground text-sm">Nationality</p>
                  <p className="font-medium">{student.nationality || "-"}</p>
                </div>
              </div>

              {/* Contact Info */}
              <div className="flex flex-wrap gap-4 text-sm">
                {student.email && (
                  <a
                    href={`mailto:${student.email}`}
                    className="flex items-center gap-1 text-blue-600 hover:underline"
                  >
                    <Mail className="h-4 w-4" />
                    {student.email}
                  </a>
                )}
                {student.mobileNumber && (
                  <a
                    href={`tel:${student.mobileNumber}`}
                    className="flex items-center gap-1 text-blue-600 hover:underline"
                  >
                    <Phone className="h-4 w-4" />
                    {student.mobileNumber}
                  </a>
                )}
                {student.city && (
                  <span className="text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {[student.city, student.state, student.country]
                      .filter(Boolean)
                      .join(", ")}
                  </span>
                )}
              </div>

              {/* Emergency Contact */}
              {student.emergencyContactName && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 dark:bg-red-950/20">
                  <TriangleAlert className="h-4 w-4 text-red-600" />
                  <div className="text-sm">
                    <span className="font-medium">Emergency Contact:</span>{" "}
                    {student.emergencyContactName} (
                    {student.emergencyContactRelation}) -{" "}
                    <a
                      href={`tel:${student.emergencyContactPhone}`}
                      className="text-blue-600 hover:underline"
                    >
                      {student.emergencyContactPhone}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs Section */}
      <Card>
        <CardContent className="p-0">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="h-auto w-full justify-start rounded-none border-b bg-transparent p-0">
              <TabsTrigger
                value="personal"
                className="data-[state=active]:border-primary rounded-none border-b-2 border-transparent"
              >
                <User className="mr-2 h-4 w-4" />
                Personal
              </TabsTrigger>
              <TabsTrigger
                value="academic"
                className="data-[state=active]:border-primary rounded-none border-b-2 border-transparent"
              >
                <School className="mr-2 h-4 w-4" />
                Academic
              </TabsTrigger>
              <TabsTrigger
                value="guardian"
                className="data-[state=active]:border-primary rounded-none border-b-2 border-transparent"
              >
                <User className="mr-2 h-4 w-4" />
                Guardians
              </TabsTrigger>
              <TabsTrigger
                value="documents"
                className="data-[state=active]:border-primary rounded-none border-b-2 border-transparent"
              >
                <FileText className="mr-2 h-4 w-4" />
                Documents
              </TabsTrigger>
              <TabsTrigger
                value="health"
                className="data-[state=active]:border-primary rounded-none border-b-2 border-transparent"
              >
                <Heart className="mr-2 h-4 w-4" />
                Health
              </TabsTrigger>
              <TabsTrigger
                value="achievements"
                className="data-[state=active]:border-primary rounded-none border-b-2 border-transparent"
              >
                <Award className="mr-2 h-4 w-4" />
                Achievements
              </TabsTrigger>
              <TabsTrigger
                value="attendance"
                className="data-[state=active]:border-primary rounded-none border-b-2 border-transparent"
              >
                <Calendar className="mr-2 h-4 w-4" />
                Attendance
              </TabsTrigger>
              <TabsTrigger
                value="fees"
                className="data-[state=active]:border-primary rounded-none border-b-2 border-transparent"
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Fees
              </TabsTrigger>
            </TabsList>

            <div className="p-6">
              <TabsContent value="personal" className="mt-0">
                <PersonalTab student={student} />
              </TabsContent>

              <TabsContent value="academic" className="mt-0">
                <AcademicTab student={student} />
              </TabsContent>

              <TabsContent value="guardian" className="mt-0">
                <GuardianTab student={student} />
              </TabsContent>

              <TabsContent value="documents" className="mt-0">
                <DocumentsTab student={student} />
              </TabsContent>

              <TabsContent value="health" className="mt-0">
                <HealthTab student={student} />
              </TabsContent>

              <TabsContent value="achievements" className="mt-0">
                <AchievementsTab student={student} />
              </TabsContent>

              <TabsContent value="attendance" className="mt-0">
                <AttendanceTab student={student} />
              </TabsContent>

              <TabsContent value="fees" className="mt-0">
                <FeesTab student={student} />
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Heart,
  School,
  FileText,
  Award,
  AlertTriangle,
  BookOpen,
  CreditCard,
  Edit,
  Download,
  Printer,
  Share2,
  MoreVertical,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Import tab components
import { PersonalTab } from "./tabs/personal-tab";
import { AcademicTab } from "./tabs/academic-tab";
import { GuardianTab } from "./tabs/guardian-tab";
import { DocumentsTab } from "./tabs/documents-tab";
import { HealthTab } from "./tabs/health-tab";
import { AchievementsTab } from "./tabs/achievements-tab";
import { AttendanceTab } from "./tabs/attendance-tab";
import { FeesTab } from "./tabs/fees-tab";

import type { Student } from "../registration/types";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface StudentProfileProps {
  student: Student;
  dictionary?: any;
  onEdit?: () => void;
}

const statusColors = {
  ACTIVE: "bg-green-500",
  INACTIVE: "bg-gray-500",
  SUSPENDED: "bg-red-500",
  GRADUATED: "bg-blue-500",
  TRANSFERRED: "bg-yellow-500",
  DROPPED_OUT: "bg-red-700",
};

const statusLabels = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  SUSPENDED: "Suspended",
  GRADUATED: "Graduated",
  TRANSFERRED: "Transferred",
  DROPPED_OUT: "Dropped Out",
};

export function StudentProfile({ student, dictionary, onEdit }: StudentProfileProps) {
  const [activeTab, setActiveTab] = useState("personal");

  const getInitials = () => {
    return `${student.givenName?.[0] || ""}${student.surname?.[0] || ""}`.toUpperCase();
  };

  const getFullName = () => {
    return [student.givenName, student.middleName, student.surname]
      .filter(Boolean)
      .join(" ");
  };

  const getAge = () => {
    if (!student.dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(student.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Implement PDF download functionality
    console.log("Download student profile as PDF");
  };

  const handleShare = () => {
    // Implement share functionality
    console.log("Share student profile");
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Profile Photo */}
            <div className="flex-shrink-0">
              <Avatar className="h-32 w-32">
                <AvatarImage src={student.profilePhotoUrl || undefined} alt={getFullName()} />
                <AvatarFallback className="text-2xl">{getInitials()}</AvatarFallback>
              </Avatar>
            </div>

            {/* Basic Info */}
            <div className="flex-1 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="flex items-center gap-2">
                    {getFullName()}
                    <Badge className={cn(statusColors[student.status], "text-white")}>
                      {statusLabels[student.status]}
                    </Badge>
                  </h2>
                  <div className="flex items-center gap-4 text-muted-foreground mt-2">
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
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handlePrint}>
                        <Printer className="h-4 w-4 mr-2" />
                        Print Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleDownload}>
                        <Download className="h-4 w-4 mr-2" />
                        Download PDF
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleShare}>
                        <Share2 className="h-4 w-4 mr-2" />
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
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Date of Birth</p>
                  <p className="font-medium">
                    {student.dateOfBirth ? format(new Date(student.dateOfBirth), "dd MMM yyyy") : "-"}
                  </p>
                  {getAge() && <p className="text-xs text-muted-foreground">{getAge()} years old</p>}
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Gender</p>
                  <p className="font-medium">{student.gender || "-"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Blood Group</p>
                  <p className="font-medium">{student.bloodGroup || "-"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Nationality</p>
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
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {[student.city, student.state, student.country]
                      .filter(Boolean)
                      .join(", ")}
                  </span>
                )}
              </div>

              {/* Emergency Contact */}
              {student.emergencyContactName && (
                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <div className="text-sm">
                    <span className="font-medium">Emergency Contact:</span>{" "}
                    {student.emergencyContactName} ({student.emergencyContactRelation}) -{" "}
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
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full justify-start rounded-none border-b h-auto p-0 bg-transparent">
              <TabsTrigger
                value="personal"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
              >
                <User className="h-4 w-4 mr-2" />
                Personal
              </TabsTrigger>
              <TabsTrigger
                value="academic"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
              >
                <School className="h-4 w-4 mr-2" />
                Academic
              </TabsTrigger>
              <TabsTrigger
                value="guardian"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
              >
                <User className="h-4 w-4 mr-2" />
                Guardians
              </TabsTrigger>
              <TabsTrigger
                value="documents"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
              >
                <FileText className="h-4 w-4 mr-2" />
                Documents
              </TabsTrigger>
              <TabsTrigger
                value="health"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
              >
                <Heart className="h-4 w-4 mr-2" />
                Health
              </TabsTrigger>
              <TabsTrigger
                value="achievements"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
              >
                <Award className="h-4 w-4 mr-2" />
                Achievements
              </TabsTrigger>
              <TabsTrigger
                value="attendance"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Attendance
              </TabsTrigger>
              <TabsTrigger
                value="fees"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
              >
                <CreditCard className="h-4 w-4 mr-2" />
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
  );
}
"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  User, Mail, Phone, Calendar, Briefcase, GraduationCap, BookOpen,
  Building, Award, Clock, Edit, Download, FileText, MapPin,
  Star, TrendingUp, Users, AlertCircle, CheckCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface TeacherProfileProps {
  teacher: any; // In production, use proper typed interface
  onEdit?: () => void;
}

export function TeacherProfile({ teacher, onEdit }: TeacherProfileProps) {
  const [activeTab, setActiveTab] = useState("overview");

  // Calculate profile completion
  const calculateProfileCompletion = () => {
    const sections = {
      basic: !!(teacher.givenName && teacher.surname && teacher.emailAddress),
      contact: !!(teacher.phoneNumbers && teacher.phoneNumbers.length > 0),
      employment: !!(teacher.employmentStatus && teacher.employmentType),
      qualifications: !!(teacher.qualifications && teacher.qualifications.length > 0),
      experience: !!(teacher.experiences && teacher.experiences.length > 0),
      subjects: !!(teacher.subjectExpertise && teacher.subjectExpertise.length > 0),
    };

    const completed = Object.values(sections).filter(Boolean).length;
    const total = Object.keys(sections).length;
    return { percentage: (completed / total) * 100, sections };
  };

  const profileCompletion = calculateProfileCompletion();

  // Calculate total experience
  const calculateTotalExperience = () => {
    if (!teacher.experiences || teacher.experiences.length === 0) return "No experience";

    let totalMonths = 0;
    teacher.experiences.forEach((exp: any) => {
      if (exp.startDate) {
        const start = new Date(exp.startDate);
        const end = exp.endDate ? new Date(exp.endDate) : new Date();
        const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
        totalMonths += months;
      }
    });

    const years = Math.floor(totalMonths / 12);
    const months = totalMonths % 12;

    if (years > 0 && months > 0) {
      return `${years} year${years > 1 ? 's' : ''}, ${months} month${months > 1 ? 's' : ''}`;
    } else if (years > 0) {
      return `${years} year${years > 1 ? 's' : ''}`;
    } else {
      return `${months} month${months > 1 ? 's' : ''}`;
    }
  };

  // Get primary phone number
  const getPrimaryPhone = () => {
    const primary = teacher.phoneNumbers?.find((p: any) => p.isPrimary);
    return primary || teacher.phoneNumbers?.[0];
  };

  const formatDate = (date: any) => {
    if (!date) return "Not specified";
    try {
      return format(new Date(date), "MMM dd, yyyy");
    } catch {
      return "Invalid date";
    }
  };

  // Status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE": return "bg-green-100 text-green-800";
      case "ON_LEAVE": return "bg-yellow-100 text-yellow-800";
      case "TERMINATED": return "bg-red-100 text-red-800";
      case "RETIRED": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={teacher.avatarUrl} />
                <AvatarFallback className="text-2xl">
                  {teacher.givenName?.[0]}{teacher.surname?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <h2 className="text-2xl font-bold">
                  {teacher.givenName} {teacher.surname}
                </h2>
                <p className="text-muted-foreground">
                  {teacher.employeeId ? `Employee ID: ${teacher.employeeId}` : "No Employee ID"}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className={cn("capitalize", getStatusColor(teacher.employmentStatus || ""))}>
                    {teacher.employmentStatus?.replace('_', ' ').toLowerCase() || "Unknown"}
                  </Badge>
                  <Badge variant="outline">
                    {teacher.employmentType?.replace('_', '-').toLowerCase() || "Unknown"}
                  </Badge>
                  {teacher.departments?.[0] && (
                    <Badge variant="secondary">
                      {teacher.departments[0].departmentName}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right space-y-2">
              {onEdit && (
                <Button onClick={onEdit} variant="outline" size="sm" className="gap-2">
                  <Edit className="h-4 w-4" />
                  Edit Profile
                </Button>
              )}
              <div className="text-sm text-muted-foreground">
                Joined: {formatDate(teacher.joiningDate)}
              </div>
            </div>
          </div>

          {/* Profile Completion */}
          <div className="mt-6 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Profile Completion</span>
              <span className="font-medium">{Math.round(profileCompletion.percentage)}%</span>
            </div>
            <Progress value={profileCompletion.percentage} className="h-2" />
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Experience</p>
              <p className="text-xl font-semibold">{calculateTotalExperience()}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Qualifications</p>
              <p className="text-xl font-semibold">{teacher.qualifications?.length || 0}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Subjects</p>
              <p className="text-xl font-semibold">{teacher.subjectExpertise?.length || 0}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Classes</p>
              <p className="text-xl font-semibold">{teacher.classes?.length || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs Section */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 w-full max-w-2xl">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="qualifications">Qualifications</TabsTrigger>
          <TabsTrigger value="experience">Experience</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="workload">Workload</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Personal Information */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Full Name</p>
                  <p className="font-medium">{teacher.givenName} {teacher.surname}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Gender</p>
                  <p className="font-medium capitalize">{teacher.gender || "Not specified"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date of Birth</p>
                  <p className="font-medium">{formatDate(teacher.birthDate)}</p>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{teacher.emailAddress || "Not specified"}</p>
                </div>
                {getPrimaryPhone() && (
                  <div>
                    <p className="text-sm text-muted-foreground">Primary Phone</p>
                    <p className="font-medium">
                      {getPrimaryPhone().phoneNumber}
                      <Badge variant="outline" className="ml-2 text-xs">
                        {getPrimaryPhone().phoneType}
                      </Badge>
                    </p>
                  </div>
                )}
                {teacher.phoneNumbers && teacher.phoneNumbers.length > 1 && (
                  <div>
                    <p className="text-sm text-muted-foreground">Other Phones</p>
                    <div className="space-y-1">
                      {teacher.phoneNumbers
                        .filter((p: any) => !p.isPrimary)
                        .map((phone: any, index: number) => (
                          <p key={index} className="text-sm">
                            {phone.phoneNumber}
                            <Badge variant="outline" className="ml-2 text-xs">
                              {phone.phoneType}
                            </Badge>
                          </p>
                        ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Employment Details */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Employment Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Employee ID</p>
                  <p className="font-medium">{teacher.employeeId || "Not assigned"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Joining Date</p>
                  <p className="font-medium">{formatDate(teacher.joiningDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Employment Type</p>
                  <Badge variant="outline">
                    {teacher.employmentType?.replace('_', '-').toLowerCase() || "Unknown"}
                  </Badge>
                </div>
                {teacher.employmentType === "CONTRACT" && (
                  <>
                    <div>
                      <p className="text-sm text-muted-foreground">Contract Period</p>
                      <p className="text-sm">
                        {formatDate(teacher.contractStartDate)} - {formatDate(teacher.contractEndDate)}
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Subject Expertise */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Subject Expertise
                </CardTitle>
              </CardHeader>
              <CardContent>
                {teacher.subjectExpertise && teacher.subjectExpertise.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {teacher.subjectExpertise.map((exp: any, index: number) => (
                      <Badge
                        key={index}
                        variant={exp.expertiseLevel === "PRIMARY" ? "default" : "secondary"}
                        className="gap-1"
                      >
                        {exp.expertiseLevel === "PRIMARY" && <Star className="h-3 w-3" />}
                        {exp.expertiseLevel === "CERTIFIED" && <Award className="h-3 w-3" />}
                        {exp.subject?.name || exp.subjectId}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No subjects specified</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Qualifications Tab */}
        <TabsContent value="qualifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Qualifications & Certifications
              </CardTitle>
              <CardDescription>
                Educational background and professional certifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              {teacher.qualifications && teacher.qualifications.length > 0 ? (
                <div className="space-y-4">
                  {teacher.qualifications.map((qual: any, index: number) => {
                    const isExpired = qual.expiryDate && new Date(qual.expiryDate) < new Date();
                    const isExpiringSoon = qual.expiryDate &&
                      !isExpired &&
                      new Date(qual.expiryDate) < new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

                    return (
                      <div
                        key={index}
                        className={cn(
                          "p-4 border rounded-lg space-y-2",
                          isExpired && "border-destructive bg-destructive/5",
                          isExpiringSoon && "border-yellow-500 bg-yellow-50"
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold">{qual.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {qual.institution}
                              {qual.major && ` • ${qual.major}`}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{qual.qualificationType}</Badge>
                            {isExpired && (
                              <Badge variant="destructive" className="gap-1">
                                <AlertCircle className="h-3 w-3" />
                                Expired
                              </Badge>
                            )}
                            {isExpiringSoon && (
                              <Badge variant="outline" className="gap-1 text-yellow-600">
                                <Clock className="h-3 w-3" />
                                Expiring Soon
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Obtained: {formatDate(qual.dateObtained)}</span>
                          {qual.expiryDate && (
                            <span>Expires: {formatDate(qual.expiryDate)}</span>
                          )}
                          {qual.licenseNumber && (
                            <span>License: {qual.licenseNumber}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground/50" />
                  <p className="mt-2 text-muted-foreground">No qualifications added</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Experience Tab */}
        <TabsContent value="experience" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Professional Experience
              </CardTitle>
              <CardDescription>
                Work history and teaching experience
              </CardDescription>
            </CardHeader>
            <CardContent>
              {teacher.experiences && teacher.experiences.length > 0 ? (
                <div className="space-y-4">
                  {/* Experience Timeline */}
                  <div className="relative">
                    {teacher.experiences.map((exp: any, index: number) => {
                      const duration = exp.startDate ? (() => {
                        const start = new Date(exp.startDate);
                        const end = exp.endDate ? new Date(exp.endDate) : new Date();
                        const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
                        const years = Math.floor(months / 12);
                        const remainingMonths = months % 12;

                        if (years > 0 && remainingMonths > 0) {
                          return `${years} yr ${remainingMonths} mo`;
                        } else if (years > 0) {
                          return `${years} year${years > 1 ? 's' : ''}`;
                        } else {
                          return `${remainingMonths} month${remainingMonths > 1 ? 's' : ''}`;
                        }
                      })() : null;

                      return (
                        <div key={index} className="flex gap-4 pb-8 relative">
                          {/* Timeline line */}
                          {index < teacher.experiences.length - 1 && (
                            <div className="absolute left-[19px] top-10 bottom-0 w-0.5 bg-border" />
                          )}

                          {/* Timeline dot */}
                          <div className={cn(
                            "w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center",
                            exp.isCurrent ? "bg-primary text-primary-foreground" : "bg-muted"
                          )}>
                            <Briefcase className="h-5 w-5" />
                          </div>

                          {/* Content */}
                          <div className="flex-1 space-y-2">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-semibold">{exp.position}</h4>
                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                  <Building className="h-3 w-3" />
                                  {exp.institution}
                                </p>
                              </div>
                              {exp.isCurrent && (
                                <Badge variant="default">Current</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              <span>
                                {formatDate(exp.startDate)} - {exp.isCurrent ? "Present" : formatDate(exp.endDate)}
                              </span>
                              {duration && (
                                <>
                                  <span>•</span>
                                  <span>{duration}</span>
                                </>
                              )}
                            </div>
                            {exp.description && (
                              <p className="text-sm text-muted-foreground">
                                {exp.description}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Briefcase className="h-12 w-12 mx-auto text-muted-foreground/50" />
                  <p className="mt-2 text-muted-foreground">No experience added</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Schedule Tab */}
        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Teaching Schedule
              </CardTitle>
              <CardDescription>
                Weekly timetable and class assignments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50" />
                <p className="mt-2 text-muted-foreground">Schedule view coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Workload Tab */}
        <TabsContent value="workload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Workload Analysis
              </CardTitle>
              <CardDescription>
                Teaching load and capacity metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground/50" />
                <p className="mt-2 text-muted-foreground">Workload analysis coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
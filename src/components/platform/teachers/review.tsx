"use client";

import { type UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  User, Mail, Calendar, Briefcase, GraduationCap, BookOpen,
  Building, Phone, MapPin, FileText, Award, CheckCircle,
  AlertCircle, Clock, Star
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

import { TeacherFormStepProps } from "./types";
import { EMPLOYMENT_STATUS_OPTIONS, EMPLOYMENT_TYPE_OPTIONS } from "./config";

// Mock subjects data - should match the one in expertise.tsx
const AVAILABLE_SUBJECTS = [
  { id: "sub1", name: "Mathematics" },
  { id: "sub2", name: "Physics" },
  { id: "sub3", name: "Chemistry" },
  { id: "sub4", name: "Biology" },
  { id: "sub5", name: "English" },
  { id: "sub6", name: "Arabic" },
  { id: "sub7", name: "French" },
  { id: "sub8", name: "History" },
  { id: "sub9", name: "Geography" },
  { id: "sub10", name: "Computer Science" },
  { id: "sub11", name: "Physical Education" },
  { id: "sub12", name: "Art" },
  { id: "sub13", name: "Music" },
];

export function ReviewStep({ form, isView }: TeacherFormStepProps & { onEditStep?: (step: number) => void }) {
  const values = form.watch();

  const getCompletionStatus = () => {
    const sections = {
      basic: !!(values.givenName && values.surname && values.gender),
      contact: !!values.emailAddress,
      employment: !!(values.employmentStatus || values.employmentType),
      qualifications: values.qualifications && values.qualifications.length > 0,
      experience: values.experiences && values.experiences.length > 0,
      expertise: values.subjectExpertise && values.subjectExpertise.length > 0,
    };

    const completed = Object.values(sections).filter(Boolean).length;
    const total = Object.keys(sections).length;

    return { sections, completed, total, percentage: (completed / total) * 100 };
  };

  const status = getCompletionStatus();

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return "Not specified";
    try {
      return format(new Date(date), "MMM dd, yyyy");
    } catch {
      return "Invalid date";
    }
  };

  const SectionHeader = ({ icon: Icon, title, complete }: { icon: any; title: string; complete: boolean }) => (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <h3 className="font-semibold">{title}</h3>
      </div>
      {complete ? (
        <CheckCircle className="h-4 w-4 text-green-500" />
      ) : (
        <AlertCircle className="h-4 w-4 text-yellow-500" />
      )}
    </div>
  );

  const InfoRow = ({ label, value, icon: Icon }: { label: string; value: any; icon?: any }) => (
    <div className="flex items-start gap-2">
      {Icon && <Icon className="h-4 w-4 text-muted-foreground mt-0.5" />}
      <div className="flex-1">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-medium">{value || "Not specified"}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Review Teacher Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Profile Completion</span>
              <span className="text-sm font-medium">{status.completed}/{status.total} sections</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${status.percentage}%` }}
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(status.sections).map(([key, complete]) => (
                <div key={key} className="flex items-center gap-2">
                  {complete ? (
                    <CheckCircle className="h-3 w-3 text-green-500" />
                  ) : (
                    <Clock className="h-3 w-3 text-muted-foreground" />
                  )}
                  <span className="text-xs capitalize">{key}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-4">
          {/* Basic Information */}
          <Card>
            <CardHeader className="pb-3">
              <SectionHeader icon={User} title="Basic Information" complete={status.sections.basic} />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <InfoRow label="Given Name" value={values.givenName} />
                <InfoRow label="Surname" value={values.surname} />
                <InfoRow label="Gender" value={values.gender ? values.gender.charAt(0).toUpperCase() + values.gender.slice(1) : null} />
                <InfoRow label="Date of Birth" value={formatDate(values.birthDate)} />
              </div>
            </CardContent>
          </Card>

          {/* Contact Details */}
          <Card>
            <CardHeader className="pb-3">
              <SectionHeader icon={Mail} title="Contact Details" complete={status.sections.contact} />
            </CardHeader>
            <CardContent>
              <InfoRow label="Email Address" value={values.emailAddress} icon={Mail} />
            </CardContent>
          </Card>

          {/* Employment Details */}
          <Card>
            <CardHeader className="pb-3">
              <SectionHeader icon={Briefcase} title="Employment Details" complete={status.sections.employment} />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <InfoRow label="Employee ID" value={values.employeeId} />
                <InfoRow label="Joining Date" value={formatDate(values.joiningDate)} />
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Employment Status</p>
                  <Badge variant={values.employmentStatus === "ACTIVE" ? "default" : "secondary"}>
                    {EMPLOYMENT_STATUS_OPTIONS.find(opt => opt.value === values.employmentStatus)?.label || "Not specified"}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Employment Type</p>
                  <Badge variant="outline">
                    {EMPLOYMENT_TYPE_OPTIONS.find(opt => opt.value === values.employmentType)?.label || "Not specified"}
                  </Badge>
                </div>
                {values.employmentType === "CONTRACT" && (
                  <>
                    <InfoRow label="Contract Start" value={formatDate(values.contractStartDate)} />
                    <InfoRow label="Contract End" value={formatDate(values.contractEndDate)} />
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Qualifications */}
          <Card>
            <CardHeader className="pb-3">
              <SectionHeader icon={GraduationCap} title="Qualifications" complete={status.sections.qualifications} />
            </CardHeader>
            <CardContent>
              {values.qualifications && values.qualifications.length > 0 ? (
                <div className="space-y-3">
                  {values.qualifications.map((qual, index) => (
                    <div key={index} className="border-l-2 border-primary pl-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{qual.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {qual.institution} {qual.major && `• ${qual.major}`}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Obtained: {formatDate(qual.dateObtained)}
                            {qual.expiryDate && ` • Expires: ${formatDate(qual.expiryDate)}`}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {qual.qualificationType}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No qualifications added</p>
              )}
            </CardContent>
          </Card>

          {/* Experience */}
          <Card>
            <CardHeader className="pb-3">
              <SectionHeader icon={Building} title="Experience" complete={status.sections.experience} />
            </CardHeader>
            <CardContent>
              {values.experiences && values.experiences.length > 0 ? (
                <div className="space-y-3">
                  {values.experiences.map((exp, index) => (
                    <div key={index} className="border-l-2 border-primary pl-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{exp.position}</p>
                          <p className="text-sm text-muted-foreground">{exp.institution}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(exp.startDate)} - {exp.isCurrent ? "Present" : formatDate(exp.endDate)}
                          </p>
                        </div>
                        {exp.isCurrent && (
                          <Badge variant="default" className="text-xs">Current</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No experience added</p>
              )}
            </CardContent>
          </Card>

          {/* Subject Expertise */}
          <Card>
            <CardHeader className="pb-3">
              <SectionHeader icon={BookOpen} title="Subject Expertise" complete={status.sections.expertise} />
            </CardHeader>
            <CardContent>
              {values.subjectExpertise && values.subjectExpertise.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {values.subjectExpertise.map((exp, index) => {
                    const subject = AVAILABLE_SUBJECTS.find(s => s.id === exp.subjectId);
                    return (
                      <Badge
                        key={index}
                        variant={exp.expertiseLevel === "PRIMARY" ? "default" : "secondary"}
                        className="gap-1"
                      >
                        {exp.expertiseLevel === "PRIMARY" && <Star className="h-3 w-3" />}
                        {exp.expertiseLevel === "CERTIFIED" && <Award className="h-3 w-3" />}
                        {subject?.name || exp.subjectId}
                      </Badge>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No subjects specified</p>
              )}
            </CardContent>
          </Card>
        </div>
      </ScrollArea>

      {/* Action Summary */}
      <Card className={cn(
        "border-2",
        status.percentage === 100 ? "border-green-500 bg-green-50" : "border-yellow-500 bg-yellow-50"
      )}>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {status.percentage === 100 ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="font-medium text-green-700">Profile Complete</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                  <span className="font-medium text-yellow-700">
                    Profile {Math.round(status.percentage)}% Complete
                  </span>
                </>
              )}
            </div>
            {!status.sections.basic && <Badge variant="outline">Missing: Basic Info</Badge>}
            {!status.sections.contact && <Badge variant="outline">Missing: Contact</Badge>}
            {!status.sections.employment && <Badge variant="outline">Missing: Employment</Badge>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
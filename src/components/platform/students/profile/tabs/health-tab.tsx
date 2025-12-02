import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Heart, TriangleAlert, Pill, Stethoscope, Shield, Calendar, Plus, FileText } from "lucide-react";
import type { Student, HealthRecord } from "../../registration/types";
import { format } from "date-fns";

interface HealthTabProps {
  student: Student;
}

export function HealthTab({ student }: HealthTabProps) {
  // Mock health records for demonstration
  const healthRecords: HealthRecord[] = student.healthRecords || [
    {
      id: "1",
      schoolId: student.schoolId,
      studentId: student.id,
      recordDate: new Date("2024-01-15"),
      recordType: "VACCINATION",
      title: "COVID-19 Booster",
      description: "Pfizer-BioNTech COVID-19 Vaccine, Booster Dose",
      severity: "LOW",
      doctorName: "Dr. Sarah Johnson",
      hospitalName: "City Medical Center",
      recordedBy: "School Nurse",
      createdAt: new Date("2024-01-15"),
      updatedAt: new Date("2024-01-15"),
    },
    {
      id: "2",
      schoolId: student.schoolId,
      studentId: student.id,
      recordDate: new Date("2024-02-20"),
      recordType: "MEDICAL_CHECKUP",
      title: "Annual Health Checkup",
      description: "Routine annual health examination. All parameters normal.",
      severity: "LOW",
      doctorName: "Dr. Michael Brown",
      hospitalName: "School Health Clinic",
      recordedBy: "School Nurse",
      createdAt: new Date("2024-02-20"),
      updatedAt: new Date("2024-02-20"),
    },
    {
      id: "3",
      schoolId: student.schoolId,
      studentId: student.id,
      recordDate: new Date("2024-03-10"),
      recordType: "INCIDENT",
      title: "Minor Sports Injury",
      description: "Sprained ankle during football practice. Rest recommended for 1 week.",
      severity: "MEDIUM",
      doctorName: "Dr. Emily White",
      followUpDate: new Date("2024-03-17"),
      prescription: "Ibuprofen 400mg twice daily for 5 days",
      recordedBy: "PE Teacher",
      createdAt: new Date("2024-03-10"),
      updatedAt: new Date("2024-03-10"),
    },
  ];

  const vaccinations = healthRecords.filter(r => r.recordType === "VACCINATION");
  const incidents = healthRecords.filter(r => r.recordType === "INCIDENT");

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case "LOW": return "bg-green-100 text-green-800";
      case "MEDIUM": return "bg-yellow-100 text-yellow-800";
      case "HIGH": return "bg-orange-100 text-orange-800";
      case "CRITICAL": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getRecordTypeIcon = (type: string) => {
    switch (type) {
      case "VACCINATION": return "💉";
      case "MEDICAL_CHECKUP": return "🏥";
      case "INCIDENT": return "🚑";
      case "ILLNESS": return "🤒";
      case "SURGERY": return "⚕️";
      default: return "📋";
    }
  };

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="flex justify-end">
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Health Record
        </Button>
      </div>

      {/* Allergies Alert */}
      {student.allergies && (
        <Alert className="border-red-200 bg-red-50">
          <TriangleAlert className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-900">Allergies</AlertTitle>
          <AlertDescription className="text-red-700">
            {student.allergies}
          </AlertDescription>
        </Alert>
      )}

      {/* Medical Conditions */}
      {student.medicalConditions && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <Heart className="h-4 w-4 text-yellow-600" />
          <AlertTitle className="text-yellow-900">Medical Conditions</AlertTitle>
          <AlertDescription className="text-yellow-700">
            {student.medicalConditions}
          </AlertDescription>
        </Alert>
      )}

      {/* Basic Health Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Basic Health Information
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm text-muted-foreground">Blood Group</p>
            <p className="font-medium text-lg">{student.bloodGroup || "Not specified"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Regular Medications</p>
            <p className="font-medium">{student.medicationRequired || "None"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Family Doctor</p>
            <p className="font-medium">{student.doctorName || "Not specified"}</p>
            {student.doctorContact && (
              <p className="text-sm text-muted-foreground">{student.doctorContact}</p>
            )}
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Health Insurance</p>
            <p className="font-medium">{student.insuranceProvider || "Not specified"}</p>
            {student.insuranceNumber && (
              <p className="text-sm text-muted-foreground">Policy: {student.insuranceNumber}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Vaccination Records */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Vaccination Records
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {vaccinations.length > 0 ? (
              vaccinations.map((record) => (
                <div key={record.id} className="flex items-start justify-between p-3 border rounded-lg">
                  <div className="flex gap-3">
                    <span className="text-2xl">{getRecordTypeIcon(record.recordType)}</span>
                    <div>
                      <p className="font-medium">{record.title}</p>
                      <p className="text-sm text-muted-foreground">{record.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(record.recordDate), "dd MMM yyyy")} • {record.doctorName}
                      </p>
                    </div>
                  </div>
                  {record.followUpDate && (
                    <Badge variant="outline" className="text-xs">
                      Next: {format(new Date(record.followUpDate), "dd MMM")}
                    </Badge>
                  )}
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-4">No vaccination records</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Health Incidents */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TriangleAlert className="h-5 w-5" />
            Health Incidents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {incidents.length > 0 ? (
              incidents.map((record) => (
                <div key={record.id} className="p-3 border rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{getRecordTypeIcon(record.recordType)}</span>
                      <div>
                        <p className="font-medium">{record.title}</p>
                        <Badge variant="secondary" className={getSeverityColor(record.severity)}>
                          {record.severity} Severity
                        </Badge>
                      </div>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(record.recordDate), "dd MMM yyyy")}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{record.description}</p>
                  {record.prescription && (
                    <div className="p-2 bg-muted rounded">
                      <p className="text-xs font-medium flex items-center gap-1">
                        <Pill className="h-3 w-3" />
                        Prescription
                      </p>
                      <p className="text-xs text-muted-foreground">{record.prescription}</p>
                    </div>
                  )}
                  {record.followUpDate && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Follow-up: {format(new Date(record.followUpDate), "dd MMM yyyy")}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-4">No health incidents recorded</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Medical History Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Medical History Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {healthRecords.map((record, index) => (
              <div key={record.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm">{getRecordTypeIcon(record.recordType)}</span>
                  </div>
                  {index < healthRecords.length - 1 && (
                    <div className="w-0.5 h-16 bg-muted-foreground/20" />
                  )}
                </div>
                <div className="flex-1 pb-8">
                  <p className="font-medium">{record.title}</p>
                  <p className="text-sm text-muted-foreground">{record.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(record.recordDate), "dd MMM yyyy")}
                    </span>
                    {record.doctorName && (
                      <>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">{record.doctorName}</span>
                      </>
                    )}
                    <Badge variant="secondary" className={`text-xs ${getSeverityColor(record.severity)}`}>
                      {record.severity}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
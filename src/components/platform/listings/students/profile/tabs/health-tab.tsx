import { format } from "date-fns"
import {
  Calendar,
  FileText,
  Heart,
  Pill,
  Plus,
  Shield,
  Stethoscope,
  TriangleAlert,
} from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import type { HealthRecord, Student } from "../../registration/types"

interface HealthTabProps {
  student: Student
}

export function HealthTab({ student }: HealthTabProps) {
  // Use real health records from database
  const healthRecords = student.healthRecords || []

  const vaccinations = healthRecords.filter(
    (r: any) => r.recordType === "VACCINATION" || r.recordType === "Vaccination"
  )
  const incidents = healthRecords.filter(
    (r: any) => r.recordType === "INCIDENT" || r.recordType === "Incident"
  )

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case "LOW":
        return "bg-green-100 text-green-800"
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800"
      case "HIGH":
        return "bg-orange-100 text-orange-800"
      case "CRITICAL":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getRecordTypeIcon = (type: string) => {
    switch (type) {
      case "VACCINATION":
        return "💉"
      case "MEDICAL_CHECKUP":
        return "🏥"
      case "INCIDENT":
        return "🚑"
      case "ILLNESS":
        return "🤒"
      case "SURGERY":
        return "⚕️"
      default:
        return "📋"
    }
  }

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="flex justify-end">
        <Button variant="outline" size="sm">
          <Plus className="mr-2 h-4 w-4" />
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
          <AlertTitle className="text-yellow-900">
            Medical Conditions
          </AlertTitle>
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
            <p className="text-muted-foreground text-sm">Blood Group</p>
            <p className="text-lg font-medium">
              {student.bloodGroup || "Not specified"}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-sm">Regular Medications</p>
            <p className="font-medium">
              {student.medicationRequired || "None"}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-sm">Family Doctor</p>
            <p className="font-medium">
              {student.doctorName || "Not specified"}
            </p>
            {student.doctorContact && (
              <p className="text-muted-foreground text-sm">
                {student.doctorContact}
              </p>
            )}
          </div>
          <div>
            <p className="text-muted-foreground text-sm">Health Insurance</p>
            <p className="font-medium">
              {student.insuranceProvider || "Not specified"}
            </p>
            {student.insuranceNumber && (
              <p className="text-muted-foreground text-sm">
                Policy: {student.insuranceNumber}
              </p>
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
                <div
                  key={record.id}
                  className="flex items-start justify-between rounded-lg border p-3"
                >
                  <div className="flex gap-3">
                    <span className="text-2xl">
                      {getRecordTypeIcon(record.recordType)}
                    </span>
                    <div>
                      <p className="font-medium">{record.title}</p>
                      <p className="text-muted-foreground text-sm">
                        {record.description}
                      </p>
                      <p className="text-muted-foreground mt-1 text-xs">
                        {format(new Date(record.recordDate), "dd MMM yyyy")} •{" "}
                        {record.doctorName}
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
              <p className="text-muted-foreground py-4 text-center">
                No vaccination records
              </p>
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
                <div key={record.id} className="rounded-lg border p-3">
                  <div className="mb-2 flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">
                        {getRecordTypeIcon(record.recordType)}
                      </span>
                      <div>
                        <p className="font-medium">{record.title}</p>
                        <Badge
                          variant="secondary"
                          className={getSeverityColor(record.severity)}
                        >
                          {record.severity} Severity
                        </Badge>
                      </div>
                    </div>
                    <span className="text-muted-foreground text-sm">
                      {format(new Date(record.recordDate), "dd MMM yyyy")}
                    </span>
                  </div>
                  <p className="text-muted-foreground mb-2 text-sm">
                    {record.description}
                  </p>
                  {record.prescription && (
                    <div className="bg-muted rounded p-2">
                      <p className="flex items-center gap-1 text-xs font-medium">
                        <Pill className="h-3 w-3" />
                        Prescription
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {record.prescription}
                      </p>
                    </div>
                  )}
                  {record.followUpDate && (
                    <p className="text-muted-foreground mt-2 text-xs">
                      Follow-up:{" "}
                      {format(new Date(record.followUpDate), "dd MMM yyyy")}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <p className="text-muted-foreground py-4 text-center">
                No health incidents recorded
              </p>
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
                  <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-full">
                    <span className="text-sm">
                      {getRecordTypeIcon(record.recordType)}
                    </span>
                  </div>
                  {index < healthRecords.length - 1 && (
                    <div className="bg-muted-foreground/20 h-16 w-0.5" />
                  )}
                </div>
                <div className="flex-1 pb-8">
                  <p className="font-medium">{record.title}</p>
                  <p className="text-muted-foreground text-sm">
                    {record.description}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-muted-foreground text-xs">
                      {format(new Date(record.recordDate), "dd MMM yyyy")}
                    </span>
                    {record.doctorName && (
                      <>
                        <span className="text-muted-foreground text-xs">•</span>
                        <span className="text-muted-foreground text-xs">
                          {record.doctorName}
                        </span>
                      </>
                    )}
                    <Badge
                      variant="secondary"
                      className={`text-xs ${getSeverityColor(record.severity)}`}
                    >
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
  )
}

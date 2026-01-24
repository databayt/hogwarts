import { format } from "date-fns"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"

import type { Student } from "../../registration/types"

interface PersonalTabProps {
  student: Student
}

export function PersonalTab({ student }: PersonalTabProps) {
  const InfoRow = ({ label, value }: { label: string; value: any }) => (
    <div className="flex flex-col space-y-1">
      <Label className="text-muted-foreground text-sm">{label}</Label>
      <p className="font-medium">{value || "-"}</p>
    </div>
  )

  return (
    <div className="grid gap-6">
      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <InfoRow label="First Name" value={student.givenName} />
          <InfoRow label="Middle Name" value={student.middleName} />
          <InfoRow label="Last Name" value={student.surname} />
          <InfoRow
            label="Date of Birth"
            value={
              student.dateOfBirth
                ? format(new Date(student.dateOfBirth), "dd MMM yyyy")
                : null
            }
          />
          <InfoRow label="Gender" value={student.gender} />
          <InfoRow label="Blood Group" value={student.bloodGroup} />
          <InfoRow label="Nationality" value={student.nationality} />
          <InfoRow label="Student Type" value={student.studentType} />
          <InfoRow label="Category" value={student.category} />
        </CardContent>
      </Card>

      {/* Identification */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Identification</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <InfoRow label="GR Number" value={student.grNumber} />
          <InfoRow label="Admission Number" value={student.admissionNumber} />
          <InfoRow label="Student ID" value={student.studentId} />
          <InfoRow label="Passport Number" value={student.passportNumber} />
          <InfoRow label="Visa Status" value={student.visaStatus} />
          <InfoRow
            label="Visa Expiry"
            value={
              student.visaExpiryDate
                ? format(new Date(student.visaExpiryDate), "dd MMM yyyy")
                : null
            }
          />
          <InfoRow label="ID Card Number" value={student.idCardNumber} />
          <InfoRow
            label="ID Card Issue Date"
            value={
              student.idCardIssuedDate
                ? format(new Date(student.idCardIssuedDate), "dd MMM yyyy")
                : null
            }
          />
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <InfoRow label="Email" value={student.email} />
          <InfoRow label="Mobile Number" value={student.mobileNumber} />
          <InfoRow label="Alternate Phone" value={student.alternatePhone} />
        </CardContent>
      </Card>

      {/* Current Address */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Current Address</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <InfoRow label="Address" value={student.currentAddress} />
          </div>
          <InfoRow label="City" value={student.city} />
          <InfoRow label="State/Province" value={student.state} />
          <InfoRow label="Postal Code" value={student.postalCode} />
          <InfoRow label="Country" value={student.country} />
        </CardContent>
      </Card>

      {/* Permanent Address */}
      {student.permanentAddress &&
        student.permanentAddress !== student.currentAddress && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Permanent Address</CardTitle>
            </CardHeader>
            <CardContent>
              <InfoRow label="Address" value={student.permanentAddress} />
            </CardContent>
          </Card>
        )}

      {/* Emergency Contact */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Emergency Contact</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <InfoRow label="Contact Name" value={student.emergencyContactName} />
          <InfoRow label="Phone Number" value={student.emergencyContactPhone} />
          <InfoRow
            label="Relationship"
            value={student.emergencyContactRelation}
          />
        </CardContent>
      </Card>

      {/* Enrollment Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Enrollment Information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <InfoRow
            label="Enrollment Date"
            value={
              student.enrollmentDate
                ? format(new Date(student.enrollmentDate), "dd MMM yyyy")
                : null
            }
          />
          <InfoRow
            label="Admission Date"
            value={
              student.admissionDate
                ? format(new Date(student.admissionDate), "dd MMM yyyy")
                : null
            }
          />
          <InfoRow
            label="Graduation Date"
            value={
              student.graduationDate
                ? format(new Date(student.graduationDate), "dd MMM yyyy")
                : null
            }
          />
          <InfoRow label="Status" value={student.status} />
        </CardContent>
      </Card>

      {/* Previous Education */}
      {(student.previousSchoolName || student.transferCertificateNo) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Previous Education</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <InfoRow
              label="Previous School"
              value={student.previousSchoolName}
            />
            <InfoRow
              label="Previous School Address"
              value={student.previousSchoolAddress}
            />
            <InfoRow label="Previous Grade" value={student.previousGrade} />
            <InfoRow
              label="Transfer Certificate No"
              value={student.transferCertificateNo}
            />
            <InfoRow
              label="Transfer Date"
              value={
                student.transferDate
                  ? format(new Date(student.transferDate), "dd MMM yyyy")
                  : null
              }
            />
            <InfoRow
              label="Academic Record"
              value={student.previousAcademicRecord}
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}

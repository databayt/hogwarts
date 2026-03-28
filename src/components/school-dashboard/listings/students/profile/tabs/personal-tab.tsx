// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { format } from "date-fns"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"

import type { Student } from "../../registration/types"

interface PersonalTabProps {
  student: Student
  dictionary?: any
}

export function PersonalTab({ student, dictionary }: PersonalTabProps) {
  const d = dictionary

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
          <CardTitle className="text-lg">
            {d?.personalInformation || "Personal Information"}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <InfoRow
            label={d?.firstName || "First Name"}
            value={student.firstName}
          />
          <InfoRow
            label={d?.middleName || "Middle Name"}
            value={student.middleName}
          />
          <InfoRow
            label={d?.lastName || "Last Name"}
            value={student.lastName}
          />
          <InfoRow
            label={d?.dateOfBirth || "Date of Birth"}
            value={
              student.dateOfBirth
                ? format(new Date(student.dateOfBirth), "dd MMM yyyy")
                : null
            }
          />
          <InfoRow label={d?.gender || "Gender"} value={student.gender} />
          <InfoRow
            label={d?.bloodGroup || "Blood Group"}
            value={student.bloodGroup}
          />
          <InfoRow
            label={d?.nationality || "Nationality"}
            value={student.nationality}
          />
          <InfoRow
            label={d?.studentType || "Student Type"}
            value={student.studentType}
          />
          <InfoRow label={d?.category || "Category"} value={student.category} />
        </CardContent>
      </Card>

      {/* Identification */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {d?.identification || "Identification"}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <InfoRow
            label={d?.grNumber || "GR Number"}
            value={student.grNumber}
          />
          <InfoRow
            label={d?.admissionNumber || "Admission Number"}
            value={student.admissionNumber}
          />
          <InfoRow
            label={d?.studentId || "Student ID"}
            value={student.studentId}
          />
          <InfoRow
            label={d?.passportNumber || "Passport Number"}
            value={student.passportNumber}
          />
          <InfoRow
            label={d?.visaStatus || "Visa Status"}
            value={student.visaStatus}
          />
          <InfoRow
            label={d?.visaExpiry || "Visa Expiry"}
            value={
              student.visaExpiryDate
                ? format(new Date(student.visaExpiryDate), "dd MMM yyyy")
                : null
            }
          />
          <InfoRow
            label={d?.idCardNumber || "ID Card Number"}
            value={student.idCardNumber}
          />
          <InfoRow
            label={d?.idCardIssueDate || "ID Card Issue Date"}
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
          <CardTitle className="text-lg">
            {d?.contactInformation || "Contact Information"}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <InfoRow label={d?.email || "Email"} value={student.email} />
          <InfoRow
            label={d?.mobileNumber || "Mobile Number"}
            value={student.mobileNumber}
          />
          <InfoRow
            label={d?.alternatePhone || "Alternate Phone"}
            value={student.alternatePhone}
          />
        </CardContent>
      </Card>

      {/* Current Address */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {d?.currentAddress || "Current Address"}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <InfoRow
              label={d?.address || "Address"}
              value={student.currentAddress}
            />
          </div>
          <InfoRow label={d?.city || "City"} value={student.city} />
          <InfoRow
            label={d?.stateProvince || "State/Province"}
            value={student.state}
          />
          <InfoRow
            label={d?.postalCode || "Postal Code"}
            value={student.postalCode}
          />
          <InfoRow label={d?.country || "Country"} value={student.country} />
        </CardContent>
      </Card>

      {/* Permanent Address */}
      {student.permanentAddress &&
        student.permanentAddress !== student.currentAddress && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {d?.permanentAddress || "Permanent Address"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <InfoRow
                label={d?.address || "Address"}
                value={student.permanentAddress}
              />
            </CardContent>
          </Card>
        )}

      {/* Emergency Contact */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {d?.emergencyContact || "Emergency Contact"}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <InfoRow
            label={d?.contactName || "Contact Name"}
            value={student.emergencyContactName}
          />
          <InfoRow
            label={d?.phoneNumber || "Phone Number"}
            value={student.emergencyContactPhone}
          />
          <InfoRow
            label={d?.relationship || "Relationship"}
            value={student.emergencyContactRelation}
          />
        </CardContent>
      </Card>

      {/* Enrollment Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {d?.enrollmentInformation || "Enrollment Information"}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <InfoRow
            label={d?.enrollmentDate || "Enrollment Date"}
            value={
              student.enrollmentDate
                ? format(new Date(student.enrollmentDate), "dd MMM yyyy")
                : null
            }
          />
          <InfoRow
            label={d?.admissionDate || "Admission Date"}
            value={
              student.admissionDate
                ? format(new Date(student.admissionDate), "dd MMM yyyy")
                : null
            }
          />
          <InfoRow
            label={d?.graduationDate || "Graduation Date"}
            value={
              student.graduationDate
                ? format(new Date(student.graduationDate), "dd MMM yyyy")
                : null
            }
          />
          <InfoRow label={d?.status || "Status"} value={student.status} />
        </CardContent>
      </Card>

      {/* Previous Education */}
      {(student.previousSchoolName || student.transferCertificateNo) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {d?.previousEducation || "Previous Education"}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <InfoRow
              label={d?.previousSchool || "Previous School"}
              value={student.previousSchoolName}
            />
            <InfoRow
              label={d?.previousSchoolAddress || "Previous School Address"}
              value={student.previousSchoolAddress}
            />
            <InfoRow
              label={d?.previousGrade || "Previous Grade"}
              value={student.previousGrade}
            />
            <InfoRow
              label={d?.transferCertificateNo || "Transfer Certificate No"}
              value={student.transferCertificateNo}
            />
            <InfoRow
              label={d?.transferDate || "Transfer Date"}
              value={
                student.transferDate
                  ? format(new Date(student.transferDate), "dd MMM yyyy")
                  : null
              }
            />
            <InfoRow
              label={d?.academicRecord || "Academic Record"}
              value={student.previousAcademicRecord}
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}

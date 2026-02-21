"use server"

import { revalidatePath } from "next/cache"

import { db } from "@/lib/db"

import type {
  AdminDetailsData,
  ApplicationAutoFillData,
  CheckApplicationResult,
  ContactStepData,
  DocumentsStepData,
  PersonalStepData,
  StaffDetailsData,
  StudentDetailsData,
  SubmitOnboardingResult,
  TeacherDetailsData,
} from "./types"

// =============================================================================
// AUTO-FILL: Check for existing admission application
// =============================================================================

export async function checkExistingApplication(
  schoolId: string,
  email: string
): Promise<CheckApplicationResult> {
  try {
    if (!schoolId || !email) {
      return { success: false, found: false, error: "Missing required fields" }
    }

    const application = await db.application.findFirst({
      where: {
        schoolId,
        email,
        status: "ADMITTED",
      },
      select: {
        firstName: true,
        middleName: true,
        lastName: true,
        dateOfBirth: true,
        gender: true,
        nationality: true,
        photoUrl: true,
        email: true,
        phone: true,
        address: true,
        city: true,
        state: true,
        country: true,
        applyingForClass: true,
        previousSchool: true,
        previousClass: true,
        documents: true,
      },
    })

    if (!application) {
      return { success: true, found: false }
    }

    const autoFillData: ApplicationAutoFillData = {
      firstName: application.firstName,
      middleName: application.middleName || undefined,
      lastName: application.lastName,
      dateOfBirth: application.dateOfBirth.toISOString().split("T")[0],
      gender: application.gender,
      nationality: application.nationality,
      photoUrl: application.photoUrl || undefined,
      email: application.email,
      phone: application.phone,
      address: application.address,
      city: application.city,
      state: application.state,
      country: application.country,
      applyingForClass: application.applyingForClass,
      previousSchool: application.previousSchool || undefined,
      previousClass: application.previousClass || undefined,
      documents: Array.isArray(application.documents)
        ? (application.documents as unknown as ApplicationAutoFillData["documents"])
        : undefined,
    }

    return { success: true, found: true, data: autoFillData }
  } catch (error) {
    console.error("[InternalOnboarding] Failed to check application:", error)
    return {
      success: false,
      found: false,
      error: "Failed to check existing application",
    }
  }
}

// =============================================================================
// SUBMIT: Create User + role-specific records
// =============================================================================

interface SubmitData {
  role: "teacher" | "staff" | "admin" | "student"
  personal: PersonalStepData
  contact: ContactStepData
  roleDetails:
    | TeacherDetailsData
    | StaffDetailsData
    | AdminDetailsData
    | StudentDetailsData
  documents?: DocumentsStepData
}

export async function submitInternalOnboarding(
  schoolId: string,
  data: SubmitData
): Promise<SubmitOnboardingResult> {
  try {
    if (!schoolId) {
      return { success: false, error: "Missing schoolId" }
    }

    // Verify the school exists
    const school = await db.school.findUnique({
      where: { id: schoolId },
      select: { id: true },
    })

    if (!school) {
      return { success: false, error: "School not found" }
    }

    // Check if email already registered in this school
    const existingUser = await db.user.findFirst({
      where: { email: data.contact.email, schoolId },
    })

    if (existingUser) {
      return {
        success: false,
        error: "This email is already registered at this school",
      }
    }

    const result = await db.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email: data.contact.email,
          username: `${data.personal.givenName} ${data.personal.surname}`,
          role: mapRole(data.role),
          emailVerified: new Date(),
          schoolId,
        },
      })

      // Create role-specific records
      switch (data.role) {
        case "teacher": {
          const details = data.roleDetails as TeacherDetailsData
          const teacher = await tx.teacher.create({
            data: {
              userId: user.id,
              givenName: data.personal.givenName,
              surname: data.personal.surname,
              gender: data.personal.gender,
              emailAddress: data.contact.email,
              birthDate: data.personal.dateOfBirth
                ? new Date(data.personal.dateOfBirth)
                : undefined,
              employmentType: details.employmentType || "FULL_TIME",
              profilePhotoUrl: data.personal.profilePhotoUrl,
              schoolId,
            },
          })

          // Phone number
          if (data.contact.phone) {
            await tx.teacherPhoneNumber.create({
              data: {
                teacherId: teacher.id,
                phoneNumber: data.contact.phone,
                phoneType: "mobile",
                isPrimary: true,
                schoolId,
              },
            })
          }

          // Qualification
          if (details.qualificationName) {
            await tx.teacherQualification.create({
              data: {
                teacherId: teacher.id,
                qualificationType: "DEGREE",
                name: details.qualificationName,
                institution: details.qualificationInstitution || undefined,
                dateObtained: details.qualificationYear
                  ? new Date(`${details.qualificationYear}-01-01`)
                  : new Date(),
                schoolId,
              },
            })
          }
          break
        }

        case "staff":
        case "admin": {
          const details = data.roleDetails as
            | StaffDetailsData
            | AdminDetailsData
          const staffMember = await tx.staffMember.create({
            data: {
              userId: user.id,
              givenName: data.personal.givenName,
              surname: data.personal.surname,
              gender: data.personal.gender,
              emailAddress: data.contact.email,
              birthDate: data.personal.dateOfBirth
                ? new Date(data.personal.dateOfBirth)
                : undefined,
              employmentType:
                "employmentType" in details
                  ? details.employmentType
                  : "FULL_TIME",
              position: details.position,
              departmentId: details.departmentId || undefined,
              profilePhotoUrl: data.personal.profilePhotoUrl,
              phoneNumber: data.contact.phone || undefined,
              address: data.contact.address || undefined,
              city: data.contact.city || undefined,
              state: data.contact.state || undefined,
              country: data.contact.country || undefined,
              emergencyContactName:
                data.contact.emergencyContactName || undefined,
              emergencyContactPhone:
                data.contact.emergencyContactPhone || undefined,
              emergencyContactRelation:
                data.contact.emergencyContactRelation || undefined,
              schoolId,
            },
          })

          // Phone number
          if (data.contact.phone) {
            await tx.staffPhoneNumber.create({
              data: {
                staffMemberId: staffMember.id,
                phoneNumber: data.contact.phone,
                phoneType: "mobile",
                isPrimary: true,
                schoolId,
              },
            })
          }

          // Qualification (staff only)
          if ("qualificationName" in details && details.qualificationName) {
            await tx.staffQualification.create({
              data: {
                staffMemberId: staffMember.id,
                qualificationType: "DEGREE",
                name: details.qualificationName,
                institution:
                  "qualificationInstitution" in details
                    ? details.qualificationInstitution || undefined
                    : undefined,
                dateObtained:
                  "qualificationYear" in details && details.qualificationYear
                    ? new Date(`${details.qualificationYear}-01-01`)
                    : new Date(),
                schoolId,
              },
            })
          }
          break
        }

        case "student": {
          const details = data.roleDetails as StudentDetailsData
          await tx.student.create({
            data: {
              userId: user.id,
              givenName: data.personal.givenName,
              middleName: data.personal.middleName || undefined,
              surname: data.personal.surname,
              dateOfBirth: data.personal.dateOfBirth
                ? new Date(data.personal.dateOfBirth)
                : new Date("2010-01-01"),
              gender: data.personal.gender || "Not Specified",
              nationality: data.personal.nationality || undefined,
              profilePhotoUrl: data.personal.profilePhotoUrl,
              email: data.contact.email,
              mobileNumber: data.contact.phone || undefined,
              currentAddress: data.contact.address || undefined,
              city: data.contact.city || undefined,
              state: data.contact.state || undefined,
              country: data.contact.country || undefined,
              emergencyContactName:
                data.contact.emergencyContactName || undefined,
              emergencyContactPhone:
                data.contact.emergencyContactPhone || undefined,
              emergencyContactRelation:
                data.contact.emergencyContactRelation || undefined,
              previousSchoolName: details.previousSchool || undefined,
              previousGrade: details.previousGrade || undefined,
              studentType:
                (details.studentType as
                  | "REGULAR"
                  | "TRANSFER"
                  | "INTERNATIONAL") || "REGULAR",
              schoolId,
            },
          })
          break
        }
      }

      return user
    })

    revalidatePath(`/admin/applications`)

    return {
      success: true,
      data: {
        userId: result.id,
        status: "pending_approval",
      },
    }
  } catch (error) {
    console.error("[InternalOnboarding] Failed to submit:", error)
    return {
      success: false,
      error: "Failed to submit onboarding. Please try again.",
    }
  }
}

// =============================================================================
// HELPERS
// =============================================================================

function mapRole(role: string): "TEACHER" | "STUDENT" | "ADMIN" | "STAFF" {
  switch (role) {
    case "teacher":
      return "TEACHER"
    case "student":
      return "STUDENT"
    case "admin":
      return "ADMIN"
    case "staff":
      return "STAFF"
    default:
      return "STAFF"
  }
}

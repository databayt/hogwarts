"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

import { db } from "@/lib/db"
import { dispatchNotification } from "@/lib/dispatch-notification"
import { sendEmail } from "@/lib/email"
import { normalizePhoneNumber, sendSMS } from "@/lib/notifications/sms"
import { getTenantContext } from "@/lib/tenant-context"

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
      dateOfBirth: application.dateOfBirth?.toISOString().split("T")[0] ?? "",
      gender: application.gender ?? undefined,
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

    // ---------------------------------------------------------------------
    // SECURITY GATE
    //
    // A `"use server"` function is a public POST endpoint — reachable by
    // anyone who can hit the app, whether or not the page that calls it is
    // reachable. This action had no `auth()` call at all, took `schoolId` as a
    // caller-supplied argument, and passed `data.role` straight through
    // `mapRole()` — which maps "admin" to the ADMIN role — while stamping the
    // new User `emailVerified`. So a caller could mint themselves an ADMIN
    // account at ANY school by naming its id. Three things close that:
    //
    //   1. a session is required;
    //   2. the school comes from the request's tenant context, not the
    //      argument (the argument now only has to agree with it);
    //   3. a privileged role can never be SELF-assigned — "admin"/"staff" are
    //      only honoured for a caller who already holds that authority here.
    //
    // Note this remains a self-registration flow: it still creates a live
    // account rather than something an admin approves, despite the
    // confirmation email saying "pending approval". Reconciling those two is
    // tracked separately (see the block records) — this gate stops the
    // escalation without redesigning the flow.
    // ---------------------------------------------------------------------
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "NOT_AUTHENTICATED" }
    }

    const tenant = await getTenantContext()
    if (!tenant.schoolId || tenant.schoolId !== schoolId) {
      return { success: false, error: "UNAUTHORIZED" }
    }

    // DEVELOPER is cross-school by design; ADMIN/STAFF authority is confined
    // to their OWN school, so an admin of school A browsing school B's
    // subdomain cannot mint privileged accounts there.
    const callerRole = session.user.role
    const callerAdministers =
      callerRole === "DEVELOPER" ||
      ((callerRole === "ADMIN" || callerRole === "STAFF") &&
        session.user.schoolId === schoolId)

    if (
      (data.role === "admin" || data.role === "staff") &&
      !callerAdministers
    ) {
      return { success: false, error: "UNAUTHORIZED" }
    }

    // Verify the school exists and get plan limits
    const school = await db.school.findUnique({
      where: { id: schoolId },
      select: { id: true, name: true, maxStudents: true, maxTeachers: true },
    })

    if (!school) {
      return { success: false, error: "School not found" }
    }

    // Check plan capacity limits
    if (data.role === "student" && school.maxStudents) {
      const studentCount = await db.student.count({ where: { schoolId } })
      if (studentCount >= school.maxStudents) {
        return {
          success: false,
          error:
            "This school has reached its student capacity limit. Please contact the school administration.",
        }
      }
    }

    if (data.role === "teacher" && school.maxTeachers) {
      const teacherCount = await db.teacher.count({ where: { schoolId } })
      if (teacherCount >= school.maxTeachers) {
        return {
          success: false,
          error:
            "This school has reached its teacher capacity limit. Please contact the school administration.",
        }
      }
    }

    // Email uniqueness check + record creation inside a single transaction
    const result = await db.$transaction(async (tx) => {
      // Check if email already registered in this school (inside tx for atomicity)
      const existingUser = await tx.user.findFirst({
        where: { email: data.contact.email, schoolId },
      })

      if (existingUser) {
        throw new Error("This email is already registered at this school")
      }

      // Create user
      const user = await tx.user.create({
        data: {
          email: data.contact.email,
          username: `${data.personal.firstName} ${data.personal.lastName}`,
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
              firstName: data.personal.firstName,
              lastName: data.personal.lastName,
              gender: data.personal.gender,
              emailAddress: data.contact.email,
              birthDate: data.personal.dateOfBirth
                ? new Date(data.personal.dateOfBirth)
                : undefined,
              employmentType: details.employmentType || "FULL_TIME",
              profilePhotoUrl: data.personal.profilePhotoUrl,
              wizardStep: "employment",
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

          // Subject expertise
          if (details.subjects?.length) {
            await tx.teacherSubjectExpertise.createMany({
              data: details.subjects.map((subjectId: string) => ({
                schoolId,
                teacherId: teacher.id,
                subjectId,
                expertiseLevel: "PRIMARY",
              })),
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
              firstName: data.personal.firstName,
              lastName: data.personal.lastName,
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
              firstName: data.personal.firstName,
              middleName: data.personal.middleName || undefined,
              lastName: data.personal.lastName,
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
              wizardStep: "location",
              schoolId,
            },
          })
          break
        }
      }

      return user
    })

    revalidatePath(`/admin/applications`)

    // Send confirmation email (non-blocking)
    try {
      await sendEmail({
        to: data.contact.email,
        subject: `Welcome to ${school.name} - Application Received`,
        template: "onboarding-confirmation",
        data: {
          message: `Thank you for registering as a <strong>${data.role}</strong> at <strong>${school.name}</strong>. Your application is currently <strong>pending approval</strong> by the school administration. You will be notified once your account has been reviewed.`,
        },
      })
    } catch {
      console.error("[InternalOnboarding] Failed to send confirmation email")
    }

    // Send SMS confirmation (non-blocking)
    if (data.contact.phone) {
      try {
        const normalized = normalizePhoneNumber(data.contact.phone, "+249")
        if (normalized) {
          await sendSMS({
            to: normalized,
            message: `${school.name}: Your application as ${data.role} has been received. Reference: ${result.id.slice(-8).toUpperCase()}. Status: Pending approval.`,
          })
        }
      } catch {
        console.error("[InternalOnboarding] Failed to send SMS")
      }
    }

    // Notify school admins (non-blocking)
    try {
      const admins = await db.user.findMany({
        where: { schoolId, role: "ADMIN" },
        select: { id: true },
      })
      if (admins.length > 0) {
        await Promise.all(
          admins.map((admin) =>
            dispatchNotification({
              schoolId,
              userId: admin.id,
              type: "account_created",
              priority: "high",
              title: `New ${data.role} application`,
              body: `${data.personal.firstName} ${data.personal.lastName} has applied to join as ${data.role}. Review pending.`,
            })
          )
        )
      }
    } catch {
      console.error("[InternalOnboarding] Failed to notify admins")
    }

    return {
      success: true,
      data: {
        userId: result.id,
        status: "pending_approval",
      },
    }
  } catch (error) {
    console.error("[InternalOnboarding] Failed to submit:", error)

    // Surface the specific duplicate email error
    if (
      error instanceof Error &&
      error.message.includes("already registered")
    ) {
      return { success: false, error: error.message }
    }

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

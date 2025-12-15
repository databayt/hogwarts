import { UserRole } from "@prisma/client"

import type {
  FilteredProfileData,
  PermissionLevel,
  ProfileContext,
  ProfileData,
} from "./types"

/**
 * Determine permission level for the viewer
 */
export function getPermissionLevel(context: ProfileContext): PermissionLevel {
  const {
    viewerId,
    viewerRole,
    viewerSchoolId,
    profileUserId,
    profileSchoolId,
  } = context

  // Not authenticated - public only
  if (!viewerId || !viewerRole) {
    return "PUBLIC"
  }

  // Viewing own profile
  if (viewerId === profileUserId) {
    return "OWNER"
  }

  // Platform admin or school admin
  if (viewerRole === "DEVELOPER" || viewerRole === "ADMIN") {
    return "ADMIN"
  }

  // Staff members
  if (
    viewerRole === "TEACHER" ||
    viewerRole === "STAFF" ||
    viewerRole === "ACCOUNTANT"
  ) {
    return "STAFF"
  }

  // Same school (for students/guardians viewing others in same school)
  if (viewerSchoolId && viewerSchoolId === profileSchoolId) {
    return "RELATED"
  }

  // Default to public
  return "PUBLIC"
}

/**
 * Filter profile data based on permission level
 */
export function filterProfileData(
  profile: ProfileData,
  permissionLevel: PermissionLevel
): FilteredProfileData {
  const { id, role, profileType, email, emailVerified, schoolId } = profile

  // Base data always visible
  const baseData: FilteredProfileData = {
    id,
    role,
    profileType,
    canViewFullProfile: false,
    permissionLevel,
  }

  // OWNER - can see everything
  if (permissionLevel === "OWNER") {
    return {
      ...profile,
      canViewFullProfile: true,
      permissionLevel,
    }
  }

  // ADMIN - can see almost everything
  if (permissionLevel === "ADMIN") {
    return {
      ...profile,
      canViewFullProfile: true,
      permissionLevel,
    }
  }

  // STAFF - can see most info for their school
  if (permissionLevel === "STAFF") {
    return {
      ...baseData,
      username: profile.username,
      email: profile.email,
      image: profile.image,
      schoolId: profile.schoolId,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
      student: profile.student
        ? (filterStudentData(profile.student, permissionLevel) as any)
        : undefined,
      teacher: profile.teacher
        ? (filterTeacherData(profile.teacher, permissionLevel) as any)
        : undefined,
      guardian: profile.guardian
        ? (filterGuardianData(profile.guardian, permissionLevel) as any)
        : undefined,
      canViewFullProfile: false,
    }
  }

  // RELATED - limited info (same school students/guardians)
  if (permissionLevel === "RELATED") {
    return {
      ...baseData,
      username: profile.username,
      image: profile.image,
      student: profile.student
        ? (filterStudentData(profile.student, permissionLevel) as any)
        : undefined,
      teacher: profile.teacher
        ? (filterTeacherData(profile.teacher, permissionLevel) as any)
        : undefined,
      canViewFullProfile: false,
    }
  }

  // PUBLIC - minimal info
  return {
    ...baseData,
    username: profile.username,
    image: profile.image,
    canViewFullProfile: false,
  }
}

/**
 * Filter student data based on permission level
 */
function filterStudentData(
  student: NonNullable<ProfileData["student"]>,
  permissionLevel: PermissionLevel
): Partial<NonNullable<ProfileData["student"]>> {
  const baseData = {
    id: student.id,
    givenName: student.givenName,
    middleName: student.middleName,
    surname: student.surname,
    profilePhotoUrl: student.profilePhotoUrl,
  }

  if (permissionLevel === "ADMIN" || permissionLevel === "OWNER") {
    return student // Full access
  }

  if (permissionLevel === "STAFF") {
    return {
      ...baseData,
      schoolId: student.schoolId,
      grNumber: student.grNumber,
      studentId: student.studentId,
      dateOfBirth: student.dateOfBirth,
      gender: student.gender,
      email: student.email,
      mobileNumber: student.mobileNumber,
      status: student.status,
      enrollmentDate: student.enrollmentDate,
      admissionNumber: student.admissionNumber,
      medicalConditions: student.medicalConditions,
      allergies: student.allergies,
      studentYearLevels: student.studentYearLevels,
      studentClasses: student.studentClasses,
      studentGuardians: student.studentGuardians,
    }
  }

  if (permissionLevel === "RELATED") {
    return {
      ...baseData,
      studentId: student.studentId,
      enrollmentDate: student.enrollmentDate,
      studentYearLevels: student.studentYearLevels,
    }
  }

  return baseData // PUBLIC
}

/**
 * Filter teacher data based on permission level
 */
function filterTeacherData(
  teacher: NonNullable<ProfileData["teacher"]>,
  permissionLevel: PermissionLevel
): Partial<NonNullable<ProfileData["teacher"]>> {
  const baseData = {
    id: teacher.id,
    givenName: teacher.givenName,
    surname: teacher.surname,
    profilePhotoUrl: teacher.profilePhotoUrl,
  }

  if (permissionLevel === "ADMIN" || permissionLevel === "OWNER") {
    return teacher // Full access
  }

  if (permissionLevel === "STAFF") {
    return {
      ...baseData,
      schoolId: teacher.schoolId,
      employeeId: teacher.employeeId,
      emailAddress: teacher.emailAddress,
      gender: teacher.gender,
      joiningDate: teacher.joiningDate,
      employmentStatus: teacher.employmentStatus,
      employmentType: teacher.employmentType,
      teacherDepartments: teacher.teacherDepartments,
      classes: teacher.classes,
      phoneNumbers: teacher.phoneNumbers,
      qualifications: teacher.qualifications,
    }
  }

  if (permissionLevel === "RELATED") {
    return {
      ...baseData,
      emailAddress: teacher.emailAddress,
      teacherDepartments: teacher.teacherDepartments,
      classes: teacher.classes?.map((c) => ({
        id: c.id,
        className: c.className,
        subject: c.subject,
      })),
    }
  }

  return baseData // PUBLIC
}

/**
 * Filter guardian data based on permission level
 */
function filterGuardianData(
  guardian: NonNullable<ProfileData["guardian"]>,
  permissionLevel: PermissionLevel
): Partial<NonNullable<ProfileData["guardian"]>> {
  const baseData = {
    id: guardian.id,
    givenName: guardian.givenName,
    surname: guardian.surname,
  }

  if (permissionLevel === "ADMIN" || permissionLevel === "OWNER") {
    return guardian // Full access
  }

  if (permissionLevel === "STAFF") {
    return {
      ...baseData,
      schoolId: guardian.schoolId,
      emailAddress: guardian.emailAddress,
      phoneNumbers: guardian.phoneNumbers,
      studentGuardians: guardian.studentGuardians,
      teacherId: guardian.teacherId,
      teacher: guardian.teacher,
    }
  }

  if (permissionLevel === "RELATED") {
    return {
      ...baseData,
      emailAddress: guardian.emailAddress,
    }
  }

  return baseData // PUBLIC
}

/**
 * Check if viewer can access a specific field
 */
export function canViewField(
  fieldName: string,
  permissionLevel: PermissionLevel
): boolean {
  const publicFields = ["id", "username", "image", "givenName", "surname"]
  const relatedFields = [
    ...publicFields,
    "email",
    "studentId",
    "employeeId",
    "classes",
  ]
  const staffFields = [
    ...relatedFields,
    "dateOfBirth",
    "mobileNumber",
    "address",
    "guardians",
    "medicalConditions",
  ]

  if (permissionLevel === "OWNER" || permissionLevel === "ADMIN") {
    return true // Can view all fields
  }

  if (permissionLevel === "STAFF") {
    return staffFields.includes(fieldName)
  }

  if (permissionLevel === "RELATED") {
    return relatedFields.includes(fieldName)
  }

  return publicFields.includes(fieldName) // PUBLIC
}

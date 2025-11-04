import { UserRole } from "@prisma/client"

// Profile type detection
export type ProfileType = "STUDENT" | "TEACHER" | "GUARDIAN" | "STAFF" | "USER"

// Permission levels for viewing profiles
export type PermissionLevel = "OWNER" | "ADMIN" | "STAFF" | "RELATED" | "PUBLIC"

// Extended user type with all related profile data
export type ProfileData = {
  id: string
  username: string | null
  email: string | null
  emailVerified: Date | null
  image: string | null
  role: UserRole
  schoolId: string | null
  createdAt: Date
  updatedAt: Date

  // Related profile data
  student?: StudentProfile | null
  teacher?: TeacherProfile | null
  guardian?: GuardianProfile | null

  // Detected profile type
  profileType: ProfileType
}

// Student profile with essential relationships
export type StudentProfile = {
  id: string
  schoolId: string
  userId: string | null
  grNumber: string | null
  studentId: string | null

  // Name
  givenName: string
  middleName: string | null
  surname: string

  // Personal info
  dateOfBirth: Date
  gender: string
  bloodGroup: string | null
  nationality: string | null

  // Contact
  email: string | null
  mobileNumber: string | null

  // Status
  status: string
  enrollmentDate: Date
  admissionNumber: string | null

  // Photo
  profilePhotoUrl: string | null

  // Health
  medicalConditions: string | null
  allergies: string | null

  // Relations
  studentYearLevels?: Array<{
    id: string
    yearLevel: {
      id: string
      levelName: string
    }
    schoolYear: {
      id: string
      yearName: string
    }
    score: number | null
  }>

  studentClasses?: Array<{
    id: string
    class: {
      id: string
      className: string
      subject: {
        id: string
        subjectName: string
      }
    }
  }>

  studentGuardians?: Array<{
    id: string
    isPrimary: boolean
    guardian: {
      id: string
      givenName: string
      surname: string
      emailAddress: string | null
    }
    guardianType: {
      id: string
      name: string
    }
  }>
}

// Teacher profile with essential relationships
export type TeacherProfile = {
  id: string
  schoolId: string
  userId: string | null
  employeeId: string | null

  // Name
  givenName: string
  surname: string
  gender: string | null
  emailAddress: string

  // Employment
  birthDate: Date | null
  joiningDate: Date | null
  employmentStatus: string
  employmentType: string

  // Photo
  profilePhotoUrl: string | null

  // Relations
  teacherDepartments?: Array<{
    id: string
    isPrimary: boolean
    department: {
      id: string
      departmentName: string
    }
  }>

  classes?: Array<{
    id: string
    className: string
    subject: {
      id: string
      subjectName: string
    }
  }>

  phoneNumbers?: Array<{
    id: string
    phoneNumber: string
    phoneType: string
    isPrimary: boolean
  }>

  qualifications?: Array<{
    id: string
    qualificationType: string
    name: string
    institution: string | null
    dateObtained: Date
  }>
}

// Guardian profile with essential relationships
export type GuardianProfile = {
  id: string
  schoolId: string
  userId: string | null

  // Name
  givenName: string
  surname: string
  emailAddress: string | null

  // Relations
  phoneNumbers?: Array<{
    id: string
    phoneNumber: string
    phoneType: string
    isPrimary: boolean
  }>

  studentGuardians?: Array<{
    id: string
    isPrimary: boolean
    student: {
      id: string
      givenName: string
      middleName: string | null
      surname: string
      profilePhotoUrl: string | null
      userId: string | null
    }
    guardianType: {
      id: string
      name: string
    }
  }>

  // If guardian is also a teacher
  teacherId: string | null
  teacher?: {
    id: string
    givenName: string
    surname: string
    emailAddress: string
    employeeId: string | null
  } | null
}

// Filtered profile data based on permissions
export type FilteredProfileData = Partial<ProfileData> & {
  id: string
  role: UserRole
  profileType: ProfileType
  canViewFullProfile: boolean
  permissionLevel: PermissionLevel
}

// Profile context for permission checks
export type ProfileContext = {
  viewerId: string | null
  viewerRole: UserRole | null
  viewerSchoolId: string | null
  profileUserId: string
  profileSchoolId: string | null
  profileType: ProfileType
}

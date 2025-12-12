import { type Dictionary } from "@/components/internationalization/dictionaries";

// Database model types
export interface Student {
  id: string;
  schoolId: string;
  grNumber?: string;
  studentId?: string;

  // Personal Information
  givenName: string;
  middleName?: string;
  surname: string;
  dateOfBirth: Date;
  gender: string;
  bloodGroup?: string;
  nationality?: string;
  passportNumber?: string;
  visaStatus?: string;
  visaExpiryDate?: Date;

  // Contact Information
  email?: string;
  mobileNumber?: string;
  alternatePhone?: string;
  currentAddress?: string;
  permanentAddress?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;

  // Emergency Contact
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;

  // Status and Enrollment
  status: StudentStatus;
  enrollmentDate: Date;
  admissionNumber?: string;
  admissionDate?: Date;
  graduationDate?: Date;

  // Academic
  category?: string;
  studentType: StudentType;

  // Photo and Documents
  profilePhotoUrl?: string;
  idCardNumber?: string;
  idCardIssuedDate?: Date;
  idCardBarcode?: string;

  // Health Information
  medicalConditions?: string;
  allergies?: string;
  medicationRequired?: string;
  doctorName?: string;
  doctorContact?: string;
  insuranceProvider?: string;
  insuranceNumber?: string;

  // Previous Education
  previousSchoolName?: string;
  previousSchoolAddress?: string;
  previousGrade?: string;
  transferCertificateNo?: string;
  transferDate?: Date;
  previousAcademicRecord?: string;

  // Relations
  userId?: string;
  user?: any;
  studentClasses?: StudentClass[];
  studentYearLevels?: StudentYearLevel[];
  studentGuardians?: StudentGuardian[];
  batches?: StudentBatch[];
  documents?: StudentDocument[];
  healthRecords?: HealthRecord[];
  achievements?: Achievement[];
  disciplinaryRecords?: DisciplinaryRecord[];
  feeRecords?: FeeRecord[];
  attendances?: Attendance[];
  examResults?: ExamResult[];
  submissions?: Submission[];

  createdAt: Date;
  updatedAt: Date;
}

export type StudentStatus =
  | "ACTIVE"
  | "INACTIVE"
  | "SUSPENDED"
  | "GRADUATED"
  | "TRANSFERRED"
  | "DROPPED_OUT";

export type StudentType =
  | "REGULAR"
  | "TRANSFER"
  | "INTERNATIONAL"
  | "EXCHANGE";

// Batch Management
export interface StudentBatch {
  id: string;
  schoolId: string;
  studentId: string;
  batchId: string;
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
  notes?: string;
  student?: Student;
  batch?: Batch;
}

export interface Batch {
  id: string;
  schoolId: string;
  name: string;
  code: string;
  yearLevelId: string;
  maxCapacity: number;
  isActive: boolean;
  yearLevel?: any;
  students?: StudentBatch[];
  currentStrength?: number; // Calculated field
}

// Document Management
export interface StudentDocument {
  id: string;
  schoolId: string;
  studentId: string;
  documentType: DocumentType;
  documentName: string;
  description?: string;
  fileUrl: string;
  fileSize?: number;
  mimeType?: string;
  uploadedAt: Date;
  uploadedBy?: string;
  verifiedAt?: Date;
  verifiedBy?: string;
  isVerified: boolean;
  expiryDate?: Date;
  tags?: string[];
}

export type DocumentType =
  | "BIRTH_CERTIFICATE"
  | "TRANSFER_CERTIFICATE"
  | "MEDICAL_REPORT"
  | "PASSPORT_COPY"
  | "VISA_COPY"
  | "ID_CARD"
  | "ACADEMIC_TRANSCRIPT"
  | "CHARACTER_CERTIFICATE"
  | "LEAVING_CERTIFICATE"
  | "OTHER";

// Health Records
export interface HealthRecord {
  id: string;
  schoolId: string;
  studentId: string;
  recordDate: Date;
  recordType: HealthRecordType;
  title: string;
  description: string;
  severity?: HealthSeverity;
  doctorName?: string;
  hospitalName?: string;
  prescription?: string;
  followUpDate?: Date;
  attachmentUrl?: string;
  attachmentName?: string;
  recordedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export type HealthRecordType =
  | "VACCINATION"
  | "MEDICAL_CHECKUP"
  | "INCIDENT"
  | "ILLNESS"
  | "ALLERGY_UPDATE"
  | "SURGERY"
  | "HOSPITALIZATION";

export type HealthSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

// Achievements
export interface Achievement {
  id: string;
  schoolId: string;
  studentId: string;
  title: string;
  description?: string;
  achievementDate: Date;
  category: AchievementCategory;
  level?: AchievementLevel;
  position?: string;
  certificateUrl?: string;
  certificateNo?: string;
  issuedBy?: string;
  points?: number;
}

export type AchievementCategory =
  | "ACADEMIC"
  | "SPORTS"
  | "ARTS"
  | "CULTURAL"
  | "LEADERSHIP"
  | "COMMUNITY_SERVICE"
  | "OTHER";

export type AchievementLevel =
  | "SCHOOL"
  | "DISTRICT"
  | "STATE"
  | "NATIONAL"
  | "INTERNATIONAL";

// Disciplinary Records
export interface DisciplinaryRecord {
  id: string;
  schoolId: string;
  studentId: string;
  incidentDate: Date;
  incidentType: string;
  severity: DisciplinarySeverity;
  description: string;
  action: string;
  reportedBy: string;
  witnessNames?: string;
  parentNotified: boolean;
  notifiedDate?: Date;
  followUpDate?: Date;
  resolution?: string;
  attachmentUrl?: string;
}

export type DisciplinarySeverity = "MINOR" | "MAJOR" | "SEVERE";

// Library Records
export interface LibraryRecord {
  id: string;
  schoolId: string;
  studentId: string;
  bookId: string;
  issueDate: Date;
  dueDate: Date;
  returnDate?: Date;
  fineAmount?: number;
  finePaid: boolean;
  renewalCount: number;
  bookCondition?: string;
}

// Fee Records
export interface FeeRecord {
  id: string;
  schoolId: string;
  studentId: string;
  academicYearId: string;
  feeType: string;
  amount: number;
  dueDate: Date;
  paidAmount?: number;
  paymentDate?: Date;
  paymentMethod?: string;
  transactionId?: string;
  status: FeeStatus;
  lateFee?: number;
  discount?: number;
  discountReason?: string;
  receiptNumber?: string;
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type FeeStatus =
  | "PENDING"
  | "PARTIAL"
  | "PAID"
  | "OVERDUE"
  | "WAIVED";

// Guardian Types (from existing model)
export interface StudentGuardian {
  id: string;
  schoolId: string;
  studentId: string;
  guardianId: string;
  guardianTypeId: string;
  isPrimary: boolean;
  guardian?: Guardian;
  guardianType?: GuardianType;
}

export interface Guardian {
  id: string;
  schoolId: string;
  givenName: string;
  surname: string;
  emailAddress?: string;
  phoneNumbers?: GuardianPhoneNumber[];
  teacherId?: string;
  userId?: string;
}

export interface GuardianType {
  id: string;
  schoolId: string;
  name: string; // mother, father, guardian, etc.
}

export interface GuardianPhoneNumber {
  id: string;
  phoneNumber: string;
  phoneType: string; // mobile, home, work, emergency
  isPrimary: boolean;
}

// Class and Year Level
export interface StudentClass {
  id: string;
  schoolId: string;
  studentId: string;
  classId: string;
  dateJoined: Date;
  isActive: boolean;
  class?: any; // Class model
}

export interface StudentYearLevel {
  id: string;
  schoolId: string;
  studentId: string;
  levelId: string;
  yearId: string;
  score?: number;
  yearLevel?: any; // YearLevel model
  schoolYear?: any; // SchoolYear model
}

// Form Component Props
export interface StudentFormProps {
  student?: Student;
  isEdit?: boolean;
  dictionary?: Dictionary["school"]["students"];
  onSuccess?: (student: Student) => void;
  onCancel?: () => void;
}

export interface StudentTableProps {
  students: Student[];
  dictionary?: Dictionary["school"]["students"];
  onEdit?: (student: Student) => void;
  onDelete?: (student: Student) => void;
  onView?: (student: Student) => void;
}

export interface StudentProfileProps {
  student: Student;
  dictionary?: Dictionary["school"]["students"];
  onEdit?: () => void;
}

// Search and Filter Types
export interface StudentSearchParams {
  query?: string;
  status?: StudentStatus[];
  type?: StudentType[];
  yearLevel?: string[];
  class?: string[];
  batch?: string[];
  gender?: string[];
  category?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  hasDocuments?: boolean;
  hasFeesPending?: boolean;
}

export interface StudentStatistics {
  totalStudents: number;
  activeStudents: number;
  newAdmissions: number;
  graduatedStudents: number;
  transferredStudents: number;
  averageAttendance: number;
  genderDistribution: {
    male: number;
    female: number;
    other: number;
  };
  typeDistribution: Record<StudentType, number>;
  yearLevelDistribution: Record<string, number>;
}

// Attendance
export interface Attendance {
  id: string;
  schoolId: string;
  studentId: string;
  date: Date;
  status: AttendanceStatus;
  checkInTime?: Date;
  checkOutTime?: Date;
  notes?: string;
  recordedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type AttendanceStatus =
  | "PRESENT"
  | "ABSENT"
  | "LATE"
  | "EXCUSED"
  | "HALF_DAY";

// Exam Results
export interface ExamResult {
  id: string;
  schoolId: string;
  studentId: string;
  examId: string;
  subjectId: string;
  score: number;
  maxScore: number;
  grade?: string;
  remarks?: string;
  exam?: Exam;
  subject?: Subject;
  createdAt: Date;
  updatedAt: Date;
}

export interface Exam {
  id: string;
  schoolId: string;
  name: string;
  examType: string;
  startDate: Date;
  endDate: Date;
}

export interface Subject {
  id: string;
  schoolId: string;
  name: string;
  code?: string;
}

// Assignment Submissions
export interface Submission {
  id: string;
  schoolId: string;
  studentId: string;
  assignmentId: string;
  content?: string;
  fileUrl?: string;
  submittedAt: Date;
  grade?: number;
  feedback?: string;
  status: SubmissionStatus;
  assignment?: Assignment;
}

export type SubmissionStatus =
  | "PENDING"
  | "SUBMITTED"
  | "GRADED"
  | "LATE"
  | "RETURNED";

export interface Assignment {
  id: string;
  schoolId: string;
  title: string;
  description?: string;
  dueDate: Date;
  totalPoints: number;
  subjectId?: string;
  subject?: Subject;
}
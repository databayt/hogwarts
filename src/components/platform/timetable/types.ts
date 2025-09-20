export interface TimetableSlot {
  id: string
  schoolId: string
  termId: string
  dayOfWeek: number // 0 = Sun ... 6 = Sat
  periodId: string
  classId: string
  subjectId?: string
  teacherId?: string
  classroomId?: string
  weekOffset: number // 0 current, 1 next
  isSubstitute?: boolean
  substituteTeacherId?: string
  notes?: string
  color?: string
  createdAt: Date
  updatedAt: Date
}

export interface Period {
  id: string
  name: string
  startTime: string
  endTime: string
  order: number
  isBreak?: boolean
  type?: 'regular' | 'lunch' | 'break' | 'assembly'
}

export interface ClassInfo {
  id: string
  name: string
  grade: string
  section: string
  capacity: number
  currentEnrollment: number
}

export interface TeacherInfo {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  department?: string
  subjects: string[]
  photoUrl?: string
  availability?: TeacherAvailability[]
}

export interface TeacherAvailability {
  dayOfWeek: number
  periods: string[] // Period IDs
  isAvailable: boolean
  reason?: string
}

export interface SubjectInfo {
  id: string
  name: string
  code: string
  color: string
  department?: string
  hoursPerWeek: number
  isCore: boolean
}

export interface ClassroomInfo {
  id: string
  name: string
  building?: string
  floor?: string
  capacity: number
  type: 'regular' | 'lab' | 'gym' | 'library' | 'computer' | 'music' | 'art'
  facilities?: string[]
  isAvailable: boolean
}

export interface TimetableConflict {
  id: string
  type: 'teacher' | 'classroom' | 'class'
  slot1: TimetableSlot
  slot2: TimetableSlot
  severity: 'error' | 'warning'
  message: string
  suggestion?: ConflictSuggestion
}

export interface ConflictSuggestion {
  type: 'reschedule' | 'substitute' | 'room_change'
  alternativeSlots?: TimetableSlot[]
  alternativeTeachers?: TeacherInfo[]
  alternativeRooms?: ClassroomInfo[]
}

export interface TimetableView {
  type: 'class' | 'teacher' | 'room' | 'student'
  id: string
  name: string
  slots: TimetableSlot[]
  conflicts: TimetableConflict[]
}

export interface TimetableExportOptions {
  format: 'pdf' | 'excel' | 'csv' | 'image' | 'ical'
  viewType: TimetableView['type']
  weekOffset: number
  includeSubstitutes: boolean
  includeNotes: boolean
  paperSize?: 'A4' | 'Letter'
  orientation?: 'portrait' | 'landscape'
}

export interface TimetableImportData {
  format: 'excel' | 'csv' | 'json'
  file: File
  mapping?: {
    [key: string]: string // Field mapping
  }
  options: {
    overwrite: boolean
    validateConflicts: boolean
    notifyChanges: boolean
  }
}

export interface TimetableNotification {
  id: string
  type: 'change' | 'conflict' | 'substitute' | 'cancellation'
  recipients: string[] // User IDs
  title: string
  message: string
  slot?: TimetableSlot
  sentAt?: Date
  readBy: string[]
}

export interface TimetableAnalytics {
  totalSlots: number
  utilizationRate: number
  teacherWorkload: {
    teacherId: string
    name: string
    hoursPerWeek: number
    subjects: string[]
    classes: string[]
  }[]
  roomUtilization: {
    roomId: string
    name: string
    utilizationPercent: number
    peakHours: string[]
  }[]
  subjectDistribution: {
    subjectId: string
    name: string
    totalHours: number
    classes: string[]
  }[]
  conflicts: TimetableConflict[]
  suggestions: string[]
}

export interface TimetableSettings {
  schoolId: string
  termId: string
  workingDays: number[] // Days of week (0-6)
  periodsPerDay: number
  defaultPeriodDuration: number // Minutes
  lunchAfterPeriod?: number
  breakAfterPeriod?: number[]
  allowConflicts: boolean
  autoResolveConflicts: boolean
  notifyOnChanges: boolean
  colorScheme: 'subject' | 'teacher' | 'room' | 'custom'
  viewPreference: TimetableView['type']
}

export interface DragDropEvent {
  source: {
    slot: TimetableSlot
    position: { day: number; period: number }
  }
  target: {
    position: { day: number; period: number }
    classId?: string
  }
  type: 'move' | 'copy' | 'swap'
}

export interface FilterOptions {
  grades?: string[]
  subjects?: string[]
  teachers?: string[]
  rooms?: string[]
  days?: number[]
  showConflicts?: boolean
  showSubstitutes?: boolean
  showBreaks?: boolean
}

export interface AccessLevel {
  role: 'admin' | 'principal' | 'teacher' | 'student' | 'parent'
  permissions: {
    view: boolean
    edit: boolean
    delete: boolean
    export: boolean
    import: boolean
    manageSubstitutes: boolean
    viewAnalytics: boolean
    receiveNotifications: boolean
  }
}
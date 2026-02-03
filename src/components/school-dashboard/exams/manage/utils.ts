// Exam Management Utilities

import { type ExamDTO } from "./types"

/**
 * Calculate exam duration in minutes from start and end time
 */
export function calculateDuration(startTime: string, endTime: string): number {
  const [startHour, startMinute] = startTime.split(":").map(Number)
  const [endHour, endMinute] = endTime.split(":").map(Number)

  const startMinutes = startHour * 60 + startMinute
  const endMinutes = endHour * 60 + endMinute

  return endMinutes - startMinutes
}

/**
 * Format time to HH:MM format
 */
export function formatTime(time: string): string {
  const [hour, minute] = time.split(":")
  return `${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`
}

/**
 * Calculate end time from start time and duration
 */
export function calculateEndTime(
  startTime: string,
  durationMinutes: number
): string {
  const [hour, minute] = startTime.split(":").map(Number)
  const totalMinutes = hour * 60 + minute + durationMinutes

  const endHour = Math.floor(totalMinutes / 60) % 24
  const endMinute = totalMinutes % 60

  return `${String(endHour).padStart(2, "0")}:${String(endMinute).padStart(2, "0")}`
}

/**
 * Check if exam is in the past
 */
export function isExamPast(examDate: Date): boolean {
  return new Date(examDate) < new Date()
}

/**
 * Check if exam is today
 */
export function isExamToday(examDate: Date): boolean {
  const today = new Date()
  const exam = new Date(examDate)

  return (
    exam.getDate() === today.getDate() &&
    exam.getMonth() === today.getMonth() &&
    exam.getFullYear() === today.getFullYear()
  )
}

/**
 * Check if exam is within next N days
 */
export function isExamUpcoming(examDate: Date, days: number = 7): boolean {
  const exam = new Date(examDate)
  const today = new Date()
  const future = new Date()
  future.setDate(today.getDate() + days)

  return exam >= today && exam <= future
}

/**
 * Format exam date for display
 */
export function formatExamDate(date: Date, locale: string = "en"): string {
  return new Intl.DateTimeFormat(locale, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date))
}

/**
 * Get exam status color
 */
export function getExamStatusColor(status: string): string {
  const colors: Record<string, string> = {
    PLANNED: "blue",
    IN_PROGRESS: "yellow",
    COMPLETED: "green",
    CANCELLED: "red",
  }

  return colors[status] || "gray"
}

/**
 * Calculate pass percentage
 */
export function calculatePassPercentage(
  passingMarks: number,
  totalMarks: number
): number {
  return (passingMarks / totalMarks) * 100
}

/**
 * Validate time range
 */
export function isValidTimeRange(startTime: string, endTime: string): boolean {
  const [startHour, startMinute] = startTime.split(":").map(Number)
  const [endHour, endMinute] = endTime.split(":").map(Number)

  const startMinutes = startHour * 60 + startMinute
  const endMinutes = endHour * 60 + endMinute

  return endMinutes > startMinutes
}

/**
 * Check for scheduling conflicts
 */
export function hasSchedulingConflict(
  newExam: { examDate: Date; startTime: string; endTime: string },
  existingExams: { examDate: Date; startTime: string; endTime: string }[]
): boolean {
  const newDate = new Date(newExam.examDate).toDateString()
  const newStart = newExam.startTime
  const newEnd = newExam.endTime

  return existingExams.some((exam) => {
    const examDate = new Date(exam.examDate).toDateString()

    // Different dates = no conflict
    if (examDate !== newDate) return false

    // Check time overlap
    const examStart = exam.startTime
    const examEnd = exam.endTime

    return (
      (newStart >= examStart && newStart < examEnd) ||
      (newEnd > examStart && newEnd <= examEnd) ||
      (newStart <= examStart && newEnd >= examEnd)
    )
  })
}

/**
 * Generate exam code/ID
 */
export function generateExamCode(
  examType: string,
  classId: string,
  examDate: Date
): string {
  const typeCode = examType.substring(0, 2).toUpperCase()
  const classCode = classId.substring(0, 4).toUpperCase()
  const dateCode = new Date(examDate)
    .toISOString()
    .split("T")[0]
    .replace(/-/g, "")

  return `${typeCode}-${classCode}-${dateCode}`
}

/**
 * Calculate remaining time until exam
 */
export function getRemainingTime(examDate: Date, startTime: string): string {
  const now = new Date()
  const [hour, minute] = startTime.split(":").map(Number)
  const examDateTime = new Date(examDate)
  examDateTime.setHours(hour, minute, 0, 0)

  const diff = examDateTime.getTime() - now.getTime()

  if (diff < 0) return "Past"

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

/**
 * Sort exams by date and time
 */
export function sortExamsByDateTime(
  exams: { examDate: Date; startTime: string }[]
): typeof exams {
  return exams.sort((a, b) => {
    const dateA = new Date(a.examDate).getTime()
    const dateB = new Date(b.examDate).getTime()

    if (dateA !== dateB) return dateA - dateB

    // Same date, compare times
    const [hourA, minuteA] = a.startTime.split(":").map(Number)
    const [hourB, minuteB] = b.startTime.split(":").map(Number)

    const timeA = hourA * 60 + minuteA
    const timeB = hourB * 60 + minuteB

    return timeA - timeB
  })
}

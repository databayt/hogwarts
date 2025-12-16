"use server"

import { revalidatePath } from "next/cache"
import {
  addMinutes,
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  isAfter,
  isBefore,
  isSameDay,
  isWeekend,
  parse,
  startOfMonth,
} from "date-fns"

import { db } from "@/lib/db"
import { sendEmail } from "@/lib/email"

import { DEFAULT_VISIT_DURATION, VISIT_SLOT_DURATION } from "./config"
import type { VisitFormData } from "./validation"

interface TimeSlot {
  startTime: string
  endTime: string
  available: boolean
}

interface DayAvailability {
  date: string
  available: boolean
  slotsCount: number
}

/**
 * Get available dates for visits in a given month
 */
export async function getAvailableDates(
  schoolId: string,
  month: Date
): Promise<{ success: boolean; dates?: DayAvailability[]; error?: string }> {
  try {
    // Get school's working days configuration
    const weekConfig = await db.schoolWeekConfig.findFirst({
      where: { schoolId },
      select: { workingDays: true },
    })

    // Default working days if not configured (Sun-Thu for Middle East)
    const workingDays = weekConfig?.workingDays || [0, 1, 2, 3, 4]

    // Get all days in the month
    const monthStart = startOfMonth(month)
    const monthEnd = endOfMonth(month)
    const allDays = eachDayOfInterval({ start: monthStart, end: monthEnd })

    // Get existing visits for the month
    const existingVisits = await db.visit.findMany({
      where: {
        schoolId,
        date: { gte: monthStart, lte: monthEnd },
        status: { in: ["PENDING", "CONFIRMED"] },
      },
      select: { date: true, startTime: true, endTime: true },
    })

    // Calculate availability for each day
    const availability: DayAvailability[] = allDays.map((day) => {
      const dayOfWeek = getDay(day)
      const isWorkingDay = workingDays.includes(dayOfWeek)
      const isPastDate = isBefore(day, new Date())

      if (!isWorkingDay || isPastDate) {
        return {
          date: format(day, "yyyy-MM-dd"),
          available: false,
          slotsCount: 0,
        }
      }

      // Count visits on this day
      const visitsOnDay = existingVisits.filter((v) => isSameDay(v.date, day))

      // Assume 8 slots per day (9:00-17:00 with 1-hour slots)
      const maxSlots = 8
      const bookedSlots = visitsOnDay.length
      const availableSlots = Math.max(0, maxSlots - bookedSlots)

      return {
        date: format(day, "yyyy-MM-dd"),
        available: availableSlots > 0,
        slotsCount: availableSlots,
      }
    })

    return { success: true, dates: availability }
  } catch (error) {
    console.error("[Visit] Failed to get available dates:", error)
    return { success: false, error: "Failed to load available dates" }
  }
}

/**
 * Get available time slots for a specific date
 * Takes into account the school's timetable to avoid busy periods
 */
export async function getAvailableSlots(
  schoolId: string,
  date: Date
): Promise<{ success: boolean; slots?: TimeSlot[]; error?: string }> {
  try {
    const dayOfWeek = getDay(date)

    // Get school operating hours (default 8:00-16:00)
    const schoolStart = "08:00"
    const schoolEnd = "16:00"

    // Get timetable entries for this day to find busy periods
    const timetableEntries = await db.timetable.findMany({
      where: {
        schoolId,
        dayOfWeek,
      },
      include: {
        period: {
          select: { startTime: true, endTime: true },
        },
      },
    })

    // Get existing visits for this date
    const existingVisits = await db.visit.findMany({
      where: {
        schoolId,
        date,
        status: { in: ["PENDING", "CONFIRMED"] },
      },
      select: { startTime: true, endTime: true },
    })

    // Generate all possible slots
    const slots: TimeSlot[] = []
    const slotDuration = VISIT_SLOT_DURATION
    const visitDuration = DEFAULT_VISIT_DURATION

    let currentTime = parse(schoolStart, "HH:mm", date)
    const endTime = parse(schoolEnd, "HH:mm", date)

    // Subtract visit duration from end time to ensure visit can complete
    const lastSlotStart = addMinutes(endTime, -visitDuration)

    while (
      isBefore(currentTime, lastSlotStart) ||
      isSameDay(currentTime, lastSlotStart)
    ) {
      const slotStart = format(currentTime, "HH:mm")
      const slotEnd = format(addMinutes(currentTime, visitDuration), "HH:mm")

      // Check if slot conflicts with timetable (busy periods)
      const conflictsWithTimetable = timetableEntries.some((entry) => {
        const periodStart = format(entry.period.startTime, "HH:mm")
        const periodEnd = format(entry.period.endTime, "HH:mm")
        return hasTimeOverlap(slotStart, slotEnd, periodStart, periodEnd)
      })

      // Check if slot conflicts with existing visits
      const conflictsWithVisits = existingVisits.some((visit) => {
        return hasTimeOverlap(
          slotStart,
          slotEnd,
          visit.startTime,
          visit.endTime
        )
      })

      // Check if slot is in the past (for today)
      const isPastSlot =
        isSameDay(date, new Date()) &&
        isBefore(parse(slotStart, "HH:mm", date), new Date())

      slots.push({
        startTime: slotStart,
        endTime: slotEnd,
        available:
          !conflictsWithTimetable && !conflictsWithVisits && !isPastSlot,
      })

      currentTime = addMinutes(currentTime, slotDuration)

      if (isAfter(currentTime, lastSlotStart)) break
    }

    return { success: true, slots }
  } catch (error) {
    console.error("[Visit] Failed to get available slots:", error)
    return { success: false, error: "Failed to load time slots" }
  }
}

/**
 * Check if two time ranges overlap
 */
function hasTimeOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  // Convert to comparable numbers (minutes from midnight)
  const toMinutes = (time: string) => {
    const [hours, minutes] = time.split(":").map(Number)
    return hours * 60 + minutes
  }

  const s1 = toMinutes(start1)
  const e1 = toMinutes(end1)
  const s2 = toMinutes(start2)
  const e2 = toMinutes(end2)

  return s1 < e2 && e1 > s2
}

/**
 * Book a visit
 */
export async function bookVisit(
  schoolId: string,
  data: VisitFormData
): Promise<{ success: boolean; visitId?: string; error?: string }> {
  try {
    // Verify the school exists
    const school = await db.school.findUnique({
      where: { id: schoolId },
      select: { id: true, name: true, email: true },
    })

    if (!school) {
      return { success: false, error: "School not found" }
    }

    // Parse the date
    const visitDate = new Date(data.date)

    // Create the visit
    const visit = await db.visit.create({
      data: {
        schoolId,
        date: visitDate,
        startTime: data.startTime,
        endTime:
          data.endTime ||
          format(
            addMinutes(
              parse(data.startTime, "HH:mm", visitDate),
              DEFAULT_VISIT_DURATION
            ),
            "HH:mm"
          ),
        visitorName: data.visitorName,
        email: data.email,
        phone: data.phone || null,
        purpose: data.purpose,
        visitors: data.visitors,
        notes: data.notes || null,
        status: "PENDING",
      },
    })

    // Send confirmation email to visitor
    try {
      await sendEmail({
        to: data.email,
        subject: `Visit Booking Confirmation - ${school.name}`,
        template: "visit-confirmation",
        data: {
          visitorName: data.visitorName,
          schoolName: school.name,
          date: format(visitDate, "EEEE, MMMM d, yyyy"),
          time: `${data.startTime} - ${
            data.endTime ||
            format(
              addMinutes(
                parse(data.startTime, "HH:mm", visitDate),
                DEFAULT_VISIT_DURATION
              ),
              "HH:mm"
            )
          }`,
          purpose: data.purpose,
        },
      })
    } catch {
      // Email failure shouldn't fail the booking
      console.error("[Visit] Failed to send confirmation email")
    }

    revalidatePath(`/admin/visits`)

    return { success: true, visitId: visit.id }
  } catch (error) {
    console.error("[Visit] Failed to book visit:", error)
    return { success: false, error: "Failed to book visit. Please try again." }
  }
}

/**
 * Cancel a visit
 */
export async function cancelVisit(
  visitId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const visit = await db.visit.update({
      where: { id: visitId },
      data: { status: "CANCELLED" },
    })

    // Send cancellation email
    try {
      await sendEmail({
        to: visit.email,
        subject: "Visit Cancellation Confirmation",
        template: "visit-cancellation",
        data: {
          visitorName: visit.visitorName,
          date: format(visit.date, "EEEE, MMMM d, yyyy"),
          time: `${visit.startTime} - ${visit.endTime}`,
        },
      })
    } catch {
      console.error("[Visit] Failed to send cancellation email")
    }

    revalidatePath(`/admin/visits`)

    return { success: true }
  } catch (error) {
    console.error("[Visit] Failed to cancel visit:", error)
    return { success: false, error: "Failed to cancel visit" }
  }
}

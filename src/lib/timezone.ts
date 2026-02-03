/**
 * Timezone Utilities - School-Aware Time Handling
 *
 * PURPOSE: Converts between UTC and school timezone for accurate scheduling
 * Schools operate on local time (timetables, attendance, events)
 * Database stores all times in UTC, converts on display
 *
 * KEY INSIGHT: All times in database are UTC (ISO format)
 * Converting to school timezone for UI - converting to UTC for storage
 *
 * METHODS:
 * - formatInTimezone: Format Date as local string in target timezone
 * - convertUtcToSchoolTime: UTC Date → formatted school time
 * - getSchoolTime: Current time in school timezone
 * - getSchoolDayStart: Midnight in school timezone (as UTC Date)
 * - isWithinSchoolHours: Check if current time in school hours
 * - createSchoolDateTime: Create UTC Date from school-local datetime
 *
 * ARCHITECTURE:
 * - Static class: Stateless timezone utilities
 * - getTimezoneOffset: Hardcoded offsets (DST not handled - use Intl API)
 * - Intl.DateTimeFormat: Recommended for accurate conversions
 * - SupportedTimezones: Whitelist validates timezone strings
 *
 * SUPPORTED TIMEZONES (25 total):
 * - Middle East (Sudan, Egypt, Saudi, UAE, Kuwait, Qatar, Bahrain, Iraq, Syria, Lebanon, Jordan)
 * - North Africa (Morocco, Tunisia, Algeria)
 * - Europe (London, Paris, Berlin)
 * - Americas (New York, Los Angeles)
 * - UTC
 *
 * CONSTRAINTS & GOTCHAS:
 * - CRITICAL: getTimezoneOffset() doesn't handle DST properly
 *   Use Intl.DateTimeFormat for accurate conversions (it handles DST)
 * - Hardcoded offsets are base time only (e.g., London = 0, but BST = +1)
 * - createSchoolDateTime is approximate (DST issues possible)
 * - isWithinSchoolHours is GMT-based, may be off during DST transitions
 * - getSupportedTimezones() calculates currentTime on each call (expensive)
 *
 * BEST PRACTICES:
 * - Always store times in UTC in database
 * - Use formatInTimezone() for display (handles DST via Intl)
 * - Use getSchoolTime() for current time (respects school timezone)
 * - Validate timezone with isSupportedTimezone() before use
 * - Add 'timeZone' to all Intl.DateTimeFormat options
 *
 * EXAMPLE:
 * ```ts
 * const utcNow = new Date(); // Database time (always UTC)
 * const schoolTime = convertUtcToSchoolTime(utcNow, "Africa/Cairo");
 * // Shows: "Thu, Nov 27, 2025 02:15 PM" (Cairo time)
 * ```
 */

import {
  supportedTimezones,
  type SupportedTimezone,
} from "@/components/school-dashboard/settings/validation"

export class TimezoneHelper {
  /**
   * Convert a Date to a specific timezone
   */
  static toTimezone(date: Date, timezone: string): Date {
    const utc = date.getTime() + date.getTimezoneOffset() * 60000
    const targetTime = new Date(
      utc + this.getTimezoneOffset(timezone) * 3600000
    )
    return targetTime
  }

  /**
   * Format a date in a specific timezone
   */
  static formatInTimezone(
    date: Date,
    timezone: string,
    options: Intl.DateTimeFormatOptions = {}
  ): string {
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: timezone,
    }

    return new Intl.DateTimeFormat("en-US", {
      ...defaultOptions,
      ...options,
    }).format(date)
  }

  /**
   * Get current time in a timezone as a formatted string
   */
  static getCurrentTimeInTimezone(timezone: string): string {
    try {
      return new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }).format(new Date())
    } catch (error) {
      console.warn(`Invalid timezone: ${timezone}`, error)
      return "Invalid timezone"
    }
  }

  /**
   * Get the current date in a timezone as YYYY-MM-DD
   */
  static getCurrentDateInTimezone(timezone: string): string {
    try {
      return new Intl.DateTimeFormat("en-CA", {
        timeZone: timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date())
    } catch (error) {
      console.warn(`Invalid timezone: ${timezone}`, error)
      return new Date().toISOString().split("T")[0]
    }
  }

  /**
   * Get timezone offset in hours (rough approximation)
   * Note: This doesn't account for DST properly, use Intl.DateTimeFormat for accurate conversions
   */
  private static getTimezoneOffset(timezone: string): number {
    const offsets: Record<string, number> = {
      "Africa/Khartoum": 2,
      "Africa/Cairo": 2,
      "Asia/Riyadh": 3,
      "Asia/Dubai": 4,
      "Asia/Kuwait": 3,
      "Asia/Qatar": 3,
      "Asia/Bahrain": 3,
      "Africa/Casablanca": 1,
      "Africa/Tunis": 1,
      "Africa/Algiers": 1,
      "Asia/Baghdad": 3,
      "Asia/Damascus": 2,
      "Asia/Beirut": 2,
      "Asia/Amman": 2,
      "Europe/London": 0, // Can be +1 during BST
      "Europe/Paris": 1, // Can be +2 during CEST
      "Europe/Berlin": 1, // Can be +2 during CEST
      "America/New_York": -5, // Can be -4 during EDT
      "America/Los_Angeles": -8, // Can be -7 during PDT
      UTC: 0,
    }

    return offsets[timezone] || 0
  }

  /**
   * Convert UTC time to school timezone for display
   */
  static convertUtcToSchoolTime(utcDate: Date, schoolTimezone: string): string {
    return this.formatInTimezone(utcDate, schoolTimezone, {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  /**
   * Get time for different school contexts (attendance, timetable, etc.)
   */
  static getSchoolTime(
    schoolTimezone: string,
    format: "date" | "time" | "datetime" = "datetime"
  ): string {
    const now = new Date()

    switch (format) {
      case "date":
        return this.formatInTimezone(now, schoolTimezone, {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        })
      case "time":
        return this.formatInTimezone(now, schoolTimezone, {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
      case "datetime":
      default:
        return this.formatInTimezone(now, schoolTimezone, {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
    }
  }

  /**
   * Check if a given time is within school hours
   */
  static isWithinSchoolHours(
    schoolTimezone: string,
    startHour: number = 7,
    endHour: number = 15
  ): boolean {
    try {
      const now = new Date()
      const timeString = this.formatInTimezone(now, schoolTimezone, {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })

      const [hours] = timeString.split(":").map(Number)
      return hours >= startHour && hours < endHour
    } catch (error) {
      console.warn("Error checking school hours:", error)
      return true // Default to allowing access
    }
  }

  /**
   * Get the start of day in school timezone as UTC Date
   */
  static getSchoolDayStart(schoolTimezone: string): Date {
    const today = this.getCurrentDateInTimezone(schoolTimezone)
    // Create a date at midnight in the school timezone
    const schoolMidnight = new Date(`${today}T00:00:00`)

    // Convert back to UTC
    // This is approximate and may have DST issues
    const offset = this.getTimezoneOffset(schoolTimezone)
    return new Date(schoolMidnight.getTime() - offset * 3600000)
  }

  /**
   * Format a time period (like class duration) respecting timezone
   */
  static formatTimePeriod(
    startTime: Date,
    endTime: Date,
    schoolTimezone: string
  ): string {
    const start = this.formatInTimezone(startTime, schoolTimezone, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })

    const end = this.formatInTimezone(endTime, schoolTimezone, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })

    return `${start} - ${end}`
  }

  /**
   * Create a Date object for a specific time in school timezone
   */
  static createSchoolDateTime(
    schoolTimezone: string,
    year: number,
    month: number, // 1-based
    day: number,
    hour: number = 0,
    minute: number = 0
  ): Date {
    // Create a date string in ISO format for the school timezone
    const dateString = `${year}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}T${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}:00`

    // This creates a local date, then we need to adjust for timezone
    const localDate = new Date(dateString)
    const offset = this.getTimezoneOffset(schoolTimezone)

    // Adjust to UTC
    return new Date(localDate.getTime() - offset * 3600000)
  }

  /**
   * Validate if a timezone is supported
   */
  static isSupportedTimezone(timezone: string): timezone is SupportedTimezone {
    return supportedTimezones.includes(timezone as SupportedTimezone)
  }

  /**
   * Get all supported timezones with their display names
   */
  static getSupportedTimezones(): Array<{
    value: SupportedTimezone
    label: string
    currentTime: string
  }> {
    return supportedTimezones.map((tz) => ({
      value: tz,
      label: this.getTimezoneDisplayName(tz),
      currentTime: this.getCurrentTimeInTimezone(tz),
    }))
  }

  private static getTimezoneDisplayName(timezone: string): string {
    const timezoneNames: Record<string, string> = {
      "Africa/Khartoum": "Sudan (Khartoum)",
      "Africa/Cairo": "Egypt (Cairo)",
      "Asia/Riyadh": "Saudi Arabia (Riyadh)",
      "Asia/Dubai": "UAE (Dubai)",
      "Asia/Kuwait": "Kuwait",
      "Asia/Qatar": "Qatar",
      "Asia/Bahrain": "Bahrain",
      "Africa/Casablanca": "Morocco (Casablanca)",
      "Africa/Tunis": "Tunisia (Tunis)",
      "Africa/Algiers": "Algeria (Algiers)",
      "Asia/Baghdad": "Iraq (Baghdad)",
      "Asia/Damascus": "Syria (Damascus)",
      "Asia/Beirut": "Lebanon (Beirut)",
      "Asia/Amman": "Jordan (Amman)",
      "Europe/London": "United Kingdom (London)",
      "Europe/Paris": "France (Paris)",
      "Europe/Berlin": "Germany (Berlin)",
      "America/New_York": "United States (New York)",
      "America/Los_Angeles": "United States (Los Angeles)",
      UTC: "Coordinated Universal Time",
    }

    return timezoneNames[timezone] || timezone
  }
}

// Export convenience functions
export const {
  formatInTimezone,
  getCurrentTimeInTimezone,
  getCurrentDateInTimezone,
  convertUtcToSchoolTime,
  getSchoolTime,
  isWithinSchoolHours,
  formatTimePeriod,
  createSchoolDateTime,
  isSupportedTimezone,
  getSupportedTimezones,
} = TimezoneHelper

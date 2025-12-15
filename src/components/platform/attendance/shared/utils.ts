import {
  differenceInMinutes,
  format,
  isAfter,
  isBefore,
  parseISO,
  startOfDay,
} from "date-fns"

import {
  AttendanceMethod,
  AttendanceRecord,
  AttendanceStats,
  AttendanceStatus,
} from "./types"

/**
 * Calculate attendance statistics from records
 */
export function calculateAttendanceStats(
  records: AttendanceRecord[]
): AttendanceStats {
  const stats: AttendanceStats = {
    total: records.length,
    present: 0,
    absent: 0,
    late: 0,
    excused: 0,
    sick: 0,
    holiday: 0,
    attendanceRate: 0,
    lastUpdated: new Date().toISOString(),
  }

  records.forEach((record) => {
    switch (record.status) {
      case "PRESENT":
        stats.present++
        break
      case "ABSENT":
        stats.absent++
        break
      case "LATE":
        stats.late++
        break
      case "EXCUSED":
        stats.excused++
        break
      case "SICK":
        stats.sick++
        break
      case "HOLIDAY":
        stats.holiday++
        break
    }
  })

  // Calculate attendance rate (present + late) / total
  if (stats.total > 0) {
    stats.attendanceRate = ((stats.present + stats.late) / stats.total) * 100
  }

  return stats
}

/**
 * Format attendance date for display
 */
export function formatAttendanceDate(date: Date | string): string {
  const dateObj = typeof date === "string" ? parseISO(date) : date
  return format(dateObj, "MMMM dd, yyyy")
}

/**
 * Format time for display
 */
export function formatTime(date: Date | string): string {
  const dateObj = typeof date === "string" ? parseISO(date) : date
  return format(dateObj, "hh:mm a")
}

/**
 * Calculate duration in minutes between check-in and check-out
 */
export function calculateDuration(
  checkIn: Date | string,
  checkOut?: Date | string
): number | null {
  if (!checkOut) return null

  const checkInTime = typeof checkIn === "string" ? parseISO(checkIn) : checkIn
  const checkOutTime =
    typeof checkOut === "string" ? parseISO(checkOut) : checkOut

  return differenceInMinutes(checkOutTime, checkInTime)
}

/**
 * Determine attendance status based on check-in time and class schedule
 */
export function determineAttendanceStatus(
  checkInTime: Date | string,
  classStartTime: Date | string,
  lateThresholdMinutes: number = 15
): AttendanceStatus {
  const checkIn =
    typeof checkInTime === "string" ? parseISO(checkInTime) : checkInTime
  const classStart =
    typeof classStartTime === "string"
      ? parseISO(classStartTime)
      : classStartTime

  const minutesLate = differenceInMinutes(checkIn, classStart)

  if (minutesLate <= 0) {
    return "PRESENT" // On time or early
  } else if (minutesLate <= lateThresholdMinutes) {
    return "LATE"
  } else {
    return "ABSENT" // Too late, mark as absent
  }
}

/**
 * Get status badge color for UI using semantic tokens
 */
export function getStatusColor(status: AttendanceStatus): string {
  switch (status) {
    case "PRESENT":
      return "bg-chart-2" // Green semantic token
    case "ABSENT":
      return "bg-destructive"
    case "LATE":
      return "bg-chart-4" // Yellow semantic token
    case "EXCUSED":
      return "bg-primary"
    case "SICK":
      return "bg-chart-1" // Orange semantic token
    case "HOLIDAY":
      return "bg-chart-3" // Purple semantic token
    default:
      return "bg-muted"
  }
}

/**
 * Get status badge variant for shadcn/ui Badge component
 */
export function getStatusVariant(
  status: AttendanceStatus
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "PRESENT":
      return "default"
    case "ABSENT":
      return "destructive"
    case "LATE":
      return "secondary"
    default:
      return "outline"
  }
}

/**
 * Get method icon name
 */
export function getMethodIcon(method: AttendanceMethod): string {
  switch (method) {
    case "MANUAL":
      return "Edit"
    case "GEOFENCE":
      return "MapPin"
    case "QR_CODE":
      return "QrCode"
    case "BARCODE":
      return "Barcode"
    case "RFID":
      return "CreditCard"
    case "FINGERPRINT":
      return "Fingerprint"
    case "FACE_RECOGNITION":
      return "User"
    case "NFC":
      return "Smartphone"
    case "BLUETOOTH":
      return "Bluetooth"
    case "BULK_UPLOAD":
      return "Upload"
    default:
      return "Circle"
  }
}

/**
 * Get method display name
 */
export function getMethodDisplayName(method: AttendanceMethod): string {
  switch (method) {
    case "MANUAL":
      return "Manual Entry"
    case "GEOFENCE":
      return "Location-Based"
    case "QR_CODE":
      return "QR Code"
    case "BARCODE":
      return "Barcode"
    case "RFID":
      return "RFID Card"
    case "FINGERPRINT":
      return "Fingerprint"
    case "FACE_RECOGNITION":
      return "Face Recognition"
    case "NFC":
      return "NFC Tap"
    case "BLUETOOTH":
      return "Bluetooth Proximity"
    case "BULK_UPLOAD":
      return "Bulk Upload"
    default:
      return method
  }
}

/**
 * Generate a unique QR code payload
 */
export function generateQRPayload(
  classId: string,
  validFor: number = 60
): string {
  const timestamp = Date.now()
  const expiresAt = timestamp + validFor * 1000
  const random = Math.random().toString(36).substring(7)

  const payload = {
    classId,
    timestamp,
    expiresAt,
    nonce: random,
  }

  return btoa(JSON.stringify(payload))
}

/**
 * Validate QR code payload
 */
export function validateQRPayload(payload: string): {
  valid: boolean
  classId?: string
  error?: string
} {
  try {
    const decoded = JSON.parse(atob(payload))
    const now = Date.now()

    if (!decoded.classId || !decoded.expiresAt) {
      return { valid: false, error: "Invalid QR code format" }
    }

    if (now > decoded.expiresAt) {
      return { valid: false, error: "QR code has expired" }
    }

    return { valid: true, classId: decoded.classId }
  } catch (error) {
    return { valid: false, error: "Invalid QR code" }
  }
}

/**
 * Format student identifier for display
 */
export function formatIdentifier(type: string, value: string): string {
  switch (type) {
    case "RFID_CARD":
      return `RFID: ${value.toUpperCase()}`
    case "BARCODE":
      return `Barcode: ${value}`
    case "NFC_TAG":
      return `NFC: ${value.toUpperCase()}`
    case "BLUETOOTH_MAC":
      return `BT: ${value.toUpperCase()}`
    default:
      return value
  }
}

/**
 * Check if attendance can be edited
 */
export function canEditAttendance(
  attendanceDate: Date | string,
  maxEditDays: number = 7
): boolean {
  const date =
    typeof attendanceDate === "string"
      ? parseISO(attendanceDate)
      : attendanceDate
  const now = new Date()
  const daysDiff = differenceInMinutes(now, date) / (60 * 24)

  return daysDiff <= maxEditDays
}

/**
 * Group attendance records by status
 */
export function groupByStatus(
  records: AttendanceRecord[]
): Record<AttendanceStatus, AttendanceRecord[]> {
  return records.reduce(
    (acc, record) => {
      if (!acc[record.status]) {
        acc[record.status] = []
      }
      acc[record.status].push(record)
      return acc
    },
    {} as Record<AttendanceStatus, AttendanceRecord[]>
  )
}

/**
 * Group attendance records by method
 */
export function groupByMethod(
  records: AttendanceRecord[]
): Record<AttendanceMethod, AttendanceRecord[]> {
  return records.reduce(
    (acc, record) => {
      if (!acc[record.method]) {
        acc[record.method] = []
      }
      acc[record.method].push(record)
      return acc
    },
    {} as Record<AttendanceMethod, AttendanceRecord[]>
  )
}

/**
 * Calculate attendance percentage for a student
 */
export function calculateAttendancePercentage(
  presentDays: number,
  totalDays: number
): number {
  if (totalDays === 0) return 0
  return Math.round((presentDays / totalDays) * 100)
}

/**
 * Check if device supports required APIs for method
 */
export function checkDeviceSupport(method: AttendanceMethod): {
  supported: boolean
  message?: string
} {
  switch (method) {
    case "QR_CODE":
    case "BARCODE":
      if (!navigator.mediaDevices?.getUserMedia) {
        return { supported: false, message: "Camera access not supported" }
      }
      return { supported: true }

    case "GEOFENCE":
      if (!navigator.geolocation) {
        return { supported: false, message: "Geolocation not supported" }
      }
      return { supported: true }

    case "NFC":
      if (!("NDEFReader" in window)) {
        return { supported: false, message: "NFC not supported on this device" }
      }
      return { supported: true }

    case "BLUETOOTH":
      if (!("bluetooth" in navigator)) {
        return { supported: false, message: "Web Bluetooth not supported" }
      }
      return { supported: true }

    case "FINGERPRINT":
      if (!window.PublicKeyCredential) {
        return { supported: false, message: "WebAuthn not supported" }
      }
      return { supported: true }

    default:
      return { supported: true }
  }
}

/**
 * Generate CSV from attendance records
 */
export function generateAttendanceCSV(records: AttendanceRecord[]): string {
  const headers = [
    "Student ID",
    "Student Name",
    "Date",
    "Status",
    "Method",
    "Check In",
    "Check Out",
    "Duration (min)",
    "Notes",
  ]

  const rows = records.map((record) => [
    record.studentId,
    record.studentName || "",
    formatAttendanceDate(record.date),
    record.status,
    getMethodDisplayName(record.method),
    record.checkInTime ? formatTime(record.checkInTime) : "",
    record.checkOutTime ? formatTime(record.checkOutTime) : "",
    record.checkInTime && record.checkOutTime
      ? calculateDuration(
          record.checkInTime,
          record.checkOutTime
        )?.toString() || ""
      : "",
    record.notes || "",
  ])

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
  ].join("\n")

  return csvContent
}

/**
 * Download CSV file
 */
export function downloadCSV(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)

  link.setAttribute("href", url)
  link.setAttribute("download", filename)
  link.style.visibility = "hidden"

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * Validate location accuracy
 */
export function isLocationAccurate(
  accuracy: number | undefined,
  threshold: number = 50
): boolean {
  if (!accuracy) return false
  return accuracy <= threshold
}

/**
 * Calculate distance between two points (Haversine formula)
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3 // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lon2 - lon1) * Math.PI) / 180

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c // Distance in meters
}

/**
 * Format duration for display
 */
export function formatDuration(minutes: number | null): string {
  if (!minutes) return "-"

  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60

  if (hours > 0) {
    return `${hours}h ${mins}m`
  }
  return `${mins}m`
}

/**
 * Get current academic period (for filtering)
 */
export function getCurrentAcademicPeriod(): { start: Date; end: Date } {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()

  // Assuming academic year starts in September
  if (month >= 8) {
    // September to August
    return {
      start: new Date(year, 8, 1),
      end: new Date(year + 1, 7, 31),
    }
  } else {
    return {
      start: new Date(year - 1, 8, 1),
      end: new Date(year, 7, 31),
    }
  }
}

/**
 * Sanitize and validate MAC address
 */
export function sanitizeMacAddress(mac: string): string | null {
  const cleaned = mac.replace(/[^0-9A-Fa-f]/g, "")
  if (cleaned.length !== 12) return null

  return cleaned.match(/.{2}/g)?.join(":").toUpperCase() || null
}

/**
 * Check if attendance record is today
 */
export function isToday(date: Date | string): boolean {
  const recordDate = typeof date === "string" ? parseISO(date) : date
  const today = startOfDay(new Date())
  const recordDay = startOfDay(recordDate)

  return recordDay.getTime() === today.getTime()
}

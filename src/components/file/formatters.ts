/**
 * File Block - Shared Formatters
 * Utility functions for formatting file-related data
 */

import type { FileCategory, FileType } from "./types"

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return "0 Bytes"

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"]

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

/**
 * Format bytes to Arabic representation
 */
export function formatBytesAr(bytes: number, decimals = 2): string {
  if (bytes === 0) return "0 بايت"

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ["بايت", "كيلوبايت", "ميجابايت", "جيجابايت", "تيرابايت"]

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

/**
 * Format date to locale string
 */
export function formatDate(
  date: Date | string,
  locale: "en" | "ar" = "en"
): string {
  const d = typeof date === "string" ? new Date(date) : date

  return d.toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

/**
 * Format date with time
 */
export function formatDateTime(
  date: Date | string,
  locale: "en" | "ar" = "en"
): string {
  const d = typeof date === "string" ? new Date(date) : date

  return d.toLocaleString(locale === "ar" ? "ar-SA" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(
  date: Date | string,
  locale: "en" | "ar" = "en"
): string {
  const d = typeof date === "string" ? new Date(date) : date
  const now = new Date()
  const diff = now.getTime() - d.getTime()

  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (locale === "ar") {
    if (days > 0) return `منذ ${days} ${days === 1 ? "يوم" : "أيام"}`
    if (hours > 0) return `منذ ${hours} ${hours === 1 ? "ساعة" : "ساعات"}`
    if (minutes > 0)
      return `منذ ${minutes} ${minutes === 1 ? "دقيقة" : "دقائق"}`
    return "منذ لحظات"
  }

  if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`
  if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`
  return "Just now"
}

/**
 * Format duration in seconds to human readable
 */
export function formatDuration(
  seconds: number,
  locale: "en" | "ar" = "en"
): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  const parts: string[] = []

  if (locale === "ar") {
    if (hours > 0) parts.push(`${hours} س`)
    if (minutes > 0) parts.push(`${minutes} د`)
    if (secs > 0 || parts.length === 0) parts.push(`${secs} ث`)
  } else {
    if (hours > 0) parts.push(`${hours}h`)
    if (minutes > 0) parts.push(`${minutes}m`)
    if (secs > 0 || parts.length === 0) parts.push(`${secs}s`)
  }

  return parts.join(" ")
}

/**
 * Generate unique filename with timestamp
 */
export function generateUniqueFilename(originalName: string): string {
  const timestamp = Date.now()
  const sanitized = originalName.replace(/[^a-zA-Z0-9.-]/g, "_")
  const lastDot = sanitized.lastIndexOf(".")
  const name = lastDot > 0 ? sanitized.substring(0, lastDot) : sanitized
  const ext = lastDot > 0 ? sanitized.substring(lastDot) : ""

  return `${timestamp}_${name}${ext}`
}

/**
 * Generate export filename with timestamp
 */
export function generateExportFilename(
  prefix: string,
  format: string,
  options?: {
    timestamp?: boolean
    dateRange?: { from: Date; to: Date }
  }
): string {
  const { timestamp = true, dateRange } = options || {}

  let filename = prefix

  if (dateRange) {
    const from = dateRange.from.toISOString().split("T")[0]
    const to = dateRange.to.toISOString().split("T")[0]
    filename += `_${from}_to_${to}`
  }

  if (timestamp) {
    const now = new Date()
    const dateStr = now.toISOString().split("T")[0]
    filename += `_${dateStr}`
  }

  return `${filename}.${format}`
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf(".")
  return lastDot > 0 ? filename.substring(lastDot + 1).toLowerCase() : ""
}

/**
 * Get filename without extension
 */
export function getFileNameWithoutExtension(filename: string): string {
  const lastDot = filename.lastIndexOf(".")
  return lastDot > 0 ? filename.substring(0, lastDot) : filename
}

/**
 * Truncate filename for display
 */
export function truncateFilename(filename: string, maxLength = 30): string {
  if (filename.length <= maxLength) return filename

  const ext = getFileExtension(filename)
  const name = getFileNameWithoutExtension(filename)
  const availableLength = maxLength - ext.length - 4 // 4 for "..." and "."

  if (availableLength <= 0) {
    return filename.substring(0, maxLength - 3) + "..."
  }

  return `${name.substring(0, availableLength)}...${ext ? "." + ext : ""}`
}

/**
 * Get category display name
 */
export function getCategoryDisplayName(
  category: FileCategory,
  locale: "en" | "ar" = "en"
): string {
  const names: Record<FileCategory, { en: string; ar: string }> = {
    image: { en: "Image", ar: "صورة" },
    video: { en: "Video", ar: "فيديو" },
    document: { en: "Document", ar: "مستند" },
    audio: { en: "Audio", ar: "صوت" },
    archive: { en: "Archive", ar: "أرشيف" },
    other: { en: "Other", ar: "أخرى" },
  }

  return names[category]?.[locale] || names.other[locale]
}

/**
 * Get file type display name
 */
export function getTypeDisplayName(
  type: FileType,
  locale: "en" | "ar" = "en"
): string {
  const names: Record<string, { en: string; ar: string }> = {
    // Images
    avatar: { en: "Avatar", ar: "صورة رمزية" },
    logo: { en: "Logo", ar: "شعار" },
    banner: { en: "Banner", ar: "لافتة" },
    thumbnail: { en: "Thumbnail", ar: "صورة مصغرة" },
    content: { en: "Content Image", ar: "صورة المحتوى" },
    // Videos
    lesson: { en: "Lesson Video", ar: "فيديو الدرس" },
    course: { en: "Course Video", ar: "فيديو الدورة" },
    assignment: { en: "Assignment", ar: "واجب" },
    promotional: { en: "Promotional", ar: "ترويجي" },
    // Documents
    pdf: { en: "PDF Document", ar: "مستند PDF" },
    word: { en: "Word Document", ar: "مستند Word" },
    excel: { en: "Spreadsheet", ar: "جدول بيانات" },
    powerpoint: { en: "Presentation", ar: "عرض تقديمي" },
    text: { en: "Text File", ar: "ملف نصي" },
    certificate: { en: "Certificate", ar: "شهادة" },
    receipt: { en: "Receipt", ar: "إيصال" },
    invoice: { en: "Invoice", ar: "فاتورة" },
    report: { en: "Report", ar: "تقرير" },
    transcript: { en: "Transcript", ar: "كشف الدرجات" },
    id_card: { en: "ID Card", ar: "بطاقة هوية" },
  }

  return names[type]?.[locale] || type
}

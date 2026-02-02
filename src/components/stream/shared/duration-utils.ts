/**
 * Utility functions for calculating and formatting course duration
 */

interface Lesson {
  duration: number | null
}

interface Chapter {
  lessons: Lesson[]
}

/**
 * Calculate total duration from chapters and lessons
 * @param chapters Array of chapters with lessons
 * @returns Total duration in minutes
 */
export function calculateTotalDuration(chapters: Chapter[]): number {
  return chapters.reduce((total, chapter) => {
    return (
      total +
      chapter.lessons.reduce((chapterTotal, lesson) => {
        return chapterTotal + (lesson.duration || 0)
      }, 0)
    )
  }, 0)
}

/**
 * Format duration in minutes to human-readable string
 * @param minutes Total duration in minutes
 * @param lang Language code for localization
 * @returns Formatted duration string (e.g., "2h 30m" or "45m")
 */
export function formatDuration(minutes: number, lang: string = "en"): string {
  if (minutes === 0) return lang === "ar" ? "غير محدد" : "TBD"

  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60

  if (lang === "ar") {
    if (hours === 0) return `${mins} دقيقة`
    if (mins === 0) return `${hours} ساعة`
    return `${hours} ساعة ${mins} دقيقة`
  }

  if (hours === 0) return `${mins}m`
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}m`
}

/**
 * Format duration for display with video context
 * @param minutes Total duration in minutes
 * @param lang Language code for localization
 * @returns Formatted duration string (e.g., "2 hours of video")
 */
export function formatVideoDuration(
  minutes: number,
  lang: string = "en"
): string {
  if (minutes === 0) return ""

  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60

  if (lang === "ar") {
    if (hours === 0) return `${mins} دقيقة من الفيديو`
    if (hours === 1 && mins === 0) return "ساعة من الفيديو"
    if (mins === 0) return `${hours} ساعات من الفيديو`
    return `${hours} ساعات و ${mins} دقيقة من الفيديو`
  }

  if (hours === 0) return `${mins} min of video`
  if (hours === 1 && mins === 0) return "1 hour of video"
  if (mins === 0) return `${hours} hours of video`
  return `${hours}h ${mins}m of video`
}

/**
 * Format seconds to MM:SS or HH:MM:SS
 * @param seconds Total seconds
 * @returns Formatted time string
 */
export function formatSeconds(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`
}

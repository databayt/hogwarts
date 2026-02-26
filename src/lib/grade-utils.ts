/**
 * Utility for extracting grade numbers from free-text input.
 * Used by admission placement to match applicants to grades.
 */

const ARABIC_ORDINALS: Record<string, number> = {
  الأول: 1,
  الاول: 1,
  الثاني: 2,
  الثالث: 3,
  الرابع: 4,
  الخامس: 5,
  السادس: 6,
  السابع: 7,
  الثامن: 8,
  التاسع: 9,
  العاشر: 10,
  "الحادي عشر": 11,
  "الثاني عشر": 12,
}

const ENGLISH_ORDINALS: Record<string, number> = {
  first: 1,
  second: 2,
  third: 3,
  fourth: 4,
  fifth: 5,
  sixth: 6,
  seventh: 7,
  eighth: 8,
  ninth: 9,
  tenth: 10,
  eleventh: 11,
  twelfth: 12,
}

/**
 * Extract a grade number from free-text input.
 * Handles: "Grade 5", "5th grade", "الصف الخامس", "grade-5", "5", "Year 5"
 */
export function extractGradeNumber(text: string): number | null {
  if (!text) return null

  const normalized = text.trim().toLowerCase()

  // Direct number: "5", "10"
  const directNum = parseInt(normalized, 10)
  if (!isNaN(directNum) && directNum >= 1 && directNum <= 12) {
    return directNum
  }

  // "Grade 5", "grade-5", "Grade5", "Year 5"
  const gradeMatch = normalized.match(
    /(?:grade|year|level|صف|الصف)\s*[-_]?\s*(\d{1,2})/
  )
  if (gradeMatch) {
    const num = parseInt(gradeMatch[1], 10)
    if (num >= 1 && num <= 12) return num
  }

  // "5th grade", "1st", "2nd", "3rd"
  const ordinalMatch = normalized.match(/(\d{1,2})(?:st|nd|rd|th)/)
  if (ordinalMatch) {
    const num = parseInt(ordinalMatch[1], 10)
    if (num >= 1 && num <= 12) return num
  }

  // Arabic ordinals: "الصف الخامس" -> 5
  for (const [word, num] of Object.entries(ARABIC_ORDINALS)) {
    if (text.includes(word)) return num
  }

  // English ordinals: "fifth grade" -> 5
  for (const [word, num] of Object.entries(ENGLISH_ORDINALS)) {
    if (normalized.includes(word)) return num
  }

  // Trailing number: "Section 5", "Class 5"
  const trailingMatch = normalized.match(/\b(\d{1,2})\s*$/)
  if (trailingMatch) {
    const num = parseInt(trailingMatch[1], 10)
    if (num >= 1 && num <= 12) return num
  }

  return null
}

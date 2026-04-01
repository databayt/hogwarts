/**
 * Static grade label lookup — zero external dependencies.
 * Replaces the fragile Google Translate pipeline for grade display.
 */

const AR_GRADES: Record<number, string> = {
  [-1]: "الحضانة",
  [0]: "الروضة",
  [1]: "الأول",
  [2]: "الثاني",
  [3]: "الثالث",
  [4]: "الرابع",
  [5]: "الخامس",
  [6]: "السادس",
  [7]: "السابع",
  [8]: "الثامن",
  [9]: "التاسع",
  [10]: "العاشر",
  [11]: "الحادي عشر",
  [12]: "الثاني عشر",
}

const EN_GRADES: Record<number, string> = {
  [-1]: "Nursery",
  [0]: "KG",
  [1]: "Grade 1",
  [2]: "Grade 2",
  [3]: "Grade 3",
  [4]: "Grade 4",
  [5]: "Grade 5",
  [6]: "Grade 6",
  [7]: "Grade 7",
  [8]: "Grade 8",
  [9]: "Grade 9",
  [10]: "Grade 10",
  [11]: "Grade 11",
  [12]: "Grade 12",
}

export function getGradeLabel(gradeNumber: number, lang: string): string {
  const map = lang === "ar" ? AR_GRADES : EN_GRADES
  return (
    map[gradeNumber] ??
    (lang === "ar" ? `الصف ${gradeNumber}` : `Grade ${gradeNumber}`)
  )
}

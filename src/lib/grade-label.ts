/**
 * Grade display for a stored `gradeNumber`. Thin wrapper over `@/lib/grade`
 * kept for existing callers — new code should call `gradeLabel` directly.
 *
 * Without a country this keeps the old short wording ("السابع" / "Grade 7");
 * with `country: "SD"` it returns the Sudanese stage name ("الأول متوسط").
 */

import { gradeLabel } from "@/lib/grade"

export function getGradeLabel(
  gradeNumber: number,
  lang: string,
  country?: string | null
): string {
  return gradeLabel(gradeNumber, {
    lang,
    country,
    form: lang === "ar" ? "short" : "long",
  })
}

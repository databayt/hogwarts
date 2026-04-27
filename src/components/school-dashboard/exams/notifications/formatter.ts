// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Lang-aware notification message templates for the exams block.
 *
 * Lives outside `actions.ts` so it can be (a) imported by non-server callers
 * (cron jobs, formatters, tests) and (b) covered by unit tests without
 * needing the auth/db mocks that "use server" requires.
 *
 * Only Arabic and English are wired today; non-Arabic locales fall through
 * to English. Wire a full dictionary lookup here when notifications need to
 * follow a third locale.
 */

import { formatDate, formatDateTime } from "@/lib/i18n-format"

import type { ExamNotificationData, RecipientType } from "./types"

export const DEFAULT_NOTIFICATION_LANG = "ar"

function isArabic(lang: string): boolean {
  return lang.toLowerCase().startsWith("ar")
}

// Narrow `lang` to the locales `formatDate`/`formatDateTime` accept.
// Anything that's not Arabic falls through to the English formatters.
function toFmtLocale(lang: string): "ar" | "en" {
  return isArabic(lang) ? "ar" : "en"
}

export function formatExamNotification(
  data: ExamNotificationData,
  _recipientType: RecipientType,
  lang: string = DEFAULT_NOTIFICATION_LANG
): { title: string; body: string } {
  const ar = isArabic(lang)
  switch (data.type) {
    case "EXAM_SCHEDULED": {
      const dateStr = formatDate(data.examDate, toFmtLocale(lang))
      return ar
        ? {
            title: `امتحان جديد: ${data.examTitle}`,
            body: `تم جدولة امتحان ${data.name} يوم ${dateStr}. المدة: ${data.duration} دقيقة.`,
          }
        : {
            title: `New Exam: ${data.examTitle}`,
            body: `${data.name} exam scheduled for ${dateStr}. Duration: ${data.duration} minutes.`,
          }
    }
    case "EXAM_REMINDER":
      return ar
        ? {
            title: `تذكير بالامتحان: ${data.examTitle}`,
            body: `سيبدأ امتحان ${data.name} خلال ${data.hoursUntil} ساعة.`,
          }
        : {
            title: `Exam Reminder: ${data.examTitle}`,
            body: `Your ${data.name} exam starts in ${data.hoursUntil} hours.`,
          }
    case "EXAM_STARTED": {
      const endStr = formatDateTime(data.endTime, toFmtLocale(lang), {
        hour: "2-digit",
        minute: "2-digit",
      })
      return ar
        ? {
            title: `بدأ الامتحان: ${data.examTitle}`,
            body: `بدأ امتحان ${data.name} وسينتهي عند ${endStr}.`,
          }
        : {
            title: `Exam Started: ${data.examTitle}`,
            body: `The ${data.name} exam has started and will end at ${endStr}.`,
          }
    }
    case "EXAM_COMPLETED":
      return ar
        ? {
            title: `اكتمل الامتحان: ${data.examTitle}`,
            body: `اكتمل امتحان ${data.name}. تمت الإجابة على ${data.questionsAnswered}/${data.totalQuestions} سؤال.`,
          }
        : {
            title: `Exam Completed: ${data.examTitle}`,
            body: `Completed ${data.name} exam. Answered ${data.questionsAnswered}/${data.totalQuestions} questions.`,
          }
    case "RESULTS_PUBLISHED": {
      const passed = data.passed
      return ar
        ? {
            title: `نتائج: ${data.examTitle}`,
            body: `الدرجة: ${data.percentage.toFixed(1)}% (${data.grade}). ${passed ? "ناجح!" : "غير ناجح."}`,
          }
        : {
            title: `Results: ${data.examTitle}`,
            body: `Score: ${data.percentage.toFixed(1)}% (${data.grade}). ${passed ? "Passed!" : "Did not pass."}`,
          }
    }
    case "RETAKE_AVAILABLE":
      return ar
        ? {
            title: `إعادة الامتحان متاحة: ${data.examTitle}`,
            body: `يمكنك إعادة امتحان ${data.name}. الدرجة السابقة: ${data.previousScore}%. المحاولة ${data.attemptNumber}/${data.maxAttempts}.`,
          }
        : {
            title: `Retake Available: ${data.examTitle}`,
            body: `You can retake the ${data.name} exam. Previous: ${data.previousScore}%. Attempt ${data.attemptNumber}/${data.maxAttempts}.`,
          }
    case "GRADE_UPDATED":
      return ar
        ? {
            title: `تحديث الدرجة: ${data.examTitle}`,
            body: `تم تحديث درجة ${data.name} من ${data.previousGrade} إلى ${data.newGrade}.`,
          }
        : {
            title: `Grade Updated: ${data.examTitle}`,
            body: `Your ${data.name} grade changed from ${data.previousGrade} to ${data.newGrade}.`,
          }
    default:
      return ar
        ? { title: "إشعار امتحان", body: "لديك إشعار امتحان جديد." }
        : {
            title: "Exam Notification",
            body: "You have a new exam notification.",
          }
  }
}

import type { Page } from "@playwright/test"

import {
  getSchoolUrl,
  loginAs,
  waitForRedirect,
  type TestEnv,
  type TestUserRole,
} from "../auth/helpers"

/**
 * Exam E2E Test Helpers
 *
 * Provides utilities for testing exam lifecycle including:
 * - Exam creation and management
 * - Question bank operations
 * - Student exam taking
 * - Marking and grading
 * - Results and analytics
 */

export interface ExamFormData {
  title: string
  description?: string
  classId?: string
  subjectId?: string
  examDate: Date
  startTime: string
  endTime: string
  duration: number
  totalMarks: number
  passingMarks: number
  examType: "MIDTERM" | "FINAL" | "QUIZ" | "TEST" | "PRACTICAL"
  instructions?: string
}

export interface QuestionFormData {
  questionText: string
  questionType:
    | "MULTIPLE_CHOICE"
    | "TRUE_FALSE"
    | "SHORT_ANSWER"
    | "ESSAY"
    | "FILL_BLANK"
  difficulty: "EASY" | "MEDIUM" | "HARD"
  points: number
  options?: Array<{ text: string; isCorrect: boolean }>
  sampleAnswer?: string
}

/**
 * Navigate to exams list page
 */
export async function goToExamsPage(
  page: Page,
  subdomain: string = "demo",
  locale: "ar" | "en" = "en",
  env: TestEnv = "local"
): Promise<void> {
  const schoolUrl = getSchoolUrl(subdomain, env)
  await page.goto(`${schoolUrl}/${locale}/exams`)
  await page.waitForLoadState("networkidle")
}

/**
 * Navigate to create new exam page
 */
export async function goToNewExamPage(
  page: Page,
  subdomain: string = "demo",
  locale: "ar" | "en" = "en",
  env: TestEnv = "local"
): Promise<void> {
  const schoolUrl = getSchoolUrl(subdomain, env)
  await page.goto(`${schoolUrl}/${locale}/exams/new`)
  await page.waitForLoadState("networkidle")
}

/**
 * Navigate to question bank page
 */
export async function goToQuestionBankPage(
  page: Page,
  subdomain: string = "demo",
  locale: "ar" | "en" = "en",
  env: TestEnv = "local"
): Promise<void> {
  const schoolUrl = getSchoolUrl(subdomain, env)
  await page.goto(`${schoolUrl}/${locale}/exams/qbank`)
  await page.waitForLoadState("networkidle")
}

/**
 * Navigate to marking page
 */
export async function goToMarkingPage(
  page: Page,
  subdomain: string = "demo",
  locale: "ar" | "en" = "en",
  env: TestEnv = "local"
): Promise<void> {
  const schoolUrl = getSchoolUrl(subdomain, env)
  await page.goto(`${schoolUrl}/${locale}/exams/mark`)
  await page.waitForLoadState("networkidle")
}

/**
 * Navigate to results page
 */
export async function goToResultsPage(
  page: Page,
  subdomain: string = "demo",
  locale: "ar" | "en" = "en",
  env: TestEnv = "local"
): Promise<void> {
  const schoolUrl = getSchoolUrl(subdomain, env)
  await page.goto(`${schoolUrl}/${locale}/exams/result`)
  await page.waitForLoadState("networkidle")
}

/**
 * Navigate to exam taking page
 */
export async function goToTakeExamPage(
  page: Page,
  examId: string,
  subdomain: string = "demo",
  locale: "ar" | "en" = "en",
  env: TestEnv = "local"
): Promise<void> {
  const schoolUrl = getSchoolUrl(subdomain, env)
  await page.goto(`${schoolUrl}/${locale}/exams/${examId}/take`)
  await page.waitForLoadState("networkidle")
}

/**
 * Fill exam creation form
 */
export async function fillExamForm(
  page: Page,
  data: Partial<ExamFormData>
): Promise<void> {
  if (data.title) {
    await page.fill('input[name="title"]', data.title)
  }

  if (data.description) {
    await page.fill('textarea[name="description"]', data.description)
  }

  if (data.examType) {
    await page.click('[data-testid="exam-type-select"]')
    await page.click(`[data-value="${data.examType}"]`)
  }

  if (data.totalMarks) {
    await page.fill('input[name="totalMarks"]', data.totalMarks.toString())
  }

  if (data.passingMarks) {
    await page.fill('input[name="passingMarks"]', data.passingMarks.toString())
  }

  if (data.duration) {
    await page.fill('input[name="duration"]', data.duration.toString())
  }

  if (data.startTime) {
    await page.fill('input[name="startTime"]', data.startTime)
  }

  if (data.endTime) {
    await page.fill('input[name="endTime"]', data.endTime)
  }

  if (data.instructions) {
    await page.fill('textarea[name="instructions"]', data.instructions)
  }
}

/**
 * Fill question creation form
 */
export async function fillQuestionForm(
  page: Page,
  data: Partial<QuestionFormData>
): Promise<void> {
  if (data.questionText) {
    await page.fill(
      'textarea[name="questionText"], input[name="questionText"]',
      data.questionText
    )
  }

  if (data.questionType) {
    await page.click('[data-testid="question-type-select"]')
    await page.click(`[data-value="${data.questionType}"]`)
  }

  if (data.difficulty) {
    await page.click('[data-testid="difficulty-select"]')
    await page.click(`[data-value="${data.difficulty}"]`)
  }

  if (data.points) {
    await page.fill('input[name="points"]', data.points.toString())
  }

  if (data.options && data.options.length > 0) {
    for (let i = 0; i < data.options.length; i++) {
      const option = data.options[i]
      const optionInput = page.locator(`input[name="options.${i}.text"]`)
      if (await optionInput.isVisible()) {
        await optionInput.fill(option.text)
      }

      if (option.isCorrect) {
        const checkbox = page.locator(`input[name="options.${i}.isCorrect"]`)
        if (await checkbox.isVisible()) {
          await checkbox.check()
        }
      }
    }
  }

  if (data.sampleAnswer) {
    await page.fill(
      'textarea[name="sampleAnswer"], input[name="sampleAnswer"]',
      data.sampleAnswer
    )
  }
}

/**
 * Submit form and wait for response
 */
export async function submitForm(page: Page): Promise<void> {
  await page.click('button[type="submit"]')
  await page.waitForLoadState("networkidle")
}

/**
 * Click next button in multi-step form
 */
export async function clickNextStep(page: Page): Promise<void> {
  const nextButton = page.locator(
    'button:has-text("Next"), button:has-text("التالي")'
  )
  if (await nextButton.isVisible()) {
    await nextButton.click()
    await page.waitForTimeout(500) // Allow animation
  }
}

/**
 * Click back button in multi-step form
 */
export async function clickBackStep(page: Page): Promise<void> {
  const backButton = page.locator(
    'button:has-text("Back"), button:has-text("السابق")'
  )
  if (await backButton.isVisible()) {
    await backButton.click()
    await page.waitForTimeout(500)
  }
}

/**
 * Wait for toast notification
 */
export async function waitForToast(
  page: Page,
  type: "success" | "error" = "success",
  timeout: number = 5000
): Promise<string> {
  const toastSelector =
    type === "success"
      ? '[data-sonner-toast][data-type="success"], .toast-success'
      : '[data-sonner-toast][data-type="error"], .toast-error'

  const toast = page.locator(toastSelector).first()
  await toast.waitFor({ timeout })
  return (await toast.textContent()) || ""
}

/**
 * Get table row count
 */
export async function getTableRowCount(page: Page): Promise<number> {
  await page.waitForSelector("table tbody tr", { timeout: 5000 }).catch(() => 0)
  return page.locator("table tbody tr").count()
}

/**
 * Search in table
 */
export async function searchInTable(
  page: Page,
  searchText: string
): Promise<void> {
  const searchInput = page.locator(
    'input[placeholder*="Search"], input[placeholder*="بحث"]'
  )
  if (await searchInput.isVisible()) {
    await searchInput.fill(searchText)
    await page.waitForTimeout(500) // Debounce
  }
}

/**
 * Select option in table filter
 */
export async function selectTableFilter(
  page: Page,
  filterName: string,
  value: string
): Promise<void> {
  const filter = page.locator(`[data-testid="filter-${filterName}"]`)
  if (await filter.isVisible()) {
    await filter.click()
    await page.click(`[data-value="${value}"]`)
  }
}

/**
 * Login and navigate to exams page
 */
export async function loginAndGoToExams(
  page: Page,
  role: TestUserRole,
  subdomain: string = "demo",
  locale: "ar" | "en" = "en",
  env: TestEnv = "local"
): Promise<void> {
  const schoolUrl = getSchoolUrl(subdomain, env)
  await page.goto(`${schoolUrl}/${locale}/login`)
  await loginAs(page, role)
  await waitForRedirect(page)
  await goToExamsPage(page, subdomain, locale, env)
}

/**
 * Check if element exists on page
 */
export async function elementExists(
  page: Page,
  selector: string,
  timeout: number = 2000
): Promise<boolean> {
  try {
    await page.waitForSelector(selector, { timeout })
    return true
  } catch {
    return false
  }
}

/**
 * Get exam timer value
 */
export async function getExamTimer(page: Page): Promise<string | null> {
  const timer = page.locator(
    '[data-testid="exam-timer"], .exam-timer, [role="timer"]'
  )
  if (await timer.isVisible()) {
    return timer.textContent()
  }
  return null
}

/**
 * Answer multiple choice question
 */
export async function answerMultipleChoice(
  page: Page,
  questionIndex: number,
  optionIndex: number
): Promise<void> {
  const option = page.locator(
    `[data-testid="question-${questionIndex}"] [data-testid="option-${optionIndex}"],
     .question-${questionIndex} .option-${optionIndex},
     [data-question="${questionIndex}"] input[type="radio"]`
  )
  if (await option.isVisible()) {
    await option.click()
  }
}

/**
 * Answer short answer question
 */
export async function answerShortAnswer(
  page: Page,
  questionIndex: number,
  answer: string
): Promise<void> {
  const input = page.locator(
    `[data-testid="question-${questionIndex}"] textarea,
     [data-testid="question-${questionIndex}"] input[type="text"],
     .question-${questionIndex} textarea`
  )
  if (await input.isVisible()) {
    await input.fill(answer)
  }
}

/**
 * Submit exam
 */
export async function submitExam(page: Page): Promise<void> {
  const submitButton = page.locator(
    'button:has-text("Submit"), button:has-text("إرسال")'
  )
  await submitButton.click()

  // Confirm submission if dialog appears
  const confirmButton = page.locator(
    'button:has-text("Confirm"), button:has-text("تأكيد")'
  )
  if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await confirmButton.click()
  }

  await page.waitForLoadState("networkidle")
}

/**
 * Grade a student answer
 */
export async function gradeAnswer(
  page: Page,
  points: number,
  feedback?: string
): Promise<void> {
  await page.fill('input[name="points"]', points.toString())
  if (feedback) {
    await page.fill('textarea[name="feedback"]', feedback)
  }
  await page.click('button:has-text("Save"), button:has-text("حفظ")')
}

/**
 * Generate exam date in future
 */
export function getFutureExamDate(daysFromNow: number = 7): Date {
  const date = new Date()
  date.setDate(date.getDate() + daysFromNow)
  return date
}

/**
 * Format date for input field
 */
export function formatDateForInput(date: Date): string {
  return date.toISOString().split("T")[0]
}

/**
 * Format time for input field (HH:mm)
 */
export function formatTimeForInput(hours: number, minutes: number = 0): string {
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`
}

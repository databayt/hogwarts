/**
 * CSV Import/Export Utilities for Question Bank
 *
 * Provides functions for:
 * - Exporting questions to CSV
 * - Importing questions from CSV
 * - Validating CSV data
 * - Mapping CSV columns to database fields
 */

import type {
  BloomLevel,
  DifficultyLevel,
  QuestionSource,
  QuestionType,
} from "@prisma/client"
import { z } from "zod"

// CSV Headers for export/import
export const QUESTION_CSV_HEADERS = [
  "Question Text",
  "Question Type",
  "Difficulty",
  "Bloom Level",
  "Points",
  "Time Estimate (minutes)",
  "Subject",
  "Tags",
  "Option 1",
  "Option 1 Correct",
  "Option 2",
  "Option 2 Correct",
  "Option 3",
  "Option 3 Correct",
  "Option 4",
  "Option 4 Correct",
  "Option 5",
  "Option 5 Correct",
  "Sample Answer",
  "Grading Rubric",
  "Explanation",
  "Source",
] as const

// CSV Import Schema
export const questionCSVRowSchema = z.object({
  "Question Text": z.string().min(1, "Question text is required"),
  "Question Type": z.enum([
    "MULTIPLE_CHOICE",
    "TRUE_FALSE",
    "SHORT_ANSWER",
    "ESSAY",
    "FILL_BLANK",
  ] as const),
  Difficulty: z.enum(["EASY", "MEDIUM", "HARD"] as const),
  "Bloom Level": z.enum([
    "REMEMBER",
    "UNDERSTAND",
    "APPLY",
    "ANALYZE",
    "EVALUATE",
    "CREATE",
  ] as const),
  Points: z.string().transform((val) => parseFloat(val)),
  "Time Estimate (minutes)": z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : undefined)),
  Subject: z.string().optional(),
  Tags: z.string().optional(),
  "Option 1": z.string().optional(),
  "Option 1 Correct": z
    .string()
    .optional()
    .transform((val) => val?.toLowerCase() === "true" || val === "1"),
  "Option 2": z.string().optional(),
  "Option 2 Correct": z
    .string()
    .optional()
    .transform((val) => val?.toLowerCase() === "true" || val === "1"),
  "Option 3": z.string().optional(),
  "Option 3 Correct": z
    .string()
    .optional()
    .transform((val) => val?.toLowerCase() === "true" || val === "1"),
  "Option 4": z.string().optional(),
  "Option 4 Correct": z
    .string()
    .optional()
    .transform((val) => val?.toLowerCase() === "true" || val === "1"),
  "Option 5": z.string().optional(),
  "Option 5 Correct": z
    .string()
    .optional()
    .transform((val) => val?.toLowerCase() === "true" || val === "1"),
  "Sample Answer": z.string().optional(),
  "Grading Rubric": z.string().optional(),
  Explanation: z.string().optional(),
  Source: z.string().optional().default("IMPORTED"),
})

export type QuestionCSVRow = z.infer<typeof questionCSVRowSchema>

/**
 * Convert question data to CSV format
 */
export function questionToCSVRow(question: any): Record<string, string> {
  const row: Record<string, string> = {
    "Question Text": question.questionText,
    "Question Type": question.questionType,
    Difficulty: question.difficulty,
    "Bloom Level": question.bloomLevel,
    Points: question.points.toString(),
    "Time Estimate (minutes)": question.timeEstimate?.toString() || "",
    Subject: question.subject?.subjectName || "",
    Tags: question.tags?.join(", ") || "",
    "Sample Answer": question.sampleAnswer || "",
    "Grading Rubric": question.gradingRubric || "",
    Explanation: question.explanation || "",
    Source: question.source || "MANUAL",
  }

  // Add options for MCQ/True-False questions
  if (
    question.options &&
    (question.questionType === "MULTIPLE_CHOICE" ||
      question.questionType === "TRUE_FALSE")
  ) {
    const options = Array.isArray(question.options)
      ? question.options
      : JSON.parse(question.options)

    options.forEach((option: any, index: number) => {
      if (index < 5) {
        row[`Option ${index + 1}`] = option.text || ""
        row[`Option ${index + 1} Correct`] = option.isCorrect ? "TRUE" : "FALSE"
      }
    })
  }

  // Fill remaining option columns
  for (let i = 1; i <= 5; i++) {
    if (!row[`Option ${i}`]) {
      row[`Option ${i}`] = ""
      row[`Option ${i} Correct`] = ""
    }
  }

  return row
}

/**
 * Parse CSV row to question data
 */
export function parseCSVRowToQuestion(
  row: QuestionCSVRow,
  schoolId: string,
  subjectId: string,
  createdBy: string
): any {
  const questionData: any = {
    schoolId,
    subjectId,
    questionText: row["Question Text"],
    questionType: row["Question Type"],
    difficulty: row.Difficulty,
    bloomLevel: row["Bloom Level"],
    points: row.Points,
    timeEstimate: row["Time Estimate (minutes)"],
    source: "IMPORTED" as QuestionSource,
    createdBy,
    tags: row.Tags ? row.Tags.split(",").map((t) => t.trim()) : [],
    sampleAnswer: row["Sample Answer"] || null,
    gradingRubric: row["Grading Rubric"] || null,
    explanation: row.Explanation || null,
  }

  // Process options for MCQ/True-False
  if (
    row["Question Type"] === "MULTIPLE_CHOICE" ||
    row["Question Type"] === "TRUE_FALSE"
  ) {
    const options = []
    for (let i = 1; i <= 5; i++) {
      const optionText = row[`Option ${i}` as keyof QuestionCSVRow]
      const isCorrect = row[`Option ${i} Correct` as keyof QuestionCSVRow]

      if (optionText) {
        options.push({
          text: optionText,
          isCorrect: isCorrect || false,
        })
      }
    }

    if (options.length > 0) {
      questionData.options = JSON.stringify(options)
    }
  }

  // Process fill-in-blank answers
  if (row["Question Type"] === "FILL_BLANK" && row["Sample Answer"]) {
    questionData.options = JSON.stringify({
      acceptedAnswers: row["Sample Answer"].split("|").map((a) => a.trim()),
      caseSensitive: false,
    })
  }

  return questionData
}

/**
 * Generate CSV content from questions
 */
export function generateQuestionsCSV(questions: any[]): string {
  const rows = [QUESTION_CSV_HEADERS.join(",")]

  for (const question of questions) {
    const rowData = questionToCSVRow(question)
    const row = QUESTION_CSV_HEADERS.map((header) => {
      const value = rowData[header] || ""
      // Escape quotes and wrap in quotes if contains comma, newline, or quote
      if (value.includes(",") || value.includes("\n") || value.includes('"')) {
        return `"${value.replace(/"/g, '""')}"`
      }
      return value
    }).join(",")
    rows.push(row)
  }

  return rows.join("\n")
}

/**
 * Parse CSV content to questions
 */
export function parseQuestionsCSV(
  csvContent: string,
  schoolId: string,
  subjectId: string,
  createdBy: string
): {
  valid: any[]
  invalid: { row: number; errors: string[] }[]
} {
  const lines = csvContent.split("\n").map((line) => line.trim())
  const headers = lines[0].split(",").map((h) => h.trim())

  // Validate headers
  const expectedHeaders = QUESTION_CSV_HEADERS
  const missingHeaders = expectedHeaders.filter((h) => !headers.includes(h))

  if (missingHeaders.length > 0) {
    throw new Error(`Missing required headers: ${missingHeaders.join(", ")}`)
  }

  const valid: any[] = []
  const invalid: { row: number; errors: string[] }[] = []

  // Parse each data row
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i]) continue // Skip empty lines

    try {
      const values = parseCSVLine(lines[i])
      const rowData: Record<string, string> = {}

      headers.forEach((header, index) => {
        rowData[header] = values[index] || ""
      })

      // Validate and parse row
      const parsedRow = questionCSVRowSchema.parse(rowData)
      const questionData = parseCSVRowToQuestion(
        parsedRow,
        schoolId,
        subjectId,
        createdBy
      )

      valid.push(questionData)
    } catch (error) {
      const errors: string[] = []

      if (error instanceof z.ZodError) {
        errors.push(
          ...error.issues.map((e) => `${e.path.join(".")}: ${e.message}`)
        )
      } else if (error instanceof Error) {
        errors.push(error.message)
      } else {
        errors.push("Unknown error")
      }

      invalid.push({ row: i + 1, errors })
    }
  }

  return { valid, invalid }
}

/**
 * Parse a CSV line handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const values: string[] = []
  let currentValue = ""
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const nextChar = line[i + 1]

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        currentValue += '"'
        i++ // Skip next quote
      } else {
        // Toggle quote mode
        inQuotes = !inQuotes
      }
    } else if (char === "," && !inQuotes) {
      // End of value
      values.push(currentValue)
      currentValue = ""
    } else {
      currentValue += char
    }
  }

  // Add last value
  values.push(currentValue)

  return values
}

/**
 * Generate sample CSV template
 */
export function generateQuestionCSVTemplate(): string {
  const sampleRows = [
    {
      "Question Text": "What is the capital of France?",
      "Question Type": "MULTIPLE_CHOICE",
      Difficulty: "EASY",
      "Bloom Level": "REMEMBER",
      Points: "1",
      "Time Estimate (minutes)": "2",
      Subject: "Geography",
      Tags: "capitals, europe",
      "Option 1": "London",
      "Option 1 Correct": "FALSE",
      "Option 2": "Paris",
      "Option 2 Correct": "TRUE",
      "Option 3": "Berlin",
      "Option 3 Correct": "FALSE",
      "Option 4": "Madrid",
      "Option 4 Correct": "FALSE",
      "Option 5": "",
      "Option 5 Correct": "",
      "Sample Answer": "",
      "Grading Rubric": "",
      Explanation: "Paris is the capital and largest city of France.",
      Source: "MANUAL",
    },
    {
      "Question Text": "The Earth revolves around the Sun.",
      "Question Type": "TRUE_FALSE",
      Difficulty: "EASY",
      "Bloom Level": "REMEMBER",
      Points: "1",
      "Time Estimate (minutes)": "1",
      Subject: "Science",
      Tags: "solar system, astronomy",
      "Option 1": "True",
      "Option 1 Correct": "TRUE",
      "Option 2": "False",
      "Option 2 Correct": "FALSE",
      "Option 3": "",
      "Option 3 Correct": "",
      "Option 4": "",
      "Option 4 Correct": "",
      "Option 5": "",
      "Option 5 Correct": "",
      "Sample Answer": "",
      "Grading Rubric": "",
      Explanation:
        "The Earth completes one revolution around the Sun in approximately 365.25 days.",
      Source: "MANUAL",
    },
    {
      "Question Text": "Explain the water cycle in your own words.",
      "Question Type": "SHORT_ANSWER",
      Difficulty: "MEDIUM",
      "Bloom Level": "UNDERSTAND",
      Points: "5",
      "Time Estimate (minutes)": "5",
      Subject: "Science",
      Tags: "water cycle, weather",
      "Option 1": "",
      "Option 1 Correct": "",
      "Option 2": "",
      "Option 2 Correct": "",
      "Option 3": "",
      "Option 3 Correct": "",
      "Option 4": "",
      "Option 4 Correct": "",
      "Option 5": "",
      "Option 5 Correct": "",
      "Sample Answer":
        "The water cycle is the continuous movement of water through evaporation, condensation, precipitation, and collection.",
      "Grading Rubric":
        "Must mention: evaporation (2 pts), condensation (1 pt), precipitation (1 pt), collection (1 pt)",
      Explanation: "",
      Source: "MANUAL",
    },
  ]

  const rows = [QUESTION_CSV_HEADERS.join(",")]

  for (const sample of sampleRows) {
    const row = QUESTION_CSV_HEADERS.map((header) => {
      const value = sample[header] || ""
      if (value.includes(",") || value.includes("\n") || value.includes('"')) {
        return `"${value.replace(/"/g, '""')}"`
      }
      return value
    }).join(",")
    rows.push(row)
  }

  return rows.join("\n")
}

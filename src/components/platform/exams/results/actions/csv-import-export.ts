/**
 * CSV Import/Export for Exam Results
 *
 * Server actions for:
 * - Exporting exam results to CSV
 * - Importing exam results from CSV
 * - Bulk grade entry
 * - Analytics export
 */

"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { cacheKeys, gradeBoundaryCache } from "@/lib/cache/exam-cache"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

// Validation schemas
const exportResultsSchema = z.object({
  examId: z.string().min(1, "Exam ID is required"),
  includeAbsent: z.boolean().optional().default(false),
  includeAnalytics: z.boolean().optional().default(false),
  format: z.enum(["csv", "excel"]).optional().default("csv"),
})

const importResultsSchema = z.object({
  examId: z.string().min(1, "Exam ID is required"),
  csvContent: z.string().min(1, "CSV content is required"),
  validateOnly: z.boolean().optional().default(false),
  updateExisting: z.boolean().optional().default(false),
})

const exportAnalyticsSchema = z.object({
  examId: z.string().optional(),
  classId: z.string().optional(),
  subjectId: z.string().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  format: z.enum(["csv", "excel"]).optional().default("csv"),
})

// CSV Headers for results export/import
const RESULT_CSV_HEADERS = [
  "Student ID",
  "Student Name",
  "Class",
  "Subject",
  "Exam Title",
  "Exam Date",
  "Marks Obtained",
  "Total Marks",
  "Percentage",
  "Grade",
  "GPA",
  "Rank",
  "Pass/Fail",
  "Absent",
  "Remarks",
] as const

// Types
interface ExportData {
  csv: string
  filename: string
  rowCount: number
  metadata?: {
    examTitle: string
    className: string
    subjectName: string
    examDate: Date
  }
}

interface ImportResult {
  totalRows: number
  successCount: number
  errorCount: number
  updatedCount?: number
  errors: Array<{
    row: number
    studentId?: string
    errors: string[]
  }>
}

/**
 * Export exam results to CSV
 */
export async function exportExamResultsToCSV(
  input: z.infer<typeof exportResultsSchema>
): Promise<{ success: boolean; data?: ExportData; error?: string }> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const parsed = exportResultsSchema.parse(input)

    // Fetch exam with results
    const exam = await db.exam.findFirst({
      where: {
        id: parsed.examId,
        schoolId,
      },
      include: {
        class: {
          select: {
            name: true,
          },
        },
        subject: {
          select: {
            subjectName: true,
          },
        },
        examResults: {
          where: parsed.includeAbsent ? {} : { isAbsent: false },
          include: {
            student: {
              select: {
                studentId: true,
                givenName: true,
                middleName: true,
                surname: true,
              },
            },
          },
          orderBy: { marksObtained: "desc" },
        },
      },
    })

    if (!exam) {
      return { success: false, error: "Exam not found" }
    }

    if (exam.examResults.length === 0) {
      return { success: false, error: "No results found for this exam" }
    }

    // Get grade boundaries from cache
    const cacheKey = cacheKeys.gradeBoundaries(schoolId)
    let boundaries = gradeBoundaryCache.get(cacheKey)

    if (!boundaries) {
      boundaries = await db.gradeBoundary.findMany({
        where: { schoolId },
        orderBy: { minScore: "desc" },
      })

      if (boundaries.length > 0) {
        gradeBoundaryCache.set(cacheKey, boundaries)
      }
    }

    // Calculate ranks
    const resultsWithRank = exam.examResults.map((result, index) => {
      const boundary = boundaries?.find(
        (b) =>
          result.percentage >= Number(b.minScore) &&
          result.percentage <= Number(b.maxScore)
      )

      return {
        ...result,
        rank: result.isAbsent ? 0 : index + 1,
        gpa: boundary ? Number(boundary.gpaValue) : null,
      }
    })

    // Generate CSV content
    const rows = [RESULT_CSV_HEADERS.join(",")]

    for (const result of resultsWithRank) {
      const studentName = `${result.student.givenName} ${
        result.student.middleName || ""
      } ${result.student.surname}`.trim()

      const row = [
        result.student.studentId || "",
        `"${studentName}"`,
        `"${exam.class.name}"`,
        `"${exam.subject.subjectName}"`,
        `"${exam.title}"`,
        exam.examDate.toISOString().split("T")[0],
        result.marksObtained.toString(),
        result.totalMarks.toString(),
        result.percentage.toFixed(2),
        result.grade || "",
        result.gpa?.toString() || "",
        result.rank.toString(),
        result.marksObtained >= exam.passingMarks ? "Pass" : "Fail",
        result.isAbsent ? "Yes" : "No",
        result.remarks ? `"${result.remarks.replace(/"/g, '""')}"` : "",
      ].join(",")

      rows.push(row)
    }

    // Add analytics section if requested
    if (parsed.includeAnalytics) {
      rows.push("")
      rows.push("--- ANALYTICS ---")
      rows.push("")

      const passedCount = resultsWithRank.filter(
        (r) => !r.isAbsent && r.marksObtained >= exam.passingMarks
      ).length
      const presentCount = resultsWithRank.filter((r) => !r.isAbsent).length
      const avgMarks =
        presentCount > 0
          ? resultsWithRank
              .filter((r) => !r.isAbsent)
              .reduce((sum, r) => sum + r.marksObtained, 0) / presentCount
          : 0
      const avgPercentage =
        presentCount > 0
          ? resultsWithRank
              .filter((r) => !r.isAbsent)
              .reduce((sum, r) => sum + r.percentage, 0) / presentCount
          : 0

      rows.push(`Total Students,${exam.examResults.length}`)
      rows.push(`Present Students,${presentCount}`)
      rows.push(`Absent Students,${exam.examResults.length - presentCount}`)
      rows.push(`Passed Students,${passedCount}`)
      rows.push(`Failed Students,${presentCount - passedCount}`)
      rows.push(
        `Pass Percentage,${((passedCount / presentCount) * 100).toFixed(2)}%`
      )
      rows.push(`Average Marks,${avgMarks.toFixed(2)}/${exam.totalMarks}`)
      rows.push(`Average Percentage,${avgPercentage.toFixed(2)}%`)

      // Grade distribution
      rows.push("")
      rows.push("Grade Distribution")
      const gradeDistribution: Record<string, number> = {}
      resultsWithRank.forEach((r) => {
        if (!r.isAbsent && r.grade) {
          gradeDistribution[r.grade] = (gradeDistribution[r.grade] || 0) + 1
        }
      })

      Object.entries(gradeDistribution)
        .sort(([a], [b]) => a.localeCompare(b))
        .forEach(([grade, count]) => {
          rows.push(`${grade},${count}`)
        })
    }

    const csv = rows.join("\n")
    const timestamp = new Date().toISOString().split("T")[0]
    const filename = `exam_results_${exam.title.replace(
      /[^a-z0-9]/gi,
      "_"
    )}_${timestamp}.csv`

    return {
      success: true,
      data: {
        csv,
        filename,
        rowCount: exam.examResults.length,
        metadata: {
          examTitle: exam.title,
          className: exam.class.name,
          subjectName: exam.subject.subjectName,
          examDate: exam.examDate,
        },
      },
    }
  } catch (error) {
    console.error("Error exporting exam results:", error)

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Invalid export parameters",
      }
    }

    return {
      success: false,
      error: "Failed to export exam results",
    }
  }
}

/**
 * Import exam results from CSV
 */
export async function importExamResultsFromCSV(
  input: z.infer<typeof importResultsSchema>
): Promise<{ success: boolean; data?: ImportResult; error?: string }> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const parsed = importResultsSchema.parse(input)

    // Verify exam exists and belongs to school
    const exam = await db.exam.findFirst({
      where: {
        id: parsed.examId,
        schoolId,
      },
    })

    if (!exam) {
      return { success: false, error: "Exam not found" }
    }

    // Parse CSV content
    const lines = parsed.csvContent.split("\n").map((line) => line.trim())
    const headers = lines[0].split(",").map((h) => h.trim())

    // Validate headers
    const requiredHeaders = ["Student ID", "Marks Obtained", "Absent"]
    const missingHeaders = requiredHeaders.filter((h) => !headers.includes(h))

    if (missingHeaders.length > 0) {
      return {
        success: false,
        error: `Missing required headers: ${missingHeaders.join(", ")}`,
      }
    }

    const studentIdIndex = headers.indexOf("Student ID")
    const marksIndex = headers.indexOf("Marks Obtained")
    const absentIndex = headers.indexOf("Absent")
    const remarksIndex = headers.indexOf("Remarks")

    const importResults: ImportResult = {
      totalRows: lines.length - 1, // Exclude header
      successCount: 0,
      errorCount: 0,
      updatedCount: 0,
      errors: [],
    }

    // Process each row
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i]) continue // Skip empty lines

      const values = parseCSVLine(lines[i])
      const studentId = values[studentIdIndex]?.trim()
      const marksStr = values[marksIndex]?.trim()
      const absentStr = values[absentIndex]?.trim()
      const remarks = values[remarksIndex]?.trim()

      // Validate row data
      const rowErrors: string[] = []

      if (!studentId) {
        rowErrors.push("Student ID is required")
      }

      const marks = parseInt(marksStr)
      if (isNaN(marks) || marks < 0 || marks > exam.totalMarks) {
        rowErrors.push(
          `Invalid marks: must be between 0 and ${exam.totalMarks}`
        )
      }

      const isAbsent = ["yes", "true", "1"].includes(absentStr.toLowerCase())

      if (rowErrors.length > 0) {
        importResults.errors.push({
          row: i + 1,
          studentId,
          errors: rowErrors,
        })
        importResults.errorCount++
        continue
      }

      // Find student
      const student = await db.student.findFirst({
        where: {
          schoolId,
          studentId,
        },
      })

      if (!student) {
        importResults.errors.push({
          row: i + 1,
          studentId,
          errors: ["Student not found"],
        })
        importResults.errorCount++
        continue
      }

      // Validate only mode
      if (parsed.validateOnly) {
        importResults.successCount++
        continue
      }

      // Check if result already exists
      const existingResult = await db.examResult.findUnique({
        where: {
          examId_studentId: {
            examId: exam.id,
            studentId: student.id,
          },
        },
      })

      try {
        if (existingResult) {
          if (parsed.updateExisting) {
            // Update existing result
            await db.examResult.update({
              where: {
                id: existingResult.id,
              },
              data: {
                marksObtained: marks,
                percentage: (marks / exam.totalMarks) * 100,
                grade: calculateGrade(marks, exam.totalMarks),
                isAbsent,
                remarks,
              },
            })
            importResults.updatedCount = (importResults.updatedCount || 0) + 1
          } else {
            importResults.errors.push({
              row: i + 1,
              studentId,
              errors: [
                "Result already exists. Set updateExisting=true to update",
              ],
            })
            importResults.errorCount++
            continue
          }
        } else {
          // Create new result
          await db.examResult.create({
            data: {
              schoolId,
              examId: exam.id,
              studentId: student.id,
              marksObtained: marks,
              totalMarks: exam.totalMarks,
              percentage: (marks / exam.totalMarks) * 100,
              grade: calculateGrade(marks, exam.totalMarks),
              isAbsent,
              remarks,
            },
          })
          importResults.successCount++
        }
      } catch (error) {
        importResults.errors.push({
          row: i + 1,
          studentId,
          errors: [`Database error: ${error}`],
        })
        importResults.errorCount++
      }
    }

    // Revalidate the results page
    if (!parsed.validateOnly && importResults.successCount > 0) {
      revalidatePath(`/exams/${exam.id}/results`)
    }

    return {
      success: true,
      data: importResults,
    }
  } catch (error) {
    console.error("Error importing exam results:", error)

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Invalid import parameters",
      }
    }

    return {
      success: false,
      error: "Failed to import exam results",
    }
  }
}

/**
 * Generate CSV template for result import
 */
export async function generateResultImportTemplate(examId: string): Promise<{
  success: boolean
  data?: { csv: string; filename: string }
  error?: string
}> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    // Get exam details
    const exam = await db.exam.findFirst({
      where: {
        id: examId,
        schoolId,
      },
      include: {
        class: {
          include: {
            studentClasses: {
              include: {
                student: true,
              },
            },
          },
        },
        subject: true,
      },
    })

    if (!exam) {
      return { success: false, error: "Exam not found" }
    }

    // Generate template with student list
    const rows = [
      "Student ID,Student Name,Marks Obtained,Absent,Remarks",
      `# Exam: ${exam.title}`,
      `# Class: ${exam.class.name}`,
      `# Subject: ${exam.subject.subjectName}`,
      `# Total Marks: ${exam.totalMarks}`,
      `# Passing Marks: ${exam.passingMarks}`,
      "",
    ]

    // Add student rows
    for (const sc of exam.class.studentClasses) {
      const studentName =
        `${sc.student.givenName} ${sc.student.middleName || ""} ${
          sc.student.surname
        }`.trim()

      rows.push(`${sc.student.studentId || ""},"${studentName}",0,No,`)
    }

    const csv = rows.join("\n")
    const filename = `result_import_template_${exam.title.replace(/[^a-z0-9]/gi, "_")}.csv`

    return {
      success: true,
      data: {
        csv,
        filename,
      },
    }
  } catch (error) {
    console.error("Error generating template:", error)
    return {
      success: false,
      error: "Failed to generate template",
    }
  }
}

/**
 * Helper: Parse CSV line handling quotes
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
        currentValue += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === "," && !inQuotes) {
      values.push(currentValue)
      currentValue = ""
    } else {
      currentValue += char
    }
  }

  values.push(currentValue)
  return values
}

/**
 * Helper: Calculate grade based on percentage
 */
function calculateGrade(marks: number, totalMarks: number): string {
  const percentage = (marks / totalMarks) * 100

  if (percentage >= 90) return "A+"
  if (percentage >= 80) return "A"
  if (percentage >= 70) return "B+"
  if (percentage >= 60) return "B"
  if (percentage >= 50) return "C+"
  if (percentage >= 40) return "C"
  if (percentage >= 30) return "D"
  return "F"
}

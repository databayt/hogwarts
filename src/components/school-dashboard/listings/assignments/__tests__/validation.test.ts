import { describe, expect, it } from "vitest"
import { z } from "zod"

// Assignments validation schema tests
describe("Assignment Validation Schemas", () => {
  const assignmentBaseSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(),
    classId: z.string().min(1, "Class is required"),
    subjectId: z.string().min(1, "Subject is required"),
    teacherId: z.string().optional(),
    dueDate: z.string().min(1, "Due date is required"),
    maxScore: z.number().positive().default(100),
    weight: z.number().min(0).max(100).optional(), // Percentage weight
    type: z
      .enum([
        "HOMEWORK",
        "PROJECT",
        "QUIZ",
        "TEST",
        "LAB",
        "PRESENTATION",
        "OTHER",
      ])
      .default("HOMEWORK"),
    status: z.enum(["DRAFT", "PUBLISHED", "CLOSED", "GRADED"]).default("DRAFT"),
    instructions: z.string().optional(),
    attachments: z.array(z.string()).optional(),
    allowLateSubmission: z.boolean().default(false),
    latePenaltyPercent: z.number().min(0).max(100).optional(),
  })

  const assignmentCreateSchema = assignmentBaseSchema

  const assignmentUpdateSchema = assignmentBaseSchema.partial().extend({
    id: z.string().min(1, "ID is required"),
  })

  const submissionSchema = z
    .object({
      assignmentId: z.string().min(1, "Assignment is required"),
      studentId: z.string().min(1, "Student is required"),
      content: z.string().optional(),
      attachments: z.array(z.string()).optional(),
      submittedAt: z.string().optional(),
    })
    .refine(
      (data) =>
        data.content || (data.attachments && data.attachments.length > 0),
      {
        message: "Either content or attachments are required",
      }
    )

  const gradeSubmissionSchema = z.object({
    submissionId: z.string().min(1, "Submission is required"),
    score: z.number().min(0),
    feedback: z.string().optional(),
    gradedBy: z.string().optional(),
  })

  describe("assignmentCreateSchema", () => {
    it("validates complete assignment data", () => {
      const validData = {
        title: "Math Homework #1",
        description: "Complete exercises 1-20",
        classId: "class-123",
        subjectId: "subject-123",
        teacherId: "teacher-123",
        dueDate: "2024-09-20T23:59:00",
        maxScore: 100,
        weight: 10,
        type: "HOMEWORK",
        status: "PUBLISHED",
        instructions: "Show your work for each problem",
        allowLateSubmission: true,
        latePenaltyPercent: 10,
      }

      const result = assignmentCreateSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it("requires title, classId, subjectId, and dueDate", () => {
      const missingTitle = {
        classId: "class-123",
        subjectId: "subject-123",
        dueDate: "2024-09-20",
      }

      const missingDueDate = {
        title: "Assignment",
        classId: "class-123",
        subjectId: "subject-123",
      }

      expect(assignmentCreateSchema.safeParse(missingTitle).success).toBe(false)
      expect(assignmentCreateSchema.safeParse(missingDueDate).success).toBe(
        false
      )
    })

    it("validates assignment type enum", () => {
      const validTypes = [
        "HOMEWORK",
        "PROJECT",
        "QUIZ",
        "TEST",
        "LAB",
        "PRESENTATION",
        "OTHER",
      ]

      validTypes.forEach((type) => {
        const data = {
          title: "Assignment",
          classId: "c1",
          subjectId: "s1",
          dueDate: "2024-09-20",
          type,
        }
        expect(assignmentCreateSchema.safeParse(data).success).toBe(true)
      })
    })

    it("validates status enum", () => {
      const validStatuses = ["DRAFT", "PUBLISHED", "CLOSED", "GRADED"]

      validStatuses.forEach((status) => {
        const data = {
          title: "Assignment",
          classId: "c1",
          subjectId: "s1",
          dueDate: "2024-09-20",
          status,
        }
        expect(assignmentCreateSchema.safeParse(data).success).toBe(true)
      })
    })

    it("validates weight percentage range", () => {
      const validWeight = {
        title: "Assignment",
        classId: "c1",
        subjectId: "s1",
        dueDate: "2024-09-20",
        weight: 25,
      }

      const invalidWeight = {
        title: "Assignment",
        classId: "c1",
        subjectId: "s1",
        dueDate: "2024-09-20",
        weight: 150, // Over 100%
      }

      expect(assignmentCreateSchema.safeParse(validWeight).success).toBe(true)
      expect(assignmentCreateSchema.safeParse(invalidWeight).success).toBe(
        false
      )
    })

    it("applies defaults", () => {
      const minimal = {
        title: "Assignment",
        classId: "c1",
        subjectId: "s1",
        dueDate: "2024-09-20",
      }

      const result = assignmentCreateSchema.parse(minimal)
      expect(result.maxScore).toBe(100)
      expect(result.type).toBe("HOMEWORK")
      expect(result.status).toBe("DRAFT")
      expect(result.allowLateSubmission).toBe(false)
    })
  })

  describe("assignmentUpdateSchema", () => {
    it("requires id for updates", () => {
      const withoutId = {
        title: "Updated Assignment",
      }

      const result = assignmentUpdateSchema.safeParse(withoutId)
      expect(result.success).toBe(false)
    })

    it("allows partial updates with id", () => {
      const partialUpdate = {
        id: "assignment-123",
        status: "CLOSED",
        allowLateSubmission: false,
      }

      const result = assignmentUpdateSchema.safeParse(partialUpdate)
      expect(result.success).toBe(true)
    })
  })

  describe("submissionSchema", () => {
    it("validates submission with content", () => {
      const validData = {
        assignmentId: "assignment-123",
        studentId: "student-123",
        content: "Here is my solution...",
        submittedAt: "2024-09-19T15:30:00",
      }

      const result = submissionSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it("validates submission with attachments", () => {
      const validData = {
        assignmentId: "assignment-123",
        studentId: "student-123",
        attachments: ["file1.pdf", "file2.docx"],
      }

      const result = submissionSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it("requires either content or attachments", () => {
      const emptySubmission = {
        assignmentId: "assignment-123",
        studentId: "student-123",
      }

      const result = submissionSchema.safeParse(emptySubmission)
      expect(result.success).toBe(false)
    })

    it("requires assignmentId and studentId", () => {
      const missingAssignment = {
        studentId: "student-123",
        content: "Solution",
      }

      const missingStudent = {
        assignmentId: "assignment-123",
        content: "Solution",
      }

      expect(submissionSchema.safeParse(missingAssignment).success).toBe(false)
      expect(submissionSchema.safeParse(missingStudent).success).toBe(false)
    })
  })

  describe("gradeSubmissionSchema", () => {
    it("validates grading data", () => {
      const validData = {
        submissionId: "submission-123",
        score: 85,
        feedback: "Good work! Consider reviewing section 3.",
        gradedBy: "teacher-123",
      }

      const result = gradeSubmissionSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it("requires submissionId and non-negative score", () => {
      const missingSubmission = {
        score: 85,
      }

      const negativeScore = {
        submissionId: "submission-123",
        score: -10,
      }

      expect(gradeSubmissionSchema.safeParse(missingSubmission).success).toBe(
        false
      )
      expect(gradeSubmissionSchema.safeParse(negativeScore).success).toBe(false)
    })

    it("accepts zero score", () => {
      const zeroScore = {
        submissionId: "submission-123",
        score: 0,
        feedback: "No submission received",
      }

      const result = gradeSubmissionSchema.safeParse(zeroScore)
      expect(result.success).toBe(true)
    })
  })
})

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"

const h = vi.hoisted(() => ({
  canAccessStudent: vi.fn(),
  getAssignmentsForStudent: vi.fn(),
  getAssignmentList: vi.fn(),
  teachesClass: vi.fn(),
  getStudentSubmission: vi.fn(),
  submitAssignmentCore: vi.fn(),
  gradeSubmissionCore: vi.fn(),
}))

vi.mock("@/lib/db", () => ({
  db: {
    student: { findFirst: vi.fn() },
    teacher: { findFirst: vi.fn() },
    studentClass: { findFirst: vi.fn() },
    schoolAssignment: { findFirst: vi.fn() },
    assignmentSubmission: { findMany: vi.fn(), count: vi.fn() },
  },
}))
vi.mock("@/app/api/mobile/lib/authenticate", () => ({
  authenticate: vi.fn(),
  isAuthError: (r: unknown) => r instanceof NextResponse,
}))
vi.mock("@/app/api/mobile/lib/student-access", () => ({
  canAccessStudent: h.canAccessStudent,
}))
vi.mock(
  "@/components/school-dashboard/listings/assignments/my-assignments",
  () => ({ getAssignmentsForStudent: h.getAssignmentsForStudent })
)
vi.mock("@/components/school-dashboard/listings/assignments/queries", () => ({
  assignmentListSelect: {},
  getAssignmentList: h.getAssignmentList,
  teachesClass: h.teachesClass,
}))
vi.mock(
  "@/components/school-dashboard/listings/assignments/submit-core",
  async (importOriginal) => {
    const real =
      await importOriginal<
        typeof import("@/components/school-dashboard/listings/assignments/submit-core")
      >()
    return {
      submitAssignmentSchema: real.submitAssignmentSchema,
      getStudentSubmission: h.getStudentSubmission,
      submitAssignmentCore: h.submitAssignmentCore,
    }
  }
)
vi.mock(
  "@/components/school-dashboard/listings/assignments/grade-core",
  () => ({ gradeSubmissionCore: h.gradeSubmissionCore })
)
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

const SCHOOL = "school-1"
const USER = "user-1"
const BUCKET = "hogwarts-test"

async function authAs(role: string) {
  const auth = await import("@/app/api/mobile/lib/authenticate")
  vi.mocked(auth.authenticate).mockResolvedValue({
    userId: USER,
    email: "u@e.com",
    schoolId: SCHOOL,
    role,
  })
}

const req = (path: string, init?: RequestInit) =>
  new NextRequest(`http://localhost/api/mobile/assignments${path}`, {
    ...init,
    headers: { Authorization: "Bearer test" },
  })

const ctx = <T extends object>(p: T) => ({ params: Promise.resolve(p) })

const assignmentRow = (extra: Record<string, unknown> = {}) => ({
  id: "a1",
  classId: "class-1",
  title: "Essay",
  description: "Write",
  instructions: null,
  type: "HOMEWORK",
  status: "PUBLISHED",
  totalPoints: 20,
  weight: 1,
  dueDate: new Date("2030-01-01T00:00:00Z"),
  publishDate: null,
  createdAt: new Date("2026-09-01T00:00:00Z"),
  class: {
    id: "class-1",
    name: "10A",
    teacher: { id: "t1", firstName: "T", lastName: "One" },
    subject: { id: "sub", name: "Arabic" },
  },
  _count: { submissions: 3 },
  ...extra,
})

const submission = {
  id: "sub-1",
  status: "SUBMITTED",
  submittedAt: new Date("2026-09-10T00:00:00Z"),
  content: "done",
  attachments: [],
  score: null,
  feedback: null,
  gradedAt: null,
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubEnv("AWS_S3_BUCKET", BUCKET)
})

describe("GET /api/mobile/assignments", () => {
  it("401 when unauthenticated", async () => {
    const auth = await import("@/app/api/mobile/lib/authenticate")
    vi.mocked(auth.authenticate).mockResolvedValue(
      NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    )
    const { GET } = await import("@/app/api/mobile/assignments/route")
    expect((await GET(req(""))).status).toBe(401)
  })

  it("student: own class assignments with submission status, paginated", async () => {
    await authAs("STUDENT")
    vi.mocked(db.student.findFirst).mockResolvedValue({ id: "stu-1" } as never)
    h.getAssignmentsForStudent.mockResolvedValue([
      {
        id: "a1",
        title: "Essay",
        description: null,
        instructions: null,
        type: "HOMEWORK",
        status: "PUBLISHED",
        totalPoints: 20,
        dueDate: new Date("2030-01-01T00:00:00Z"),
        classId: "class-1",
        className: "10A",
        subjectName: "Arabic",
        submission,
      },
    ])
    const { GET } = await import("@/app/api/mobile/assignments/route")
    const body = await (await GET(req("?page=1&per_page=10"))).json()
    expect(h.getAssignmentsForStudent).toHaveBeenCalledWith(SCHOOL, "stu-1")
    expect(body).toMatchObject({ total: 1, page: 1, per_page: 10 })
    expect(body.data[0]).toMatchObject({
      id: "a1",
      total_points: 20,
      class_name: "10A",
      subject_name: "Arabic",
      is_overdue: false,
      submission: { id: "sub-1", status: "SUBMITTED", attachments: [] },
    })
  })

  it("guardian: 400 without student_id, 403 for a child not theirs", async () => {
    await authAs("GUARDIAN")
    const { GET } = await import("@/app/api/mobile/assignments/route")
    expect((await GET(req(""))).status).toBe(400)
    h.canAccessStudent.mockResolvedValue(false)
    expect((await GET(req("?student_id=stu-9"))).status).toBe(403)
    expect(h.getAssignmentsForStudent).not.toHaveBeenCalled()
  })

  it("guardian: lists a linked child's assignments", async () => {
    await authAs("GUARDIAN")
    h.canAccessStudent.mockResolvedValue(true)
    h.getAssignmentsForStudent.mockResolvedValue([])
    const { GET } = await import("@/app/api/mobile/assignments/route")
    const res = await GET(req("?student_id=stu-2"))
    expect(res.status).toBe(200)
    expect(h.getAssignmentsForStudent).toHaveBeenCalledWith(SCHOOL, "stu-2")
  })

  it("teacher: only classes they teach (teacherId filter)", async () => {
    await authAs("TEACHER")
    vi.mocked(db.teacher.findFirst).mockResolvedValue({ id: "t1" } as never)
    h.getAssignmentList.mockResolvedValue({ rows: [assignmentRow()], count: 1 })
    const { GET } = await import("@/app/api/mobile/assignments/route")
    const body = await (await GET(req("?status=PUBLISHED"))).json()
    expect(h.getAssignmentList).toHaveBeenCalledWith(SCHOOL, {
      status: "PUBLISHED",
      teacherId: "t1",
      page: 1,
      perPage: 20,
    })
    expect(body.data[0]).toMatchObject({
      id: "a1",
      teacher_name: "T One",
      submissions_count: 3,
    })
  })

  it("admin: whole school, no teacher filter; 400 on a bad status", async () => {
    await authAs("ADMIN")
    h.getAssignmentList.mockResolvedValue({ rows: [], count: 0 })
    const { GET } = await import("@/app/api/mobile/assignments/route")
    await GET(req(""))
    expect(h.getAssignmentList).toHaveBeenCalledWith(SCHOOL, {
      page: 1,
      perPage: 20,
    })
    expect((await GET(req("?status=NOPE"))).status).toBe(400)
  })

  it("403 for roles with no assignments view", async () => {
    await authAs("ACCOUNTANT")
    const { GET } = await import("@/app/api/mobile/assignments/route")
    expect((await GET(req(""))).status).toBe(403)
  })
})

describe("GET /api/mobile/assignments/:id", () => {
  it("404 for another school's assignment (lookup scoped by schoolId)", async () => {
    await authAs("ADMIN")
    vi.mocked(db.schoolAssignment.findFirst).mockResolvedValue(null)
    const { GET } = await import("@/app/api/mobile/assignments/[id]/route")
    const res = await GET(req("/a1"), ctx({ id: "a1" }))
    expect(res.status).toBe(404)
    expect(db.schoolAssignment.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "a1", schoolId: SCHOOL, wizardStep: null },
      })
    )
  })

  it("403 for a teacher who does not teach the class", async () => {
    await authAs("TEACHER")
    vi.mocked(db.schoolAssignment.findFirst).mockResolvedValue(
      assignmentRow() as never
    )
    vi.mocked(db.teacher.findFirst).mockResolvedValue({ id: "t2" } as never)
    h.teachesClass.mockResolvedValue(false)
    const { GET } = await import("@/app/api/mobile/assignments/[id]/route")
    expect((await GET(req("/a1"), ctx({ id: "a1" }))).status).toBe(403)
    expect(h.teachesClass).toHaveBeenCalledWith(SCHOOL, "t2", "class-1")
  })

  it("student: 404 on a draft, 403 when not in the class", async () => {
    await authAs("STUDENT")
    vi.mocked(db.student.findFirst).mockResolvedValue({ id: "stu-1" } as never)
    const { GET } = await import("@/app/api/mobile/assignments/[id]/route")

    vi.mocked(db.schoolAssignment.findFirst).mockResolvedValue(
      assignmentRow({ status: "DRAFT" }) as never
    )
    expect((await GET(req("/a1"), ctx({ id: "a1" }))).status).toBe(404)

    vi.mocked(db.schoolAssignment.findFirst).mockResolvedValue(
      assignmentRow() as never
    )
    vi.mocked(db.studentClass.findFirst).mockResolvedValue(null)
    expect((await GET(req("/a1"), ctx({ id: "a1" }))).status).toBe(403)
  })

  it("student: assignment + own submission, no classmates' count", async () => {
    await authAs("STUDENT")
    vi.mocked(db.student.findFirst).mockResolvedValue({ id: "stu-1" } as never)
    vi.mocked(db.schoolAssignment.findFirst).mockResolvedValue(
      assignmentRow() as never
    )
    vi.mocked(db.studentClass.findFirst).mockResolvedValue({
      id: "sc",
    } as never)
    h.getStudentSubmission.mockResolvedValue(submission)
    const { GET } = await import("@/app/api/mobile/assignments/[id]/route")
    const body = await (await GET(req("/a1"), ctx({ id: "a1" }))).json()
    expect(body).toMatchObject({
      id: "a1",
      title: "Essay",
      submission: { id: "sub-1", status: "SUBMITTED" },
    })
    expect(body.submissions_count).toBeUndefined()
    expect(h.getStudentSubmission).toHaveBeenCalledWith(SCHOOL, "stu-1", "a1")
  })
})

describe("POST /api/mobile/assignments/:id/submissions", () => {
  const post = (body: unknown) =>
    req("/a1/submissions", { method: "POST", body: JSON.stringify(body) })

  it("403 for non-students", async () => {
    await authAs("TEACHER")
    const { POST } =
      await import("@/app/api/mobile/assignments/[id]/submissions/route")
    expect((await POST(post({ content: "x" }), ctx({ id: "a1" }))).status).toBe(
      403
    )
  })

  it("400 for an attachment outside this school's storage", async () => {
    await authAs("STUDENT")
    const { POST } =
      await import("@/app/api/mobile/assignments/[id]/submissions/route")
    const res = await POST(
      post({
        attachments: [
          `https://${BUCKET}.s3.us-east-1.amazonaws.com/uploads/other-school/x.pdf`,
        ],
      }),
      ctx({ id: "a1" })
    )
    expect(res.status).toBe(400)
    const evil = await POST(
      post({ attachments: ["https://evil.example.com/x.pdf"] }),
      ctx({ id: "a1" })
    )
    expect(evil.status).toBe(400)
    expect(h.submitAssignmentCore).not.toHaveBeenCalled()
  })

  it("maps core refusals to statuses", async () => {
    await authAs("STUDENT")
    const { POST } =
      await import("@/app/api/mobile/assignments/[id]/submissions/route")
    h.submitAssignmentCore.mockResolvedValue({ status: "alreadyGraded" })
    const res = await POST(post({ content: "x" }), ctx({ id: "a1" }))
    expect(res.status).toBe(409)
    expect(await res.json()).toEqual({ error: "ALREADY_GRADED" })
    h.submitAssignmentCore.mockResolvedValue({ status: "notInClass" })
    expect((await POST(post({ content: "x" }), ctx({ id: "a1" }))).status).toBe(
      403
    )
  })

  it("201 with the stored submission", async () => {
    await authAs("STUDENT")
    const url = `https://${BUCKET}.s3.us-east-1.amazonaws.com/uploads/${SCHOOL}/assignment/1_a.pdf`
    h.submitAssignmentCore.mockResolvedValue({
      status: "submitted",
      submissionStatus: "SUBMITTED",
    })
    vi.mocked(db.student.findFirst).mockResolvedValue({ id: "stu-1" } as never)
    h.getStudentSubmission.mockResolvedValue({
      ...submission,
      attachments: [url],
    })
    const { POST } =
      await import("@/app/api/mobile/assignments/[id]/submissions/route")
    const res = await POST(
      post({ content: " done ", attachments: [url] }),
      ctx({ id: "a1" })
    )
    expect(res.status).toBe(201)
    expect(h.submitAssignmentCore).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: USER,
        schoolId: SCHOOL,
        assignmentId: "a1",
        content: "done",
        attachments: [url],
      })
    )
    expect((await res.json()).attachments).toEqual([url])
  })
})

describe("GET /api/mobile/assignments/:id/submissions", () => {
  it("403 for a student", async () => {
    await authAs("STUDENT")
    const { GET } =
      await import("@/app/api/mobile/assignments/[id]/submissions/route")
    expect((await GET(req("/a1/submissions"), ctx({ id: "a1" }))).status).toBe(
      403
    )
  })

  it("teacher of the class: paginated submissions scoped by school + assignment", async () => {
    await authAs("TEACHER")
    vi.mocked(db.schoolAssignment.findFirst).mockResolvedValue(
      assignmentRow() as never
    )
    vi.mocked(db.teacher.findFirst).mockResolvedValue({ id: "t1" } as never)
    h.teachesClass.mockResolvedValue(true)
    vi.mocked(db.assignmentSubmission.findMany).mockResolvedValue([
      {
        ...submission,
        score: 15,
        student: { id: "stu-1", firstName: "Sara", lastName: "Ali" },
      },
    ] as never)
    vi.mocked(db.assignmentSubmission.count).mockResolvedValue(1)
    const { GET } =
      await import("@/app/api/mobile/assignments/[id]/submissions/route")
    const body = await (
      await GET(req("/a1/submissions?status=SUBMITTED"), ctx({ id: "a1" }))
    ).json()
    expect(db.assignmentSubmission.count).toHaveBeenCalledWith({
      where: { schoolId: SCHOOL, assignmentId: "a1", status: "SUBMITTED" },
    })
    expect(body).toMatchObject({ total: 1, page: 1, per_page: 20 })
    expect(body.data[0]).toMatchObject({
      id: "sub-1",
      student_name: "Sara Ali",
      score: 15,
    })
  })
})

describe("PUT /api/mobile/assignments/:id/submissions/:submissionId", () => {
  const put = (body: unknown) =>
    req("/a1/submissions/sub-1", { method: "PUT", body: JSON.stringify(body) })
  const params = ctx({ id: "a1", submissionId: "sub-1" })

  beforeEach(() => {
    vi.mocked(db.schoolAssignment.findFirst).mockResolvedValue(
      assignmentRow() as never
    )
  })

  it("403 for a guardian", async () => {
    await authAs("GUARDIAN")
    const { PUT } =
      await import("@/app/api/mobile/assignments/[id]/submissions/[submissionId]/route")
    expect((await PUT(put({ score: 1 }), params)).status).toBe(403)
  })

  it("400 on a negative or missing score; 400 above total points", async () => {
    await authAs("ADMIN")
    const { PUT } =
      await import("@/app/api/mobile/assignments/[id]/submissions/[submissionId]/route")
    expect((await PUT(put({ score: -1 }), params)).status).toBe(400)
    expect((await PUT(put({}), params)).status).toBe(400)
    h.gradeSubmissionCore.mockResolvedValue({
      status: "scoreAboveTotal",
      totalPoints: 20,
    })
    const res = await PUT(put({ score: 25 }), params)
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({
      error: "SCORE_ABOVE_TOTAL",
      total_points: 20,
    })
  })

  it("404 when the submission is not on this assignment in this school", async () => {
    await authAs("ADMIN")
    h.gradeSubmissionCore.mockResolvedValue({ status: "notFound" })
    const { PUT } =
      await import("@/app/api/mobile/assignments/[id]/submissions/[submissionId]/route")
    expect((await PUT(put({ score: 5 }), params)).status).toBe(404)
  })

  it("grades through the shared core", async () => {
    await authAs("TEACHER")
    vi.mocked(db.teacher.findFirst).mockResolvedValue({ id: "t1" } as never)
    h.teachesClass.mockResolvedValue(true)
    const gradedAt = new Date("2026-09-14T10:00:00Z")
    h.gradeSubmissionCore.mockResolvedValue({
      status: "graded",
      submissionId: "sub-1",
      assignmentId: "a1",
      score: 18,
      totalPoints: 20,
      gradedAt,
    })
    const { PUT } =
      await import("@/app/api/mobile/assignments/[id]/submissions/[submissionId]/route")
    const res = await PUT(put({ score: 18, feedback: "Good" }), params)
    expect(res.status).toBe(200)
    expect(h.gradeSubmissionCore).toHaveBeenCalledWith({
      schoolId: SCHOOL,
      graderUserId: USER,
      assignmentId: "a1",
      submissionId: "sub-1",
      score: 18,
      feedback: "Good",
    })
    expect(await res.json()).toEqual({
      id: "sub-1",
      assignment_id: "a1",
      status: "GRADED",
      score: 18,
      total_points: 20,
      feedback: "Good",
      graded_at: gradedAt.toISOString(),
    })
  })
})

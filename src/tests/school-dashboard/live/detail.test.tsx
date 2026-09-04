// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Session detail: the attached exam/assignment resources must render as real
// links to the exam/assignment blocks (`/${lang}/exams/[id]`,
// `/${lang}/assignments/[id]`) — the same routes the room pre-join page
// already links to for the identical `ConferenceResource` rows — never a
// bare `<span>`, and never through the internal `/s/${subdomain}/` segment.

import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import type { Dictionary } from "@/components/internationalization/dictionaries"
import { LiveClassDetailContent } from "@/components/school-dashboard/live/detail"

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string
    children: React.ReactNode
    className?: string
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}))

const { getLiveClass } = vi.hoisted(() => ({ getLiveClass: vi.fn() }))
vi.mock("@/components/school-dashboard/live/actions/sessions", () => ({
  getLiveClass,
  endLiveClass: vi.fn(),
}))

vi.mock("@/lib/tenant-context", () => ({
  getTenantContext: vi.fn().mockResolvedValue({
    schoolId: "school-1",
    role: "ADMIN",
  }),
}))

vi.mock("@/auth", () => ({
  auth: vi.fn().mockResolvedValue({ user: { id: "user-1" } }),
}))

vi.mock("@/components/school-dashboard/live/actions/attendance-sync", () => ({
  describeAttendanceSync: vi.fn().mockReturnValue("disabled"),
}))

vi.mock("@/components/school-dashboard/live/queries", () => ({
  getAttendanceSyncEnabled: vi.fn().mockResolvedValue(false),
  getLessonReferenceContent: vi.fn().mockResolvedValue(null),
}))

vi.mock("@/components/school-dashboard/live/livekit/client", () => ({
  isRecordingConfigured: vi.fn().mockReturnValue(false),
}))

const dictionary = {} as unknown as Dictionary

function baseSession(overrides: Record<string, unknown> = {}) {
  return {
    id: "session-1",
    title: "Algebra review",
    status: "ended",
    scheduledStart: new Date("2026-01-05T09:00:00Z"),
    scheduledEnd: new Date("2026-01-05T09:45:00Z"),
    description: null,
    provider: "external",
    meetingUrl: null,
    visibility: "section",
    recordingEnabled: false,
    recordings: [],
    catalogLesson: null,
    catalogLessonId: null,
    section: null,
    subject: null,
    teacher: null,
    timetable: null,
    sectionId: null,
    resources: [],
    ...overrides,
  }
}

async function renderDetail(session: ReturnType<typeof baseSession>) {
  getLiveClass.mockResolvedValue({ success: true, data: session })
  const element = await LiveClassDetailContent({
    id: session.id as string,
    locale: "en",
    dictionary,
  })
  return render(element)
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("LiveClassDetailContent — attached exam/assignment resources", () => {
  it("renders an attached exam as a real link to /{lang}/exams/{id}, never a bare span", async () => {
    const session = baseSession({
      resources: [
        {
          id: "res-exam-1",
          url: null,
          title: null,
          schoolExam: {
            id: "exam-1",
            title: "Midterm quiz",
            examType: "QUIZ",
            examDate: new Date("2026-01-04T00:00:00Z"),
          },
          schoolAssignment: null,
        },
      ],
    })

    await renderDetail(session)

    const link = screen.getByRole("link", { name: "Midterm quiz" })
    expect(link).toHaveAttribute("href", "/en/exams/exam-1")
    // Never the internal file-system routing segment.
    expect(link.getAttribute("href")).not.toContain("/s/")
  })

  it("renders an attached assignment as a real link to /{lang}/assignments/{id}", async () => {
    const session = baseSession({
      resources: [
        {
          id: "res-assign-1",
          url: null,
          title: null,
          schoolExam: null,
          schoolAssignment: {
            id: "assign-1",
            title: "Essay draft",
            type: "HOMEWORK",
            dueDate: new Date("2026-01-06T00:00:00Z"),
          },
        },
      ],
    })

    await renderDetail(session)

    const link = screen.getByRole("link", { name: "Essay draft" })
    expect(link).toHaveAttribute("href", "/en/assignments/assign-1")
    expect(link.getAttribute("href")).not.toContain("/s/")
  })

  it("builds the exam/assignment links off the given locale, matching the room page's pattern", async () => {
    const session = baseSession({
      resources: [
        {
          id: "res-exam-1",
          url: null,
          title: null,
          schoolExam: {
            id: "exam-ar-1",
            title: "اختبار قصير",
            examType: "QUIZ",
            examDate: new Date("2026-01-04T00:00:00Z"),
          },
          schoolAssignment: null,
        },
      ],
    })
    getLiveClass.mockResolvedValue({ success: true, data: session })
    const element = await LiveClassDetailContent({
      id: session.id as string,
      locale: "ar",
      dictionary,
    })
    render(element)

    const link = screen.getByRole("link", { name: "اختبار قصير" })
    expect(link).toHaveAttribute("href", "/ar/exams/exam-ar-1")
  })
})

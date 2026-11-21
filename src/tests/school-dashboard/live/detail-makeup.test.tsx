// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Session detail, make-up class («حصة تعويضية»): the badge and the link back to
// the class it replaces, the «عُوّضت» link on a made-up class, and the
// plan / re-plan / cancel buttons — offered to the owner teacher and admins
// only. Students and guardians see the badge and the links.

import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import type { Dictionary } from "@/components/internationalization/dictionaries"
import { describeAttendanceSync } from "@/components/school-dashboard/live/actions/attendance-sync"
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

const h = vi.hoisted(() => ({
  readLiveClass: vi.fn(),
  tenant: vi.fn(),
  auth: vi.fn(),
}))

vi.mock("@/components/school-dashboard/live/actions/read-live-class", () => ({
  readLiveClass: h.readLiveClass,
}))
vi.mock("@/components/school-dashboard/live/actions/sessions", () => ({
  endLiveClass: vi.fn(),
}))
vi.mock("@/components/school-dashboard/live/actions/helpers", () => ({
  requireContext: vi.fn(),
}))
vi.mock("@/lib/school-name-format", () => ({
  schoolNameDisplay: vi.fn().mockResolvedValue("first-last"),
}))
vi.mock("@/lib/db", () => ({
  db: {
    school: { findUnique: vi.fn().mockResolvedValue({ timezone: "UTC" }) },
  },
}))
vi.mock("@/components/school-dashboard/live/attendance-review", () => ({
  AttendanceReview: () => null,
}))
vi.mock("@/components/school-dashboard/live/class-work", () => ({
  ClassWork: () => null,
}))
vi.mock("@/lib/tenant-context", () => ({ getTenantContext: h.tenant }))
vi.mock("@/auth", () => ({ auth: h.auth }))
vi.mock("@/components/school-dashboard/live/actions/attendance-sync", () => ({
  describeAttendanceSync: vi.fn().mockReturnValue("auto"),
}))
vi.mock("@/components/school-dashboard/live/queries", () => ({
  getAttendanceSyncEnabled: vi.fn().mockResolvedValue(true),
  getLessonReferenceContent: vi.fn().mockResolvedValue(null),
}))
vi.mock("@/components/school-dashboard/live/livekit/client", () => ({
  isRecordingConfigured: vi.fn().mockReturnValue(false),
}))
// The client islands have their own tests; here they are marked buttons.
vi.mock("@/components/school-dashboard/live/makeup-sheet", () => ({
  MakeupSheet: ({
    mode = "create",
    missedId,
    makeupId,
  }: {
    mode?: string
    missedId: string
    makeupId?: string
  }) => (
    <button
      type="button"
      data-testid={`sheet-${mode}`}
      data-missed-id={missedId}
      data-makeup-id={makeupId}
    >
      sheet-{mode}
    </button>
  ),
  CancelMakeupButton: ({ makeupId }: { makeupId: string }) => (
    <button type="button" data-testid="cancel-makeup" data-makeup-id={makeupId}>
      cancel
    </button>
  ),
}))

const dictionary = {
  liveClasses: {
    makeup: {
      badge: "Make-up",
      sheetTitle: "Make-up class",
      cta: "Make up this class",
      missedOn: "Missed on {date}",
      madeUp: "Made up on {date}",
      replacesNote: "Makes up the class of {date}",
    },
  },
} as unknown as Dictionary

function session(overrides: Record<string, unknown> = {}) {
  return {
    id: "session-1",
    title: "Algebra",
    status: "cancelled",
    scheduledStart: new Date("2026-11-10T09:00:00Z"),
    scheduledEnd: new Date("2026-11-10T09:45:00Z"),
    actualStart: null,
    isPractice: false,
    description: null,
    provider: "livekit",
    meetingUrl: null,
    visibility: "section",
    recordingEnabled: false,
    recordings: [],
    catalogLesson: null,
    catalogLessonId: null,
    section: { id: "sec-1", name: "7-A" },
    subject: { id: "sub-1", name: "Math" },
    sectionId: "sec-1",
    subjectId: "sub-1",
    teacher: {
      id: "t-1",
      userId: "teacher-user",
      firstName: "Sara",
      middleName: null,
      lastName: "Omar",
    },
    timetable: null,
    resources: [],
    makeupForId: null,
    makeupFor: null,
    makeups: [],
    ...overrides,
  }
}

async function renderAs(
  role: string,
  userId: string,
  data: ReturnType<typeof session>
) {
  h.tenant.mockResolvedValue({ schoolId: "school-1", role })
  h.auth.mockResolvedValue({ user: { id: userId } })
  h.readLiveClass.mockResolvedValue({ success: true, data })
  const element = await LiveClassDetailContent({
    id: data.id as string,
    locale: "en",
    dictionary,
    plain: true,
  })
  return render(element)
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("LiveClassDetailContent — make-up class", () => {
  it("badges a make-up and links to the class it replaces", async () => {
    await renderAs(
      "STUDENT",
      "student-user",
      session({
        id: "makeup-1",
        status: "ended",
        makeupForId: "missed-1",
        makeupFor: {
          id: "missed-1",
          title: "Algebra",
          scheduledStart: new Date("2026-11-10T09:00:00Z"),
        },
      })
    )

    expect(screen.getByText("Make-up class")).toBeInTheDocument()
    const link = screen.getByRole("link", { name: /Makes up the class of/ })
    expect(link).toHaveAttribute("href", "/en/live/missed-1")
    // Read-only for a student.
    expect(screen.queryByTestId("sheet-create")).toBeNull()
    expect(screen.queryByTestId("sheet-replan")).toBeNull()
    expect(screen.queryByTestId("cancel-makeup")).toBeNull()
  })

  it("links a made-up missed class to its make-up, and offers no second one", async () => {
    await renderAs(
      "TEACHER",
      "teacher-user",
      session({
        makeups: [
          {
            id: "makeup-1",
            scheduledStart: new Date("2026-11-12T09:00:00Z"),
            status: "ended",
          },
        ],
      })
    )

    const link = screen.getByRole("link", { name: /Made up on/ })
    expect(link).toHaveAttribute("href", "/en/live/makeup-1")
    expect(screen.queryByTestId("sheet-create")).toBeNull()
  })

  it("tells attendance a make-up replaces a class, so it is tied to that period", async () => {
    await renderAs(
      "TEACHER",
      "teacher-user",
      session({ id: "makeup-1", status: "ended", makeupForId: "missed-1" })
    )

    expect(describeAttendanceSync).toHaveBeenCalledWith(
      expect.objectContaining({ makeupForId: "missed-1" }),
      true
    )
  })

  it("offers the plan button on a missed class to its own teacher", async () => {
    await renderAs("TEACHER", "teacher-user", session())

    expect(screen.getByTestId("sheet-create")).toHaveAttribute(
      "data-missed-id",
      "session-1"
    )
  })

  it("offers it to an admin, never to another teacher, a student or a guardian", async () => {
    const { unmount } = await renderAs("ADMIN", "admin-user", session())
    expect(screen.getByTestId("sheet-create")).toBeInTheDocument()
    unmount()

    for (const [role, user] of [
      ["TEACHER", "other-teacher"],
      ["STUDENT", "student-user"],
      ["GUARDIAN", "guardian-user"],
    ] as const) {
      const view = await renderAs(role, user, session())
      expect(screen.queryByTestId("sheet-create")).toBeNull()
      view.unmount()
    }
  })

  it("does not offer a make-up of a class that actually ran", async () => {
    await renderAs(
      "TEACHER",
      "teacher-user",
      session({
        status: "ended",
        actualStart: new Date("2026-11-10T09:01:00Z"),
      })
    )
    expect(screen.queryByTestId("sheet-create")).toBeNull()
  })

  it("lets the owner re-plan or cancel a scheduled make-up, against the root class", async () => {
    await renderAs(
      "TEACHER",
      "teacher-user",
      session({
        id: "makeup-1",
        status: "scheduled",
        makeupForId: "missed-1",
        makeupFor: {
          id: "missed-1",
          title: "Algebra",
          scheduledStart: new Date("2026-11-10T09:00:00Z"),
        },
      })
    )

    const replan = screen.getByTestId("sheet-replan")
    expect(replan).toHaveAttribute("data-missed-id", "missed-1")
    expect(replan).toHaveAttribute("data-makeup-id", "makeup-1")
    expect(screen.getByTestId("cancel-makeup")).toHaveAttribute(
      "data-makeup-id",
      "makeup-1"
    )
    expect(screen.queryByTestId("sheet-create")).toBeNull()
  })
})

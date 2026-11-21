// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// The «حصص فائتة» shelf on /live: host roles only, and only when something
// is left to make up. Rows carry one button — the sheet's trigger.

import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { LiveMissedShelf } from "@/components/school-dashboard/live/landing/missed-shelf"
import type {
  LandingMissed,
  LandingViewer,
} from "@/components/school-dashboard/live/landing/types"
import { resolveLandingViewer } from "@/components/school-dashboard/live/landing/viewer"
import type { MakeupLabels } from "@/components/school-dashboard/live/makeup-badge"

// The sheet is a client island with its own tests; here it is only a button.
vi.mock("@/components/school-dashboard/live/makeup-sheet", () => ({
  MakeupSheet: ({
    missedId,
    labels,
  }: {
    missedId: string
    labels: MakeupLabels
  }) => (
    <button type="button" data-missed-id={missedId}>
      {labels.cta}
    </button>
  ),
}))

const labels = {
  cta: "عوّض الحصة",
  missedTitle: "حصص فائتة",
  missedOn: "فاتت يوم {date}",
} as unknown as MakeupLabels

const missed: LandingMissed[] = [
  {
    id: "c-1",
    title: "Math",
    subjectName: "الرياضيات",
    sectionName: "7-A",
    when: "الأحد، ٩ نوفمبر ٠٩:٤٠",
  },
  {
    id: "c-2",
    title: "Science",
    subjectName: null,
    sectionName: null,
    when: "الاثنين، ١٠ نوفمبر ١١:٠٠",
  },
]

const shelf = (viewer: LandingViewer, rows = missed) =>
  render(
    <LiveMissedShelf missed={rows} viewer={viewer} lang="ar" labels={labels} />
  )

describe("LiveMissedShelf", () => {
  it("shows a teacher the heading, each class and its make-up button", () => {
    shelf(resolveLandingViewer("TEACHER"))

    expect(
      screen.getByRole("heading", { name: "حصص فائتة" })
    ).toBeInTheDocument()
    expect(screen.getByText("الرياضيات · 7-A")).toBeInTheDocument()
    // No subject or section: the title stands in for the subject.
    expect(screen.getByText("Science")).toBeInTheDocument()
    expect(
      screen.getByText("فاتت يوم الأحد، ٩ نوفمبر ٠٩:٤٠")
    ).toBeInTheDocument()
    const buttons = screen.getAllByRole("button", { name: "عوّض الحصة" })
    expect(buttons.map((b) => b.getAttribute("data-missed-id"))).toEqual([
      "c-1",
      "c-2",
    ])
  })

  it("shows an admin the shelf too", () => {
    shelf(resolveLandingViewer("ADMIN"))
    expect(screen.getAllByRole("button", { name: "عوّض الحصة" })).toHaveLength(
      2
    )
  })

  it.each(["STUDENT", "GUARDIAN", "STAFF", "ACCOUNTANT"])(
    "is hidden from a %s, even if rows reach it",
    (role) => {
      const { container } = shelf(resolveLandingViewer(role))
      expect(container).toBeEmptyDOMElement()
    }
  )

  it("renders nothing when there is nothing to make up", () => {
    const { container } = shelf(resolveLandingViewer("TEACHER"), [])
    expect(container).toBeEmptyDOMElement()
  })
})

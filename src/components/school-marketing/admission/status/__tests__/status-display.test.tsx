// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import type { ApplicationStatus } from "../../types"
import StatusDisplay from "../status-display"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeStatus(
  overrides: Partial<ApplicationStatus> = {}
): ApplicationStatus {
  return {
    applicationNumber: overrides.applicationNumber ?? "APP-2026-00001",
    status: overrides.status ?? ("SUBMITTED" as any),
    currentStep: overrides.currentStep ?? {
      current: 2,
      total: 5,
      label: "Document Review",
    },
    timeline: overrides.timeline ?? [
      {
        status: "SUBMITTED" as any,
        label: "Application Submitted",
        date: new Date("2026-01-15"),
        completed: true,
        current: false,
      },
      {
        status: "UNDER_REVIEW" as any,
        label: "Under Review",
        completed: false,
        current: true,
      },
    ],
    checklist: overrides.checklist ?? [
      {
        id: "c1",
        label: "Birth Certificate",
        completed: true,
        required: true,
        type: "document",
      },
      {
        id: "c2",
        label: "Application Fee",
        completed: false,
        required: true,
        type: "payment",
      },
    ],
    nextSteps: overrides.nextSteps,
  }
}

const noop = vi.fn()

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("StatusDisplay", () => {
  // =========================================================================
  // STATUS_COLORS mapping
  // =========================================================================

  describe("STATUS_COLORS mapping", () => {
    it("applies correct color class for SUBMITTED status", () => {
      render(
        <StatusDisplay
          status={makeStatus({ status: "SUBMITTED" as any })}
          lang="en"
          onBack={noop}
        />
      )

      // The Badge should contain the amber classes for SUBMITTED
      const badge = screen.getByText("Submitted")
      expect(badge.className).toContain("bg-amber-100")
      expect(badge.className).toContain("text-amber-700")
    })

    it("applies correct color class for SELECTED status", () => {
      render(
        <StatusDisplay
          status={makeStatus({ status: "SELECTED" as any })}
          lang="en"
          onBack={noop}
        />
      )

      const badge = screen.getByText("Selected")
      expect(badge.className).toContain("bg-green-100")
      expect(badge.className).toContain("text-green-700")
    })

    it("applies correct color class for ADMITTED status", () => {
      render(
        <StatusDisplay
          status={makeStatus({ status: "ADMITTED" as any })}
          lang="en"
          onBack={noop}
        />
      )

      const badge = screen.getByText("Admitted")
      expect(badge.className).toContain("bg-emerald-100")
      expect(badge.className).toContain("text-emerald-700")
    })

    it("applies color for SHORTLISTED status", () => {
      render(
        <StatusDisplay
          status={makeStatus({ status: "SHORTLISTED" as any })}
          lang="en"
          onBack={noop}
        />
      )

      const badge = screen.getByText("Shortlisted")
      expect(badge.className).toContain("bg-indigo-100")
      expect(badge.className).toContain("text-indigo-700")
    })

    it("applies color for ENTRANCE_SCHEDULED status", () => {
      render(
        <StatusDisplay
          status={makeStatus({ status: "ENTRANCE_SCHEDULED" as any })}
          lang="en"
          onBack={noop}
        />
      )

      const badge = screen.getByText("Entrance Scheduled")
      expect(badge.className).toContain("bg-cyan-100")
      expect(badge.className).toContain("text-cyan-700")
    })

    it("falls back to default color for unknown status", () => {
      render(
        <StatusDisplay
          status={makeStatus({ status: "SOME_UNKNOWN_STATUS" as any })}
          lang="en"
          onBack={noop}
        />
      )

      // For unknown statuses, fallback text is the raw status value
      const badge = screen.getByText("SOME_UNKNOWN_STATUS")
      // Default fallback: bg-gray-100 text-gray-700
      expect(badge.className).toContain("bg-gray-100")
      expect(badge.className).toContain("text-gray-700")
    })
  })

  // =========================================================================
  // STATUS LABELS
  // =========================================================================

  describe("status labels", () => {
    it("shows 'Submitted' label for SUBMITTED status", () => {
      render(
        <StatusDisplay
          status={makeStatus({ status: "SUBMITTED" as any })}
          lang="en"
          onBack={noop}
        />
      )

      expect(screen.getByText("Submitted")).toBeInTheDocument()
    })

    it("shows 'Selected' label for SELECTED status", () => {
      render(
        <StatusDisplay
          status={makeStatus({ status: "SELECTED" as any })}
          lang="en"
          onBack={noop}
        />
      )

      expect(screen.getByText("Selected")).toBeInTheDocument()
    })

    it("shows 'Admitted' label for ADMITTED status", () => {
      render(
        <StatusDisplay
          status={makeStatus({ status: "ADMITTED" as any })}
          lang="en"
          onBack={noop}
        />
      )

      expect(screen.getByText("Admitted")).toBeInTheDocument()
    })

    it("shows 'Withdrawn' label for WITHDRAWN status", () => {
      render(
        <StatusDisplay
          status={makeStatus({ status: "WITHDRAWN" as any })}
          lang="en"
          onBack={noop}
        />
      )

      expect(screen.getByText("Withdrawn")).toBeInTheDocument()
    })

    it("falls back to raw status value if not in map", () => {
      render(
        <StatusDisplay
          status={makeStatus({ status: "CUSTOM_STATUS" as any })}
          lang="en"
          onBack={noop}
        />
      )

      expect(screen.getByText("CUSTOM_STATUS")).toBeInTheDocument()
    })
  })
})

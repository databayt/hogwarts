// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { ApplicationStatusBannerClient } from "../application-status-banner-client"

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeBannerApp(
  overrides: Partial<{
    id: string
    applicationNumber: string
    status: string
    campaignId: string
    applicationFeePaid: boolean
  }> = {}
) {
  return {
    id: overrides.id ?? "app-123",
    applicationNumber: overrides.applicationNumber ?? "APP-2026-00001",
    status: overrides.status ?? "SUBMITTED",
    campaignId: overrides.campaignId ?? "camp-456",
    applicationFeePaid: overrides.applicationFeePaid ?? false,
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("ApplicationStatusBannerClient", () => {
  const localStorageStore: Record<string, string> = {}

  beforeEach(() => {
    vi.clearAllMocks()
    // Clear our storage mock between tests
    for (const key of Object.keys(localStorageStore)) {
      delete localStorageStore[key]
    }
    // Provide a working localStorage stub for jsdom
    vi.stubGlobal("localStorage", {
      getItem: vi.fn((key: string) => localStorageStore[key] ?? null),
      setItem: vi.fn((key: string, value: string) => {
        localStorageStore[key] = value
      }),
      removeItem: vi.fn((key: string) => {
        delete localStorageStore[key]
      }),
    })
  })

  // =========================================================================
  // PAYMENT LINK URL
  // =========================================================================

  describe("payment link URL", () => {
    it("uses applicationId (not campaignId) in payment link for SELECTED+unpaid", () => {
      render(
        <ApplicationStatusBannerClient
          application={makeBannerApp({
            id: "app-123",
            campaignId: "camp-456",
            status: "SELECTED",
            applicationFeePaid: false,
          })}
          locale="en"
        />
      )

      const payLink = screen.getByRole("link", { name: /pay now/i })
      expect(payLink).toHaveAttribute(
        "href",
        expect.stringContaining("/application/app-123/payment")
      )
      expect(payLink).not.toHaveAttribute(
        "href",
        expect.stringContaining("camp-456")
      )
    })

    it("does not show payment link when applicationFeePaid is true", () => {
      render(
        <ApplicationStatusBannerClient
          application={makeBannerApp({
            status: "SELECTED",
            applicationFeePaid: true,
          })}
          locale="en"
        />
      )

      expect(
        screen.queryByRole("link", { name: /pay now/i })
      ).not.toBeInTheDocument()
    })

    it("does not show payment link for SUBMITTED status", () => {
      render(
        <ApplicationStatusBannerClient
          application={makeBannerApp({ status: "SUBMITTED" })}
          locale="en"
        />
      )

      expect(
        screen.queryByRole("link", { name: /pay now/i })
      ).not.toBeInTheDocument()
    })
  })

  // =========================================================================
  // STATUS MESSAGES
  // =========================================================================

  describe("status messages", () => {
    it("shows 'waiting for approval' for SUBMITTED", () => {
      render(
        <ApplicationStatusBannerClient
          application={makeBannerApp({ status: "SUBMITTED" })}
          locale="en"
        />
      )

      expect(screen.getByText(/waiting for approval/i)).toBeInTheDocument()
    })

    it("shows 'waiting for approval' for UNDER_REVIEW", () => {
      render(
        <ApplicationStatusBannerClient
          application={makeBannerApp({ status: "UNDER_REVIEW" })}
          locale="en"
        />
      )

      expect(screen.getByText(/waiting for approval/i)).toBeInTheDocument()
    })

    it("shows 'enrolled' for ADMITTED", () => {
      render(
        <ApplicationStatusBannerClient
          application={makeBannerApp({ status: "ADMITTED" })}
          locale="en"
        />
      )

      expect(screen.getByText(/enrolled/i)).toBeInTheDocument()
    })

    it("shows 'not accepted' for REJECTED", () => {
      render(
        <ApplicationStatusBannerClient
          application={makeBannerApp({ status: "REJECTED" })}
          locale="en"
        />
      )

      expect(screen.getByText(/not accepted/i)).toBeInTheDocument()
    })

    it("shows 'withdrawn' for WITHDRAWN", () => {
      render(
        <ApplicationStatusBannerClient
          application={makeBannerApp({ status: "WITHDRAWN" })}
          locale="en"
        />
      )

      expect(screen.getByText(/withdrawn/i)).toBeInTheDocument()
    })

    it("shows Arabic text when locale is 'ar'", () => {
      render(
        <ApplicationStatusBannerClient
          application={makeBannerApp({ status: "SUBMITTED" })}
          locale="ar"
        />
      )

      expect(screen.getByText(/بانتظار الموافقة/)).toBeInTheDocument()
      expect(screen.getByText(/طلب رقم/)).toBeInTheDocument()
    })
  })

  // =========================================================================
  // DISMISS BEHAVIOR
  // =========================================================================

  describe("dismiss behavior", () => {
    it("hides banner when dismiss button clicked", () => {
      const app = makeBannerApp({ status: "SUBMITTED" })

      const { container } = render(
        <ApplicationStatusBannerClient application={app} locale="en" />
      )

      // Banner is visible initially
      expect(screen.getByText(/waiting for approval/i)).toBeInTheDocument()

      // Click dismiss
      const dismissBtn = screen.getByRole("button", { name: /dismiss/i })
      fireEvent.click(dismissBtn)

      // Banner should be gone
      expect(
        screen.queryByText(/waiting for approval/i)
      ).not.toBeInTheDocument()

      // localStorage should record the dismissal
      expect(localStorageStore[`banner-dismissed-${app.id}`]).toBe("true")
    })
  })
})

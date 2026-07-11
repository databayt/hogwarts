// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { ApplicationStatusBannerClient } from "@/components/school-marketing/admission/application-status-banner-client"

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
  // OFFER LINK URL
  // =========================================================================
  //
  // The banner used to build its own `/application/{id}/payment` link
  // client-side — that route is dead (applying is free; retired 2026-06-12).
  // The server component now computes `offerUrl` (pointing at the offer page
  // with the access token) and only when the application is SELECTED with an
  // unexpired token; the client just renders the link when offerUrl is given.

  describe("offer link (Pay Now button)", () => {
    it("renders the Pay Now link using the server-provided offerUrl", () => {
      render(
        <ApplicationStatusBannerClient
          application={makeBannerApp({
            id: "app-123",
            campaignId: "camp-456",
            status: "SELECTED",
            applicationFeePaid: false,
          })}
          locale="en"
          offerUrl="/en/application/app-123/offer?token=abc123"
        />
      )

      const payLink = screen.getByRole("link", { name: /pay now/i })
      expect(payLink).toHaveAttribute(
        "href",
        "/en/application/app-123/offer?token=abc123"
      )
    })

    it("does not show the link when applicationFeePaid is true (even if offerUrl is present)", () => {
      render(
        <ApplicationStatusBannerClient
          application={makeBannerApp({
            status: "SELECTED",
            applicationFeePaid: true,
          })}
          locale="en"
          offerUrl="/en/application/app-123/offer?token=abc123"
        />
      )

      expect(
        screen.queryByRole("link", { name: /pay now/i })
      ).not.toBeInTheDocument()
    })

    it("does not show the link for SUBMITTED status (even if offerUrl is present)", () => {
      render(
        <ApplicationStatusBannerClient
          application={makeBannerApp({ status: "SUBMITTED" })}
          locale="en"
          offerUrl="/en/application/app-123/offer?token=abc123"
        />
      )

      expect(
        screen.queryByRole("link", { name: /pay now/i })
      ).not.toBeInTheDocument()
    })

    it("does not show the link for SELECTED+unpaid when offerUrl is absent (e.g. expired token)", () => {
      render(
        <ApplicationStatusBannerClient
          application={makeBannerApp({
            status: "SELECTED",
            applicationFeePaid: false,
          })}
          locale="en"
        />
      )

      expect(
        screen.queryByRole("link", { name: /pay now/i })
      ).not.toBeInTheDocument()
      // The status text itself should still render without the button.
      expect(
        screen.getByText(/approved, continue with payment/i)
      ).toBeInTheDocument()
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

    it("shows Arabic text when the server resolves Arabic messages", () => {
      // Banner copy is resolved server-side now (application-status-banner.tsx
      // picks Arabic strings when locale === "ar"); the client just renders
      // whatever `messages` it's given, so the test supplies the Arabic set
      // directly rather than relying on client-side locale branching.
      render(
        <ApplicationStatusBannerClient
          application={makeBannerApp({ status: "SUBMITTED" })}
          locale="ar"
          messages={{
            applicationLabel: "طلب رقم",
            waitingApproval: "بانتظار الموافقة",
          }}
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

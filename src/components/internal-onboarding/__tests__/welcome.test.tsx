// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * WelcomeStep Component Tests
 *
 * Tests for the internal onboarding welcome/success step:
 * - Renders title and description
 * - Reference code display and copy functionality
 * - WhatsApp share link generation
 * - Phone masking logic
 * - Conditional "Check your phone" step
 * - School contact info display
 */

import "@testing-library/jest-dom/vitest"

import { customRender } from "@/test/utils"
import { fireEvent, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { WelcomeStep } from "../steps/welcome"

// =============================================================================
// MOCKS
// =============================================================================

vi.mock("next/navigation", () => ({
  useParams: vi.fn(() => ({ subdomain: "demo", lang: "en" })),
  useRouter: vi.fn(() => ({ push: vi.fn() })),
}))

vi.mock("@/components/internationalization/use-locale", () => ({
  useLocale: vi.fn(() => ({ locale: "en", isRTL: false })),
}))

vi.mock("canvas-confetti", () => ({
  default: vi.fn(),
}))

vi.mock("motion/react", () => ({
  motion: {
    div: "div",
    h2: "h2",
    p: "p",
  },
}))

// Mock navigator.clipboard
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockResolvedValue(undefined),
  },
})

// =============================================================================
// PROPS FACTORY
// =============================================================================

type WelcomeStepProps = Parameters<typeof WelcomeStep>[0]

const createDefaultProps = (
  overrides: Partial<WelcomeStepProps> = {}
): WelcomeStepProps => ({
  schoolName: "Demo School",
  schoolPhone: "+249123456789",
  schoolEmail: "info@demo.school",
  subdomain: "demo",
  refCode: "ABCD1234",
  applicantName: "Ahmed Hassan",
  applicantRole: "teacher",
  applicantPhone: "0912345678",
  ...overrides,
})

// =============================================================================
// TESTS
// =============================================================================

describe("WelcomeStep", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders "Welcome Aboard!" title', () => {
    customRender(<WelcomeStep {...createDefaultProps()} />)

    expect(screen.getByText("Welcome Aboard!")).toBeInTheDocument()
  })

  it("displays ref code in mono font when refCode provided", () => {
    customRender(<WelcomeStep {...createDefaultProps()} />)

    const refCodeElement = screen.getByText("ABCD1234")
    expect(refCodeElement).toBeInTheDocument()
    expect(refCodeElement).toHaveClass("font-mono")
  })

  it('shows "Application Reference" label with refCode', () => {
    customRender(<WelcomeStep {...createDefaultProps()} />)

    expect(screen.getByText("Application Reference")).toBeInTheDocument()
  })

  it("does NOT render reference card when refCode is undefined", () => {
    customRender(
      <WelcomeStep {...createDefaultProps({ refCode: undefined })} />
    )

    expect(screen.queryByText("Application Reference")).not.toBeInTheDocument()
  })

  it('copy button calls clipboard.writeText with refCode and shows "Copied" feedback', () => {
    customRender(<WelcomeStep {...createDefaultProps()} />)

    const copyButton = screen.getByRole("button", { name: /copy/i })
    fireEvent.click(copyButton)

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("ABCD1234")
    expect(screen.getByText("Copied")).toBeInTheDocument()
  })

  it("WhatsApp share link contains correct wa.me URL with school name and ref code", () => {
    customRender(<WelcomeStep {...createDefaultProps()} />)

    const shareLink = screen.getByRole("link", { name: /share/i })
    const href = shareLink.getAttribute("href")

    expect(href).toContain("wa.me")
    expect(href).toContain(encodeURIComponent("Demo School"))
    expect(href).toContain(encodeURIComponent("ABCD1234"))
  })

  it('shows "Check your phone" step when applicantPhone provided', () => {
    customRender(<WelcomeStep {...createDefaultProps()} />)

    expect(screen.getByText("Check your phone")).toBeInTheDocument()
  })

  it("masks phone correctly (first 4 + **** + last 2)", () => {
    customRender(<WelcomeStep {...createDefaultProps()} />)

    // For phone "0912345678", masked = "0912****78"
    expect(screen.getByText(/0912\*{4}78/)).toBeInTheDocument()
  })

  it('does NOT show "Check your phone" when applicantPhone is absent', () => {
    customRender(
      <WelcomeStep {...createDefaultProps({ applicantPhone: undefined })} />
    )

    expect(screen.queryByText("Check your phone")).not.toBeInTheDocument()
  })

  it('shows school contact info in "Contact the school" step', () => {
    customRender(<WelcomeStep {...createDefaultProps()} />)

    // contactDescription = "+249123456789 | info@demo.school"
    expect(screen.getByText(/\+249123456789/)).toBeInTheDocument()
  })
})

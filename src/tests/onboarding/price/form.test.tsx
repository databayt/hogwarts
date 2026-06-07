// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { CURRENCY_ENUM } from "@/components/onboarding/price/validation"

// Radix RadioGroup uses ResizeObserver internally; jsdom doesn't ship it.
class StubResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
;(globalThis as { ResizeObserver?: typeof ResizeObserver }).ResizeObserver ??=
  StubResizeObserver as unknown as typeof ResizeObserver

// ---------------------------------------------------------------------------
// Mocks — replace the price step's siblings so the form renders in isolation.
// ---------------------------------------------------------------------------

// Hoisted state for the useListing/useDictionary mocks so each test can set
// the school's location-derived currency before importing the component.
const listingState = vi.hoisted(() => ({
  current: { currency: undefined as string | undefined },
}))

vi.mock("@/components/internationalization/use-dictionary", () => ({
  useDictionary: () => ({ dictionary: {} }),
}))

vi.mock("@/components/onboarding/use-listing", () => ({
  useListing: () => ({
    listing: { currency: listingState.current.currency },
    updateListingData: vi.fn(),
    isLoading: false,
    error: null,
  }),
  useHostNavigation: () => ({
    goToNextStep: vi.fn(),
    goToPreviousStep: vi.fn(),
  }),
}))

vi.mock("@/components/onboarding/form-field", () => ({
  FormField: ({
    label,
    children,
  }: {
    label: React.ReactNode
    children: React.ReactNode
  }) => (
    <div>
      <span>{label}</span>
      {children}
    </div>
  ),
}))

vi.mock("@/components/onboarding/step-navigation", () => ({
  StepNavigation: () => null,
}))

vi.mock("@/components/onboarding/step-wrapper", () => ({
  StepWrapper: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}))

// ---------------------------------------------------------------------------
// Tests — issue #305 (MENA currencies + symbol prefix)
// ---------------------------------------------------------------------------

describe("PriceForm — currency selector (issue #305)", () => {
  beforeEach(() => {
    vi.resetModules()
    listingState.current.currency = undefined
  })

  it("renders a radio for every CURRENCY_ENUM entry (was hardcoded to 5 Western currencies)", async () => {
    const { PriceForm } = await import("@/components/onboarding/price/form")
    render(<PriceForm />)

    // 14 total: USD, EUR, GBP, CAD, AUD + SAR, AED, EGP, SDG, JOD, KWD, QAR, BHD, OMR
    expect(CURRENCY_ENUM.length).toBe(14)
    for (const currency of CURRENCY_ENUM) {
      expect(
        screen.getByRole("radio", { name: currency }),
        `radio for ${currency} should render`
      ).toBeInTheDocument()
    }
  })

  it("defaults to the location-derived currency on the listing (SDG for Sudan, not USD)", async () => {
    listingState.current.currency = "SDG"
    const { PriceForm } = await import("@/components/onboarding/price/form")
    render(<PriceForm />)

    const sdg = screen.getByRole("radio", { name: "SDG" })
    expect(sdg).toBeChecked()
    expect(screen.getByRole("radio", { name: "USD" })).not.toBeChecked()
  })

  it("falls back to USD when the listing has no currency yet", async () => {
    listingState.current.currency = undefined
    const { PriceForm } = await import("@/components/onboarding/price/form")
    render(<PriceForm />)

    expect(screen.getByRole("radio", { name: "USD" })).toBeChecked()
  })

  it("prefixes the tuition input with the SDG symbol when the listing is in SDG", async () => {
    listingState.current.currency = "SDG"
    const { PriceForm } = await import("@/components/onboarding/price/form")
    const { container } = render(<PriceForm />)

    // Three fee inputs all share the same prefix span — assert at least the
    // first one shows the Sudanese pound symbol (was hardcoded "$" before #305).
    const prefixes = container.querySelectorAll("span")
    const hasSdg = Array.from(prefixes).some((el) =>
      el.textContent?.includes("ج.س")
    )
    expect(hasSdg).toBe(true)
  })

  it("prefixes inputs with $ when currency is USD (regression guard)", async () => {
    listingState.current.currency = "USD"
    const { PriceForm } = await import("@/components/onboarding/price/form")
    const { container } = render(<PriceForm />)

    const prefixes = container.querySelectorAll("span")
    const hasDollar = Array.from(prefixes).some(
      (el) => el.textContent?.trim() === "$"
    )
    expect(hasDollar).toBe(true)
  })
})

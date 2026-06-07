// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { ActionCard } from "@/components/school-dashboard/attendance/atom/action-card"

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode
    href: string
    [key: string]: any
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

describe("ActionCard atom", () => {
  it("renders title", () => {
    render(<ActionCard title="Mark Attendance" href="/attendance/manual" />)

    expect(screen.getByText("Mark Attendance")).toBeInTheDocument()
  })

  it("renders description when provided", () => {
    render(
      <ActionCard
        title="QR Scan"
        description="Scan student QR codes"
        href="/attendance/qr"
      />
    )

    expect(screen.getByText("Scan student QR codes")).toBeInTheDocument()
  })

  it("wraps content in a link to href", () => {
    render(<ActionCard title="Reports" href="/attendance/reports" />)

    const link = screen.getByRole("link")
    expect(link).toHaveAttribute("href", "/attendance/reports")
  })

  it("renders with iconName", () => {
    const { container } = render(
      <ActionCard
        title="QR Code"
        href="/attendance/qr-code"
        iconName="QrCode"
      />
    )

    expect(container).toBeInTheDocument()
  })

  it("accepts custom iconColor and iconBgColor", () => {
    const { container } = render(
      <ActionCard
        title="Bulk"
        href="/attendance/bulk"
        iconName="Upload"
        iconColor="text-blue-500"
        iconBgColor="bg-blue-100"
      />
    )

    expect(container).toBeInTheDocument()
  })
})

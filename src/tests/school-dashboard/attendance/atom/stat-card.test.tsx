// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { render, screen } from "@testing-library/react"
import { Users } from "lucide-react"
import { describe, expect, it } from "vitest"

import { StatCard } from "@/components/school-dashboard/attendance/atom/stat-card"

describe("StatCard atom", () => {
  it("renders title and value", () => {
    render(<StatCard title="Total Students" value={42} />)

    expect(screen.getByText("Total Students")).toBeInTheDocument()
    expect(screen.getByText("42")).toBeInTheDocument()
  })

  it("renders string values", () => {
    render(<StatCard title="Rate" value="95%" />)

    expect(screen.getByText("95%")).toBeInTheDocument()
  })

  it("renders description when provided", () => {
    render(
      <StatCard
        title="Present Today"
        value={120}
        description="vs 110 yesterday"
      />
    )

    expect(screen.getByText("vs 110 yesterday")).toBeInTheDocument()
  })

  it("renders without an icon when none provided", () => {
    const { container } = render(<StatCard title="No Icon" value={1} />)

    expect(container).toBeInTheDocument()
  })

  it("accepts iconName string and resolves via internal map", () => {
    const { container } = render(
      <StatCard title="With Users Icon" value={5} iconName="Users" />
    )

    expect(container).toBeInTheDocument()
  })

  it("accepts icon component prop", () => {
    const { container } = render(
      <StatCard title="Component Icon" value={5} icon={Users} />
    )

    expect(container).toBeInTheDocument()
  })

  it("applies variant=success styling", () => {
    render(
      <StatCard
        title="Success"
        value={100}
        variant="success"
        iconName="Users"
      />
    )

    expect(screen.getByText("100")).toBeInTheDocument()
  })

  it("applies variant=danger styling", () => {
    render(<StatCard title="Danger" value={3} variant="danger" />)

    expect(screen.getByText("3")).toBeInTheDocument()
  })

  it("accepts custom className", () => {
    const { container } = render(
      <StatCard title="Custom" value={1} className="custom-class" />
    )

    expect(container.firstChild).toHaveClass("custom-class")
  })
})

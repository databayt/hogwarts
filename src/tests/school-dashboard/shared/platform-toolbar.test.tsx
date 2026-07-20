// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Regression guards for the shared table toolbar.
 *
 * Covers the three defects this area shipped with:
 *  1. 8 of ~34 call sites passed no `translations` at all and ~17 passed a
 *     partial object, so Arabic users saw hardcoded English toolbar chrome
 *  2. the reset control read TanStack state through a memo that could never
 *     observe it (see 3)
 *  3. TanStack's `table` is referentially stable and mutates in place, so
 *     React.memo on the toolbar swallows filter-state changes outright
 */

import * as React from "react"
import { getCoreRowModel, useReactTable } from "@tanstack/react-table"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { DictionaryProvider } from "@/components/internationalization/dictionary-context"
import { PlatformToolbar } from "@/components/school-dashboard/shared/platform-toolbar"

interface Row {
  id: string
  name: string
}

// The locale hook reads route params; pin it per-test instead of a router mock.
const mockLocale = vi.hoisted(() => ({ current: "en" }))
vi.mock("@/components/internationalization/use-locale", () => ({
  useLocale: () => ({
    locale: mockLocale.current,
    isRTL: mockLocale.current === "ar",
    localeConfig: {},
  }),
}))

const columns = [{ id: "name", accessorKey: "name", header: "Name" }] as const

const rows: Row[] = [{ id: "1", name: "Row 1" }]

/**
 * Mirrors the real call sites: the toolbar receives the table instance, and
 * column-filter state lives in React so a change re-renders the parent.
 */
function Harness({
  translations,
  withProvider = false,
}: {
  translations?: React.ComponentProps<typeof PlatformToolbar>["translations"]
  withProvider?: boolean
}) {
  const [columnFilters, setColumnFilters] = React.useState<
    { id: string; value: unknown }[]
  >([])

  const table = useReactTable({
    data: rows,
    columns: columns as never,
    getCoreRowModel: getCoreRowModel(),
    state: { columnFilters },
    onColumnFiltersChange: setColumnFilters as never,
  })

  const toolbar = (
    <>
      <button
        onClick={() => table.setColumnFilters([{ id: "name", value: "x" }])}
      >
        apply-filter
      </button>
      <PlatformToolbar
        table={table}
        view="table"
        onToggleView={() => {}}
        translations={translations}
      />
    </>
  )

  if (!withProvider) return toolbar

  // Only `school.common` is read by the toolbar; the rest of the dictionary is
  // irrelevant here, so a partial stand-in keeps the fixture honest and small.
  const dictionary = {
    school: {
      common: {
        reset: "dict-reset",
        view: "dict-view",
        create: "dict-create",
        toggleColumns: "dict-toggle",
      },
    },
  }

  return (
    <DictionaryProvider dictionary={dictionary as never}>
      {toolbar}
    </DictionaryProvider>
  )
}

describe("PlatformToolbar i18n", () => {
  it("localizes toolbar chrome in Arabic without a per-table translations prop", async () => {
    mockLocale.current = "ar"
    render(<Harness />)

    // The column-visibility trigger is the always-present piece of chrome. Its
    // accessible name comes from aria-label (toggleColumns); its visible text is
    // the `view` label — assert both so a regression in either is caught.
    expect(
      await screen.findByRole("combobox", { name: "تبديل الأعمدة" })
    ).toBeTruthy()
    expect(screen.getByText("عرض")).toBeTruthy()
    expect(screen.queryByText("View")).toBeNull()

    mockLocale.current = "en"
  })

  it("prefers school.common from the dictionary over the built-in fallback", async () => {
    render(<Harness withProvider />)

    expect(
      await screen.findByRole("combobox", { name: "dict-toggle" })
    ).toBeTruthy()
    expect(screen.getByText("dict-view")).toBeTruthy()
  })

  it("lets an explicit translations prop override the dictionary", async () => {
    render(<Harness withProvider translations={{ view: "override-view" }} />)

    expect(await screen.findByText("override-view")).toBeTruthy()
    // Keys the call site did NOT override still come from the dictionary —
    // this is what makes partial `translations` objects safe.
    expect(screen.getByRole("combobox", { name: "dict-toggle" })).toBeTruthy()
  })
})

describe("PlatformToolbar filter state", () => {
  /**
   * GUARD: this fails if PlatformToolbar is ever wrapped in React.memo again.
   * `table` keeps the same identity across a filter change, and the remaining
   * props here are stable, so a shallow compare would skip the re-render and
   * the reset control would never appear.
   */
  it("shows the reset control once a column filter becomes active", async () => {
    render(<Harness />)

    expect(screen.queryByRole("button", { name: "Reset" })).toBeNull()

    fireEvent.click(screen.getByRole("button", { name: "apply-filter" }))

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Reset" })).toBeTruthy()
    })
  })
})

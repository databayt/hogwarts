// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Regression guards for the "see more" / load-more pagination under tables.
 *
 * Covers the three defects this area shipped with:
 *  1. rows were fetched but never rendered (memoized shell + pinned pageSize)
 *  2. offset pagination re-served rows, producing duplicate React keys
 *  3. the controls were hardcoded English for 27 of the 39 load-more tables
 */

import * as React from "react"
import {
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table"
import {
  act,
  render,
  renderHook,
  screen,
  waitFor,
} from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { usePlatformData } from "@/hooks/use-platform-data"
import { DataTable } from "@/components/table/data-table"

interface Row {
  id: string
  name: string
}

const makeRows = (start: number, count: number): Row[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `id-${start + i}`,
    name: `Row ${start + i}`,
  }))

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

function Harness({ rows }: { rows: Row[] }) {
  const table = useReactTable({
    data: rows,
    columns: columns as never,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    // Reproduces the real call sites: pageSize seeded ONCE from the initial
    // row count via initialState, which TanStack never re-reads.
    initialState: { pagination: { pageIndex: 0, pageSize: rows.length } },
  })

  return <DataTable table={table} paginationMode="load-more" hasMore />
}

describe("DataTable load-more rendering", () => {
  it("renders newly loaded rows instead of clipping them to the initial page size", async () => {
    const { rerender } = render(<Harness rows={makeRows(1, 20)} />)
    expect(screen.getAllByRole("row")).toHaveLength(21) // 20 body + 1 header

    // "Load more" grew the data set — every row must now be visible.
    rerender(<Harness rows={makeRows(1, 40)} />)

    await waitFor(() => {
      expect(screen.getAllByRole("row")).toHaveLength(41)
    })
  })

  it("localizes the load-more control without a per-table translations prop", async () => {
    mockLocale.current = "ar"
    render(<Harness rows={makeRows(1, 5)} />)

    expect(
      await screen.findByRole("button", { name: "تحميل المزيد" })
    ).toBeTruthy()
    expect(screen.queryByText("Load More")).toBeNull()

    mockLocale.current = "en"
  })
})

describe("usePlatformData.loadMore", () => {
  const setup = (fetcher: ReturnType<typeof vi.fn>) =>
    renderHook(() =>
      usePlatformData<Row>({
        initialData: makeRows(1, 20),
        total: 60,
        perPage: 20,
        fetcher,
      })
    )

  it("appends the next page", async () => {
    const fetcher = vi.fn(async () => ({ rows: makeRows(21, 20), total: 60 }))
    const { result } = setup(fetcher)

    await act(async () => {
      await result.current.loadMore()
    })

    expect(fetcher).toHaveBeenCalledWith(
      expect.objectContaining({ page: 2, perPage: 20 })
    )
    expect(result.current.data).toHaveLength(40)
  })

  it("drops rows the server re-serves, so keys stay unique", async () => {
    // Offset pagination overlaps page 1 whenever a record shifts underneath it.
    const fetcher = vi.fn(async () => ({ rows: makeRows(15, 20), total: 60 }))
    const { result } = setup(fetcher)

    await act(async () => {
      await result.current.loadMore()
    })

    const ids = result.current.data.map((r) => r.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(result.current.data).toHaveLength(34) // 20 + 14 genuinely new
  })

  it("ignores a concurrent second click while a request is in flight", async () => {
    let release: (v: { rows: Row[]; total: number }) => void = () => {}
    const fetcher = vi.fn(
      () =>
        new Promise<{ rows: Row[]; total: number }>((res) => {
          release = res
        })
    )
    const { result } = setup(fetcher)

    await act(async () => {
      void result.current.loadMore()
      void result.current.loadMore() // double-click
      release({ rows: makeRows(21, 20), total: 60 })
    })

    expect(fetcher).toHaveBeenCalledTimes(1)
  })
})

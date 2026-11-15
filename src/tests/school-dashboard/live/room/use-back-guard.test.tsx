// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import {
  BACK_GUARD_MARK,
  useBackGuard,
} from "@/components/school-dashboard/live/room/use-back-guard"

describe("useBackGuard", () => {
  it("pushes a marker, re-pushes and asks on Back, and stops when inactive", () => {
    const onBack = vi.fn()
    const push = vi.spyOn(window.history, "pushState")
    const { rerender, unmount } = renderHook(
      ({ active }) => useBackGuard(active, onBack),
      { initialProps: { active: true } }
    )
    expect(push).toHaveBeenCalledTimes(1)
    expect(push.mock.calls[0][0]).toMatchObject({ [BACK_GUARD_MARK]: true })

    window.dispatchEvent(new PopStateEvent("popstate"))
    expect(onBack).toHaveBeenCalledTimes(1)
    expect(push).toHaveBeenCalledTimes(2)

    rerender({ active: false })
    window.dispatchEvent(new PopStateEvent("popstate"))
    expect(onBack).toHaveBeenCalledTimes(1)
    expect(push).toHaveBeenCalledTimes(2)
    unmount()
    push.mockRestore()
  })
})

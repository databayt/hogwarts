// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Regression guard for the student wizard's Father/Mother sub-tabs.
 *
 * The form used to render ONE set of fields and swap their `name` prop between
 * `father*` and `mother*` when the tab changed. react-hook-form seeds a
 * Controller's value through `useWatch`, whose `useState` initializer only runs
 * on mount — changing `name` on a mounted Controller re-subscribes but never
 * re-reads. So the Mother tab kept showing (and re-registering) the father's
 * value, which then saved as the mother.
 */

import * as React from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { GuardianForm } from "@/components/school-dashboard/listings/students/wizard/personal/guardian-form"

vi.mock("@/components/internationalization/use-dictionary", () => ({
  useDictionary: () => ({
    dictionary: {
      school: {
        students: {
          guardian: {
            fatherName: "Father's Name",
            motherName: "Mother's Name",
          },
        },
      },
    },
  }),
}))

vi.mock(
  "@/components/school-dashboard/listings/students/wizard/personal/actions",
  () => ({ saveStudentPersonalGuardians: vi.fn() })
)

function nameInput(label: string): HTMLInputElement {
  return screen.getByLabelText(label) as HTMLInputElement
}

describe("GuardianForm father/mother isolation", () => {
  it("does not carry the father's name onto the mother tab", () => {
    const { rerender } = render(
      <GuardianForm studentId="s1" controlledParent="father" />
    )

    fireEvent.change(nameInput("Father's Name"), {
      target: { value: "Ahmed Ali" },
    })
    expect(nameInput("Father's Name").value).toBe("Ahmed Ali")

    rerender(<GuardianForm studentId="s1" controlledParent="mother" />)

    // The mother's field is its own field, not the father's under a new name.
    expect(nameInput("Mother's Name").value).toBe("")
    // ...and the father's entry survives the switch, so one save persists both.
    expect(nameInput("Father's Name").value).toBe("Ahmed Ali")
  })

  it("reports valid with only one parent named (the other stays optional)", () => {
    const onValidChange = vi.fn()
    render(
      <GuardianForm
        studentId="s1"
        controlledParent="mother"
        onValidChange={onValidChange}
      />
    )

    expect(onValidChange).toHaveBeenLastCalledWith(false)

    fireEvent.change(nameInput("Mother's Name"), {
      target: { value: "Fatima Hassan" },
    })

    expect(onValidChange).toHaveBeenLastCalledWith(true)
  })
})

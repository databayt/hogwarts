import { render } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { axe } from "vitest-axe"

import { FormError } from "../form-error"
import { FormSuccess } from "../form-success"

describe("Auth Components - Accessibility", () => {
  describe("FormError", () => {
    it("has no a11y violations when message is provided", async () => {
      const { container } = render(<FormError message="Invalid credentials" />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it("renders nothing when no message", () => {
      const { container } = render(<FormError />)
      expect(container.innerHTML).toBe("")
    })

    it("displays error message text", () => {
      const { getByText } = render(<FormError message="Email is required" />)
      expect(getByText("Email is required")).toBeTruthy()
    })
  })

  describe("FormSuccess", () => {
    it("has no a11y violations when message is provided", async () => {
      const { container } = render(
        <FormSuccess message="Email verified successfully" />
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it("renders nothing when no message", () => {
      const { container } = render(<FormSuccess />)
      expect(container.innerHTML).toBe("")
    })

    it("displays success message text", () => {
      const { getByText } = render(<FormSuccess message="Password updated" />)
      expect(getByText("Password updated")).toBeTruthy()
    })
  })
})

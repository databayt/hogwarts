"use client"

import { Checkbox } from "@/components/ui/checkbox"

/**
 * ShadcnFieldCheckbox - Horizontal checkbox with label
 *
 * Demonstrates checkbox input with proper labeling and orientation.
 *
 * @example
 * ```tsx
 * <ShadcnFieldCheckbox />
 * ```
 */
export function ShadcnFieldCheckbox() {
  return (
    <div className="flex items-center space-x-2">
      <Checkbox id="checkbox-demo" defaultChecked />
      <label
        htmlFor="checkbox-demo"
        className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        I agree to the terms and conditions
      </label>
    </div>
  )
}

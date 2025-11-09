"use client"

import { Checkbox } from "@/components/ui/checkbox"

/**
 * FieldCheckbox - Horizontal checkbox with label
 *
 * Demonstrates checkbox input with proper labeling and orientation.
 *
 * @example
 * ```tsx
 * <FieldCheckbox />
 * ```
 */
export function FieldCheckbox() {
  return (
    <div className="flex items-center space-x-2">
      <Checkbox id="checkbox-demo" defaultChecked />
      <label
        htmlFor="checkbox-demo"
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        I agree to the terms and conditions
      </label>
    </div>
  )
}

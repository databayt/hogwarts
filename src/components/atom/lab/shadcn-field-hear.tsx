"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"

const options = [
  { label: "Social Media", value: "social-media" },
  { label: "Search Engine", value: "search-engine" },
  { label: "Referral", value: "referral" },
  { label: "Other", value: "other" },
]

/**
 * ShadcnFieldHear - Multi-select checkbox group with pill styling
 *
 * Demonstrates how users discovered the service with animated pill-style checkboxes.
 *
 * @example
 * ```tsx
 * <ShadcnFieldHear />
 * ```
 */
export function ShadcnFieldHear() {
  return (
    <Card className="shadow-none">
      <CardContent className="p-6">
        <form>
          <fieldset className="space-y-4">
            <legend className="font-medium">How did you hear about us?</legend>
            <p className="text-muted-foreground text-sm">
              Select the option that best describes how you heard about us.
            </p>

            <div className="flex flex-wrap gap-2">
              {options.map((option) => (
                <label
                  key={option.value}
                  htmlFor={option.value}
                  className="group border-border hover:bg-accent flex w-fit cursor-pointer items-center gap-1.5 overflow-hidden rounded-full border px-3 py-1.5 transition-all duration-100 ease-linear has-[:checked]:px-2"
                >
                  <Checkbox
                    value={option.value}
                    id={option.value}
                    defaultChecked={option.value === "social-media"}
                    className="size-4 rounded-full transition-all duration-100 ease-linear"
                  />
                  <span className="text-sm font-medium">{option.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
        </form>
      </CardContent>
    </Card>
  )
}

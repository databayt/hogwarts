"use client"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

/**
 * FieldDemo - Payment checkout form demonstration
 *
 * Demonstrates structured form design with:
 * - Payment method section with card details
 * - Billing address with conditional display
 * - Proper form field labeling and accessibility
 *
 * @example
 * ```tsx
 * <FieldDemo />
 * ```
 */
export function FieldDemo() {
  return (
    <div className="w-full max-w-md rounded-lg border border-border bg-card p-6">
      <form className="space-y-6">
        {/* Payment Method Section */}
        <fieldset className="space-y-4">
          <legend className="text-sm font-medium">Payment Method</legend>
          <p className="text-sm text-muted-foreground">
            Enter your payment details below.
          </p>

          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="text-sm font-medium">
                Name on card
              </label>
              <Input id="name" placeholder="John Doe" className="mt-1.5" />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="md:col-span-2">
                <label htmlFor="card-number" className="text-sm font-medium">
                  Card number
                </label>
                <Input
                  id="card-number"
                  placeholder="1234 5678 9012 3456"
                  className="mt-1.5"
                />
              </div>
              <div>
                <label htmlFor="cvv" className="text-sm font-medium">
                  CVV
                </label>
                <Input id="cvv" placeholder="123" className="mt-1.5" />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="exp-month" className="text-sm font-medium">
                  Expiration month
                </label>
                <Select>
                  <SelectTrigger id="exp-month" className="mt-1.5">
                    <SelectValue placeholder="Month" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">January</SelectItem>
                    <SelectItem value="2">February</SelectItem>
                    <SelectItem value="3">March</SelectItem>
                    <SelectItem value="4">April</SelectItem>
                    <SelectItem value="5">May</SelectItem>
                    <SelectItem value="6">June</SelectItem>
                    <SelectItem value="7">July</SelectItem>
                    <SelectItem value="8">August</SelectItem>
                    <SelectItem value="9">September</SelectItem>
                    <SelectItem value="10">October</SelectItem>
                    <SelectItem value="11">November</SelectItem>
                    <SelectItem value="12">December</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label htmlFor="exp-year" className="text-sm font-medium">
                  Expiration year
                </label>
                <Select>
                  <SelectTrigger id="exp-year" className="mt-1.5">
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2025">2025</SelectItem>
                    <SelectItem value="2026">2026</SelectItem>
                    <SelectItem value="2027">2027</SelectItem>
                    <SelectItem value="2028">2028</SelectItem>
                    <SelectItem value="2029">2029</SelectItem>
                    <SelectItem value="2030">2030</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </fieldset>

        {/* Billing Address Section */}
        <fieldset className="space-y-4">
          <legend className="text-sm font-medium">Billing Address</legend>

          <div className="flex items-center space-x-2">
            <Checkbox id="same-as-shipping" defaultChecked />
            <label
              htmlFor="same-as-shipping"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Same as shipping address
            </label>
          </div>
        </fieldset>

        {/* Comments Section */}
        <div className="space-y-2">
          <label htmlFor="comments" className="text-sm font-medium">
            Comments
          </label>
          <Textarea
            id="comments"
            placeholder="Add any special instructions..."
            className="min-h-[100px]"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button type="submit" className="flex-1">
            Submit
          </Button>
          <Button type="button" variant="outline" className="flex-1">
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}

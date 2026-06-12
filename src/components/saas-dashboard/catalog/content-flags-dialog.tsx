"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useState, useTransition } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import {
  updateContentFlags,
  type ContentStatus,
  type ContentVisibility,
} from "./approval-actions"
import { catalogActionError } from "./error-messages"

type FlagContentType =
  | "Question"
  | "Material"
  | "Assignment"
  | "Book"
  | "Video"
  | "Exam"

// Types that carry a ContentStatus column (Video has none).
const STATUS_TYPES: ReadonlySet<FlagContentType> = new Set([
  "Question",
  "Material",
  "Assignment",
  "Book",
  "Exam",
])

// Types that carry price / currency columns (PAID is only meaningful here).
const PRICE_TYPES: ReadonlySet<FlagContentType> = new Set([
  "Question",
  "Video",
  "Exam",
])

const CURRENCIES = ["USD", "SAR", "AED", "EUR", "GBP"] as const

interface Props {
  contentType: FlagContentType
  contentId: string
  currentVisibility: ContentVisibility
  currentStatus?: ContentStatus
  currentPrice?: number | null
  currentCurrency?: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved?: () => void
  dictionary?: Dictionary
}

export function ContentFlagsDialog({
  contentType,
  contentId,
  currentVisibility,
  currentStatus,
  currentPrice,
  currentCurrency,
  open,
  onOpenChange,
  onSaved,
  dictionary,
}: Props) {
  const m = dictionary?.operator?.catalog?.manage

  const [isPending, startTransition] = useTransition()
  const [visibility, setVisibility] =
    useState<ContentVisibility>(currentVisibility)
  const [status, setStatus] = useState<ContentStatus>(currentStatus ?? "DRAFT")
  const [price, setPrice] = useState(
    currentPrice != null ? String(currentPrice) : ""
  )
  const [currency, setCurrency] = useState(currentCurrency ?? "USD")

  const hasStatus = STATUS_TYPES.has(contentType)
  const hasPrice = PRICE_TYPES.has(contentType)
  const isPaid = visibility === "PAID"
  const showPricing = hasPrice && isPaid
  const priceNumber = Number(price)
  const canSubmit =
    !showPricing || (priceNumber > 0 && currency.trim().length === 3)

  function handleSubmit() {
    if (!canSubmit) {
      toast.error(m?.paidRequiresPrice ?? "Paid content requires a price")
      return
    }
    startTransition(async () => {
      const result = await updateContentFlags(contentType, contentId, {
        visibility,
        ...(hasStatus ? { status } : {}),
        ...(hasPrice
          ? isPaid
            ? {
                price: priceNumber,
                currency: currency.trim().toUpperCase(),
              }
            : { price: null, currency: null }
          : {}),
      })

      if (result.success) {
        toast.success(m?.saved ?? "Saved")
        onOpenChange(false)
        onSaved?.()
      } else {
        toast.error(catalogActionError(result.error, m))
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{m?.manageFlags ?? "Manage visibility"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{m?.visibility ?? "Visibility"}</Label>
            <Select
              value={visibility}
              onValueChange={(v) => setVisibility(v as ContentVisibility)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PUBLIC">
                  {m?.visibilityPublic ?? "Public"}
                </SelectItem>
                <SelectItem value="SCHOOL">
                  {m?.visibilitySchool ?? "School"}
                </SelectItem>
                <SelectItem value="PRIVATE">
                  {m?.visibilityPrivate ?? "Private"}
                </SelectItem>
                {hasPrice && (
                  <SelectItem value="PAID">
                    {m?.visibilityPaid ?? "Paid"}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            {!hasPrice && isPaid && (
              <p className="text-destructive text-xs">
                {m?.paidUnsupported ??
                  "PAID visibility is not supported for this content type"}
              </p>
            )}
          </div>

          {hasStatus && (
            <div className="space-y-2">
              <Label>{m?.status ?? "Status"}</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as ContentStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">
                    {m?.statusDraft ?? "Draft"}
                  </SelectItem>
                  <SelectItem value="REVIEW">
                    {m?.statusReview ?? "Review"}
                  </SelectItem>
                  <SelectItem value="PUBLISHED">
                    {m?.statusPublished ?? "Published"}
                  </SelectItem>
                  <SelectItem value="ARCHIVED">
                    {m?.statusArchived ?? "Archived"}
                  </SelectItem>
                  <SelectItem value="DEPRECATED">
                    {m?.statusDeprecated ?? "Deprecated"}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {showPricing && (
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">{m?.price ?? "Price"}</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="9.99"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{m?.currency ?? "Currency"}</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            {dictionary?.operator?.common?.actions?.cancel ?? "Cancel"}
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit || isPending}>
            {isPending && <Loader2 className="me-2 size-4 animate-spin" />}
            {m?.save ?? "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

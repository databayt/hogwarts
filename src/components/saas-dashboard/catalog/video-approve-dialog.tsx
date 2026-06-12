"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useState, useTransition } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
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

import { approveContent } from "./approval-actions"
import type { PendingItem } from "./approval-content"
import { catalogActionError } from "./error-messages"

type Visibility = "PRIVATE" | "SCHOOL" | "PUBLIC" | "PAID"

interface Props {
  item: PendingItem
  open: boolean
  onOpenChange: (open: boolean) => void
  onApproved?: () => void
}

export function VideoApproveDialog({
  item,
  open,
  onOpenChange,
  onApproved,
}: Props) {
  const meta = item.videoMeta
  const [isPending, startTransition] = useTransition()
  const [visibility, setVisibility] = useState<Visibility>(
    meta?.visibility ?? "SCHOOL"
  )
  const [isFeatured, setIsFeatured] = useState(meta?.isFeatured ?? false)
  const [price, setPrice] = useState(
    meta?.price != null ? String(meta.price) : ""
  )
  const [currency, setCurrency] = useState(meta?.currency ?? "USD")

  const isPaid = visibility === "PAID"
  const priceNumber = Number(price)
  const canSubmit = !isPaid || (priceNumber > 0 && currency.trim().length === 3)

  function handleSubmit() {
    if (!canSubmit) return
    startTransition(async () => {
      const result = await approveContent("Video", item.id, {
        visibility,
        isFeatured,
        price: isPaid ? priceNumber : null,
        currency: isPaid ? currency.trim().toUpperCase() : null,
      })

      if (result.success) {
        toast.success("Video approved")
        onOpenChange(false)
        onApproved?.()
      } else {
        toast.error(catalogActionError(result.error))
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Approve video</DialogTitle>
          <DialogDescription>
            Review the proposer&apos;s suggested settings. You can override any
            field before approving.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted/50 space-y-1.5 rounded-md p-3 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Title</span>
              <span className="font-medium">{item.title}</span>
            </div>
            {meta?.ownerName && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Instructor</span>
                <span>
                  {meta.ownerName}
                  {meta.ownerRole && (
                    <span className="text-muted-foreground ms-1">
                      ({meta.ownerRole.toLowerCase()})
                    </span>
                  )}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Proposed audience</span>
              <span>{meta?.visibility ?? "—"}</span>
            </div>
            {meta?.price != null && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Proposed price</span>
                <span>
                  {meta.price.toFixed(2)} {meta.currency ?? ""}
                </span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Visibility</Label>
            <Select
              value={visibility}
              onValueChange={(v) => setVisibility(v as Visibility)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PUBLIC">
                  Public catalog (all schools)
                </SelectItem>
                <SelectItem value="SCHOOL">
                  Proposer&apos;s school only
                </SelectItem>
                <SelectItem value="PRIVATE">Private</SelectItem>
                <SelectItem value="PAID">Paid (requires price)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isPaid && (
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Price</Label>
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
                <Label className="text-xs">Currency</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="SAR">SAR</SelectItem>
                    <SelectItem value="AED">AED</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <label className="flex cursor-pointer items-center gap-2">
            <Checkbox
              checked={isFeatured}
              onCheckedChange={(v) => setIsFeatured(v === true)}
            />
            <span className="text-sm">Feature this video</span>
          </label>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit || isPending}>
            {isPending && <Loader2 className="me-2 size-4 animate-spin" />}
            Approve
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

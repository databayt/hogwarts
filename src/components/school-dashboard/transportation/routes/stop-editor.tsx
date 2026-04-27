"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import type { RouteStop } from "@prisma/client"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { addRouteStop, deleteStop, reorderStops } from "../actions/stops"
import { TransportationEmptyState } from "../empty-state"

interface FormState {
  name: string
  address: string
  pickupTime: string
  dropoffTime: string
}

const EMPTY_FORM: FormState = {
  name: "",
  address: "",
  pickupTime: "",
  dropoffTime: "",
}

interface Props {
  routeId: string
  initialStops: RouteStop[]
  dictionary: Dictionary
}

export function StopEditor({ routeId, initialStops, dictionary }: Props) {
  const t = dictionary.transportation
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)

  const stops = [...initialStops].sort((a, b) => a.stopOrder - b.stopOrder)

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const nextOrder = (stops.at(-1)?.stopOrder ?? 0) + 1
      const result = await addRouteStop({
        routeId,
        name: form.name.trim(),
        address: form.address.trim() || undefined,
        stopOrder: nextOrder,
        pickupTime: form.pickupTime || undefined,
        dropoffTime: form.dropoffTime || undefined,
      })
      if (result.success) {
        toast.success(t.toasts.stopAdded)
        setOpen(false)
        setForm(EMPTY_FORM)
        router.refresh()
      } else {
        toast.error(t.errors.internalError)
      }
    })
  }

  function handleMove(stopId: string, direction: -1 | 1) {
    const idx = stops.findIndex((s) => s.id === stopId)
    if (idx < 0) return
    const swapIdx = idx + direction
    if (swapIdx < 0 || swapIdx >= stops.length) return

    const reordered = [...stops]
    ;[reordered[idx], reordered[swapIdx]] = [reordered[swapIdx], reordered[idx]]

    startTransition(async () => {
      const result = await reorderStops({
        routeId,
        stopIds: reordered.map((s) => s.id),
      })
      if (result.success) {
        toast.success(t.toasts.stopReordered)
        router.refresh()
      } else {
        toast.error(t.errors.internalError)
      }
    })
  }

  function handleDelete(id: string) {
    if (!window.confirm(t.stops.deleteConfirm)) return
    startTransition(async () => {
      const result = await deleteStop(id)
      if (result.success) {
        toast.success(t.toasts.stopDeleted)
        router.refresh()
      } else {
        toast.error(t.errors.internalError)
      }
    })
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">{t.stops.title}</CardTitle>
        <Button
          size="sm"
          onClick={() => setOpen(true)}
          disabled={pending}
          type="button"
        >
          {t.stops.addButton}
        </Button>
      </CardHeader>
      <CardContent>
        {stops.length === 0 ? (
          <TransportationEmptyState title={t.empty.noStops} />
        ) : (
          <ol className="space-y-2">
            {stops.map((s, idx) => (
              <li
                key={s.id}
                className="flex items-center justify-between rounded-md border px-3 py-2"
              >
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground font-mono text-sm">
                    #{s.stopOrder}
                  </span>
                  <div>
                    <p className="text-sm font-medium">{s.name}</p>
                    {s.address ? (
                      <p className="text-muted-foreground text-xs">
                        {s.address}
                      </p>
                    ) : null}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {s.pickupTime ? (
                    <span className="text-muted-foreground text-xs">
                      {s.pickupTime}
                    </span>
                  ) : null}
                  <Button
                    size="sm"
                    variant="ghost"
                    type="button"
                    disabled={idx === 0 || pending}
                    onClick={() => handleMove(s.id, -1)}
                    aria-label={t.stops.moveUp}
                  >
                    ↑
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    type="button"
                    disabled={idx === stops.length - 1 || pending}
                    onClick={() => handleMove(s.id, 1)}
                    aria-label={t.stops.moveDown}
                  >
                    ↓
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    type="button"
                    onClick={() => handleDelete(s.id)}
                    disabled={pending}
                  >
                    {dictionary.common?.delete ?? "Delete"}
                  </Button>
                </div>
              </li>
            ))}
          </ol>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <form onSubmit={handleAdd} className="space-y-4">
            <DialogHeader>
              <DialogTitle>{t.stops.addButton}</DialogTitle>
            </DialogHeader>

            <div className="grid gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="stopName">{t.stops.fields.name}</Label>
                <Input
                  id="stopName"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="stopAddress">{t.stops.fields.address}</Label>
                <Input
                  id="stopAddress"
                  value={form.address}
                  onChange={(e) =>
                    setForm({ ...form, address: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="pickupTime">
                    {t.stops.fields.pickupTime}
                  </Label>
                  <Input
                    id="pickupTime"
                    type="time"
                    value={form.pickupTime}
                    onChange={(e) =>
                      setForm({ ...form, pickupTime: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="dropoffTime">
                    {t.stops.fields.dropoffTime}
                  </Label>
                  <Input
                    id="dropoffTime"
                    type="time"
                    value={form.dropoffTime}
                    onChange={(e) =>
                      setForm({ ...form, dropoffTime: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                type="button"
                onClick={() => setOpen(false)}
              >
                {dictionary.common?.cancel ?? "Cancel"}
              </Button>
              <Button type="submit" disabled={pending}>
                {dictionary.common?.save ?? "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

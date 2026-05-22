"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import type { RouteStop } from "@prisma/client"
import { toast } from "sonner"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
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
import { resolveTransportationError } from "../error-map"

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
  const [deleteId, setDeleteId] = useState<string | null>(null)
  // Local optimistic order — survives until the server returns
  const [stops, setStops] = useState<RouteStop[]>(() =>
    [...initialStops].sort((a, b) => a.stopOrder - b.stopOrder)
  )

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 }, // tap-vs-drag disambiguation
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  function persistOrder(nextOrder: RouteStop[]) {
    startTransition(async () => {
      const result = await reorderStops({
        routeId,
        stopIds: nextOrder.map((s) => s.id),
      })
      if (result.success) {
        toast.success(t.toasts.stopReordered)
        router.refresh()
      } else {
        toast.error(
          resolveTransportationError(
            t,
            "error" in result ? result.error : undefined
          )
        )
        // Roll back optimistic state on failure
        setStops([...initialStops].sort((a, b) => a.stopOrder - b.stopOrder))
      }
    })
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = stops.findIndex((s) => s.id === active.id)
    const newIndex = stops.findIndex((s) => s.id === over.id)
    if (oldIndex < 0 || newIndex < 0) return
    const next = arrayMove(stops, oldIndex, newIndex)
    setStops(next)
    persistOrder(next)
  }

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
        toast.error(
          resolveTransportationError(
            t,
            "error" in result ? result.error : undefined
          )
        )
      }
    })
  }

  function confirmDelete() {
    if (!deleteId) return
    const id = deleteId
    setDeleteId(null)
    startTransition(async () => {
      const result = await deleteStop(id)
      if (result.success) {
        toast.success(t.toasts.stopDeleted)
        router.refresh()
      } else {
        toast.error(
          resolveTransportationError(
            t,
            "error" in result ? result.error : undefined
          )
        )
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
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={stops.map((s) => s.id)}
              strategy={verticalListSortingStrategy}
            >
              <ol className="space-y-2">
                {stops.map((s) => (
                  <SortableStopItem
                    key={s.id}
                    stop={s}
                    pending={pending}
                    deleteLabel={dictionary.common.delete}
                    dragHandleLabel={t.common.dragHandle}
                    onDelete={() => setDeleteId(s.id)}
                  />
                ))}
              </ol>
            </SortableContext>
          </DndContext>
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
                {dictionary.common.cancel}
              </Button>
              <Button type="submit" disabled={pending}>
                {dictionary.common.save}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleteId !== null}
        onOpenChange={(o) => !o && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{dictionary.common.delete}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.stops.deleteConfirm}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{dictionary.common.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              {dictionary.common.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}

interface ItemProps {
  stop: RouteStop
  pending: boolean
  deleteLabel: string
  dragHandleLabel: string
  onDelete: () => void
}

function SortableStopItem({
  stop,
  pending,
  deleteLabel,
  dragHandleLabel,
  onDelete,
}: ItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stop.id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="bg-card flex items-center justify-between rounded-md border px-3 py-2"
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label={dragHandleLabel}
          className="text-muted-foreground hover:text-foreground cursor-grab touch-none px-1 active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          ⋮⋮
        </button>
        <span className="text-muted-foreground font-mono text-sm">
          #{stop.stopOrder}
        </span>
        <div>
          <p className="text-sm font-medium">{stop.name}</p>
          {stop.address ? (
            <p className="text-muted-foreground text-xs">{stop.address}</p>
          ) : null}
        </div>
      </div>
      <div className="flex items-center gap-1">
        {stop.pickupTime ? (
          <span className="text-muted-foreground text-xs">
            {stop.pickupTime}
          </span>
        ) : null}
        <Button
          size="sm"
          variant="ghost"
          type="button"
          onClick={onDelete}
          disabled={pending}
        >
          {deleteLabel}
        </Button>
      </div>
    </li>
  )
}

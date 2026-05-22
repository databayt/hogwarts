"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import type { Vehicle } from "@prisma/client"
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table"
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
import { Badge } from "@/components/ui/badge"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import {
  createVehicle,
  deleteVehicle,
  updateVehicle,
} from "../actions/vehicles"
import { TransportationEmptyState } from "../empty-state"
import { resolveTransportationError } from "../error-map"

type VehicleType = "BUS" | "VAN" | "CAR" | "MINIBUS"
type VehicleStatus = "ACTIVE" | "INACTIVE" | "MAINTENANCE" | "RETIRED"

interface FormState {
  id?: string
  plateNumber: string
  make: string
  model: string
  year: string
  capacity: string
  vehicleType: VehicleType
  status: VehicleStatus
  notes: string
}

const EMPTY_FORM: FormState = {
  plateNumber: "",
  make: "",
  model: "",
  year: "",
  capacity: "",
  vehicleType: "BUS",
  status: "ACTIVE",
  notes: "",
}

interface Props {
  locale: Locale
  vehicles: Vehicle[]
  dictionary: Dictionary
}

export function VehiclesClient({ vehicles, dictionary }: Props) {
  const t = dictionary.transportation
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const columns = useMemo<ColumnDef<Vehicle>[]>(
    () => [
      { accessorKey: "plateNumber", header: t.vehicles.fields.plateNumber },
      {
        accessorKey: "vehicleType",
        header: t.vehicles.fields.vehicleType,
        cell: ({ row }) =>
          t.vehicles.types[
            row.original.vehicleType as keyof typeof t.vehicles.types
          ] ?? row.original.vehicleType,
      },
      { accessorKey: "capacity", header: t.vehicles.fields.capacity },
      {
        accessorKey: "status",
        header: t.vehicles.fields.status,
        cell: ({ row }) => (
          <Badge variant="outline">
            {t.vehicles.statuses[
              row.original.status as keyof typeof t.vehicles.statuses
            ] ?? row.original.status}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openEdit(row.original)}
              type="button"
            >
              {t.vehicles.editTitle}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeleteId(row.original.id)}
              type="button"
            >
              {dictionary.common.delete}
            </Button>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t]
  )

  const table = useReactTable({
    data: vehicles,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  function openCreate() {
    setForm(EMPTY_FORM)
    setOpen(true)
  }

  function openEdit(v: Vehicle) {
    setForm({
      id: v.id,
      plateNumber: v.plateNumber,
      make: v.make ?? "",
      model: v.model ?? "",
      year: v.year ? String(v.year) : "",
      capacity: String(v.capacity),
      vehicleType: v.vehicleType as VehicleType,
      status: v.status as VehicleStatus,
      notes: v.notes ?? "",
    })
    setOpen(true)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const payload = {
        plateNumber: form.plateNumber.trim(),
        make: form.make.trim() || undefined,
        model: form.model.trim() || undefined,
        year: form.year ? Number(form.year) : undefined,
        capacity: Number(form.capacity),
        vehicleType: form.vehicleType,
        status: form.status,
        notes: form.notes.trim() || undefined,
      }
      const result = form.id
        ? await updateVehicle({ id: form.id, ...payload })
        : await createVehicle(payload)

      if (result.success) {
        toast.success(
          form.id ? t.toasts.vehicleUpdated : t.toasts.vehicleCreated
        )
        setOpen(false)
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
      const result = await deleteVehicle(id)
      if (result.success) {
        toast.success(t.toasts.vehicleDeleted)
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
    <div className="flex flex-col gap-4 p-6">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">{t.vehicles.title}</h2>
          <p className="text-muted-foreground text-sm">{t.vehicles.subtitle}</p>
        </div>
        <Button onClick={openCreate}>{t.vehicles.addButton}</Button>
      </header>

      {vehicles.length === 0 ? (
        <TransportationEmptyState
          title={t.empty.noVehicles}
          action={<Button onClick={openCreate}>{t.vehicles.addButton}</Button>}
        />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((hg) => (
                <TableRow key={hg.id}>
                  {hg.headers.map((h) => (
                    <TableHead key={h.id}>
                      {flexRender(h.column.columnDef.header, h.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <DialogHeader>
              <DialogTitle>
                {form.id ? t.vehicles.editTitle : t.vehicles.addButton}
              </DialogTitle>
            </DialogHeader>

            <div className="grid gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="plateNumber">
                  {t.vehicles.fields.plateNumber}
                </Label>
                <Input
                  id="plateNumber"
                  value={form.plateNumber}
                  onChange={(e) =>
                    setForm({ ...form, plateNumber: e.target.value })
                  }
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="capacity">{t.vehicles.fields.capacity}</Label>
                  <Input
                    id="capacity"
                    type="number"
                    min={1}
                    value={form.capacity}
                    onChange={(e) =>
                      setForm({ ...form, capacity: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="year">{t.vehicles.fields.year}</Label>
                  <Input
                    id="year"
                    type="number"
                    value={form.year}
                    onChange={(e) => setForm({ ...form, year: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label>{t.vehicles.fields.vehicleType}</Label>
                  <Select
                    value={form.vehicleType}
                    onValueChange={(v) =>
                      setForm({ ...form, vehicleType: v as VehicleType })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(["BUS", "VAN", "CAR", "MINIBUS"] as VehicleType[]).map(
                        (v) => (
                          <SelectItem key={v} value={v}>
                            {t.vehicles.types[v]}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label>{t.vehicles.fields.status}</Label>
                  <Select
                    value={form.status}
                    onValueChange={(v) =>
                      setForm({ ...form, status: v as VehicleStatus })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(
                        [
                          "ACTIVE",
                          "INACTIVE",
                          "MAINTENANCE",
                          "RETIRED",
                        ] as VehicleStatus[]
                      ).map((s) => (
                        <SelectItem key={s} value={s}>
                          {t.vehicles.statuses[s]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="make">{t.vehicles.fields.make}</Label>
                  <Input
                    id="make"
                    value={form.make}
                    onChange={(e) => setForm({ ...form, make: e.target.value })}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="model">{t.vehicles.fields.model}</Label>
                  <Input
                    id="model"
                    value={form.model}
                    onChange={(e) =>
                      setForm({ ...form, model: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="notes">{t.vehicles.fields.notes}</Label>
                <Textarea
                  id="notes"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={3}
                />
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
              {t.vehicles.deleteConfirm}
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
    </div>
  )
}

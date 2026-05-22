"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useMemo, useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import type { Vehicle } from "@prisma/client"
import {
  flexRender,
  getCoreRowModel,
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
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { createRoute, deleteRoute } from "../actions/routes"
import { TransportationEmptyState } from "../empty-state"
import { resolveTransportationError } from "../error-map"
import type { DriverRow, RouteRow } from "../shared/types"

type RouteDirection = "PICKUP" | "DROPOFF" | "ROUND_TRIP"
type RouteStatus = "ACTIVE" | "INACTIVE" | "ARCHIVED"

interface FormState {
  name: string
  code: string
  direction: RouteDirection
  status: RouteStatus
  originName: string
  destinationName: string
  departureTime: string
  returnTime: string
  monthlyFee: string
  vehicleId: string
  driverId: string
  geofenceId: string
}

const EMPTY_FORM: FormState = {
  name: "",
  code: "",
  direction: "ROUND_TRIP",
  status: "ACTIVE",
  originName: "",
  destinationName: "",
  departureTime: "07:00",
  returnTime: "",
  monthlyFee: "",
  vehicleId: "",
  driverId: "",
  geofenceId: "__none__",
}

interface Props {
  locale: Locale
  routes: RouteRow[]
  vehicles: Vehicle[]
  drivers: DriverRow[]
  geofences: { id: string; name: string }[]
  dictionary: Dictionary
}

export function RoutesClient({
  locale,
  routes,
  vehicles,
  drivers,
  geofences,
  dictionary,
}: Props) {
  const t = dictionary.transportation
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const columns = useMemo<ColumnDef<RouteRow>[]>(
    () => [
      {
        accessorKey: "name",
        header: t.routes.fields.name,
        cell: ({ row }) => (
          <Link
            className="hover:underline"
            href={`/${locale}/transportation/routes/${row.original.id}`}
          >
            {row.original.name}
          </Link>
        ),
      },
      { accessorKey: "code", header: t.routes.fields.code },
      {
        accessorKey: "direction",
        header: t.routes.fields.direction,
        cell: ({ row }) =>
          t.routes.directions[
            row.original.direction as keyof typeof t.routes.directions
          ] ?? row.original.direction,
      },
      { accessorKey: "departureTime", header: t.routes.fields.departureTime },
      {
        id: "stops",
        header: t.routes.fields.stops,
        cell: ({ row }) => row.original._count.stops,
      },
      {
        id: "students",
        header: t.assignments.title,
        cell: ({ row }) => row.original._count.assignments,
      },
      {
        accessorKey: "status",
        header: t.routes.fields.status,
        cell: ({ row }) => (
          <Badge variant="outline">
            {t.routes.statuses[
              row.original.status as keyof typeof t.routes.statuses
            ] ?? row.original.status}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link
                href={`/${locale}/transportation/routes/${row.original.id}`}
              >
                {t.routes.editTitle}
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={() => setDeleteId(row.original.id)}
            >
              {dictionary.common.delete}
            </Button>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, locale]
  )

  const table = useReactTable({
    data: routes,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const result = await createRoute({
        name: form.name.trim(),
        code: form.code.trim() || undefined,
        direction: form.direction,
        status: form.status,
        originName: form.originName.trim(),
        destinationName: form.destinationName.trim(),
        departureTime: form.departureTime,
        returnTime: form.returnTime || undefined,
        monthlyFee: form.monthlyFee ? Number(form.monthlyFee) : undefined,
        vehicleId: form.vehicleId || undefined,
        driverId: form.driverId || undefined,
        geofenceId:
          form.geofenceId && form.geofenceId !== "__none__"
            ? form.geofenceId
            : undefined,
      })

      if (result.success) {
        toast.success(t.toasts.routeCreated)
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
      const result = await deleteRoute(id)
      if (result.success) {
        toast.success(t.toasts.routeDeleted)
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
          <h2 className="text-2xl font-semibold">{t.routes.title}</h2>
          <p className="text-muted-foreground text-sm">{t.routes.subtitle}</p>
        </div>
        <Button onClick={() => setOpen(true)}>{t.routes.addButton}</Button>
      </header>

      {routes.length === 0 ? (
        <TransportationEmptyState
          title={t.empty.noRoutes}
          action={
            <Button onClick={() => setOpen(true)}>{t.routes.addButton}</Button>
          }
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
        <DialogContent className="max-w-lg">
          <form onSubmit={handleSubmit} className="space-y-4">
            <DialogHeader>
              <DialogTitle>{t.routes.addButton}</DialogTitle>
            </DialogHeader>

            <div className="grid gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="name">{t.routes.fields.name}</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="code">{t.routes.fields.code}</Label>
                  <Input
                    id="code"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="originName">
                    {t.routes.fields.originName}
                  </Label>
                  <Input
                    id="originName"
                    value={form.originName}
                    onChange={(e) =>
                      setForm({ ...form, originName: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="destinationName">
                    {t.routes.fields.destinationName}
                  </Label>
                  <Input
                    id="destinationName"
                    value={form.destinationName}
                    onChange={(e) =>
                      setForm({ ...form, destinationName: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="departureTime">
                    {t.routes.fields.departureTime}
                  </Label>
                  <Input
                    id="departureTime"
                    type="time"
                    value={form.departureTime}
                    onChange={(e) =>
                      setForm({ ...form, departureTime: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="returnTime">
                    {t.routes.fields.returnTime}
                  </Label>
                  <Input
                    id="returnTime"
                    type="time"
                    value={form.returnTime}
                    onChange={(e) =>
                      setForm({ ...form, returnTime: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="monthlyFee">
                    {t.routes.fields.monthlyFee}
                  </Label>
                  <Input
                    id="monthlyFee"
                    type="number"
                    step="0.01"
                    value={form.monthlyFee}
                    onChange={(e) =>
                      setForm({ ...form, monthlyFee: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label>{t.routes.fields.direction}</Label>
                  <Select
                    value={form.direction}
                    onValueChange={(v) =>
                      setForm({ ...form, direction: v as RouteDirection })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(
                        ["PICKUP", "DROPOFF", "ROUND_TRIP"] as RouteDirection[]
                      ).map((d) => (
                        <SelectItem key={d} value={d}>
                          {t.routes.directions[d]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label>{t.routes.fields.status}</Label>
                  <Select
                    value={form.status}
                    onValueChange={(v) =>
                      setForm({ ...form, status: v as RouteStatus })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(
                        ["ACTIVE", "INACTIVE", "ARCHIVED"] as RouteStatus[]
                      ).map((s) => (
                        <SelectItem key={s} value={s}>
                          {t.routes.statuses[s]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label>{t.routes.fields.vehicle}</Label>
                  <Select
                    value={form.vehicleId}
                    onValueChange={(v) => setForm({ ...form, vehicleId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t.routes.fields.vehicle} />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicles.map((v) => (
                        <SelectItem key={v.id} value={v.id}>
                          {v.plateNumber}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label>{t.routes.fields.driver}</Label>
                  <Select
                    value={form.driverId}
                    onValueChange={(v) => setForm({ ...form, driverId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t.routes.fields.driver} />
                    </SelectTrigger>
                    <SelectContent>
                      {drivers.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.firstName} {d.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {geofences.length > 0 && (
                <div className="grid gap-1.5">
                  <Label>{t.routes.fields.geofence}</Label>
                  <Select
                    value={form.geofenceId}
                    onValueChange={(v) => setForm({ ...form, geofenceId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">
                        {t.routes.fields.geofenceNone}
                      </SelectItem>
                      {geofences.map((g) => (
                        <SelectItem key={g.id} value={g.id}>
                          {g.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
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
              {t.routes.deleteConfirm}
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

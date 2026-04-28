"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useMemo, useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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

import { scheduleTrip } from "../actions/trips"
import { TransportationEmptyState } from "../empty-state"
import type { RouteRow } from "../shared/types"

type TripStatus = "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"
type Direction = "PICKUP" | "DROPOFF" | "ROUND_TRIP"

interface TripRow {
  id: string
  scheduledDate: Date | string
  scheduledTime: string
  direction: Direction
  status: TripStatus
  route: { id: string; name: string; code: string | null } | null
  vehicle: { id: string; plateNumber: string } | null
  driver: { id: string; firstName: string; lastName: string } | null
  _count: { boardings: number }
}

interface FormState {
  routeId: string
  direction: Direction
  scheduledDate: string
  scheduledTime: string
}

const EMPTY_FORM: FormState = {
  routeId: "",
  direction: "ROUND_TRIP",
  scheduledDate: new Date().toISOString().slice(0, 10),
  scheduledTime: "07:00",
}

interface Props {
  locale: Locale
  trips: TripRow[]
  routes: RouteRow[]
  dictionary: Dictionary
}

export function TripsClient({ locale, trips, routes, dictionary }: Props) {
  const t = dictionary.transportation
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)

  const columns = useMemo<ColumnDef<TripRow>[]>(
    () => [
      {
        accessorKey: "scheduledDate",
        header: t.trips.fields.scheduledDate,
        cell: ({ row }) =>
          new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          }).format(new Date(row.original.scheduledDate)),
      },
      {
        accessorKey: "scheduledTime",
        header: t.trips.fields.scheduledTime,
      },
      {
        id: "route",
        header: t.trips.fields.route,
        cell: ({ row }) =>
          row.original.route ? (
            <Link
              className="hover:underline"
              href={`/${locale}/transportation/trips/${row.original.id}`}
            >
              {row.original.route.name}
            </Link>
          ) : (
            "—"
          ),
      },
      {
        accessorKey: "direction",
        header: t.trips.fields.direction,
        cell: ({ row }) =>
          t.routes.directions[
            row.original.direction as keyof typeof t.routes.directions
          ] ?? row.original.direction,
      },
      {
        id: "driver",
        header: t.trips.fields.driver,
        cell: ({ row }) =>
          row.original.driver
            ? `${row.original.driver.firstName} ${row.original.driver.lastName}`
            : "—",
      },
      {
        id: "boardings",
        header: t.trips.fields.boardings,
        cell: ({ row }) => row.original._count.boardings,
      },
      {
        accessorKey: "status",
        header: t.trips.fields.status,
        cell: ({ row }) => (
          <Badge variant="outline">
            {t.trips.statuses[
              row.original.status as keyof typeof t.trips.statuses
            ] ?? row.original.status}
          </Badge>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, locale]
  )

  const table = useReactTable({
    data: trips,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const result = await scheduleTrip({
        routeId: form.routeId,
        direction: form.direction,
        scheduledDate: new Date(form.scheduledDate).toISOString(),
        scheduledTime: form.scheduledTime,
      })
      if (result.success) {
        toast.success(t.trips.toasts.scheduled)
        setOpen(false)
        setForm(EMPTY_FORM)
        router.refresh()
      } else {
        const code = "error" in result ? result.error : ""
        toast.error(
          code === "TRIP_DUPLICATE"
            ? t.trips.errors.duplicate
            : t.errors.internalError
        )
      }
    })
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">{t.trips.title}</h2>
          <p className="text-muted-foreground text-sm">{t.trips.subtitle}</p>
        </div>
        <Button onClick={() => setOpen(true)}>{t.trips.addButton}</Button>
      </header>

      {trips.length === 0 ? (
        <TransportationEmptyState
          title={t.trips.empty}
          action={
            <Button onClick={() => setOpen(true)}>{t.trips.addButton}</Button>
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
        <DialogContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <DialogHeader>
              <DialogTitle>{t.trips.addButton}</DialogTitle>
            </DialogHeader>

            <div className="grid gap-3">
              <div className="grid gap-1.5">
                <Label>{t.trips.fields.route}</Label>
                <Select
                  value={form.routeId}
                  onValueChange={(v) => setForm({ ...form, routeId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t.trips.fields.route} />
                  </SelectTrigger>
                  <SelectContent>
                    {routes.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="grid gap-1.5">
                  <Label>{t.trips.fields.direction}</Label>
                  <Select
                    value={form.direction}
                    onValueChange={(v) =>
                      setForm({ ...form, direction: v as Direction })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(["PICKUP", "DROPOFF", "ROUND_TRIP"] as Direction[]).map(
                        (d) => (
                          <SelectItem key={d} value={d}>
                            {t.routes.directions[d]}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label>{t.trips.fields.scheduledDate}</Label>
                  <input
                    type="date"
                    className="border-input bg-background flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm"
                    value={form.scheduledDate}
                    onChange={(e) =>
                      setForm({ ...form, scheduledDate: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label>{t.trips.fields.scheduledTime}</Label>
                  <input
                    type="time"
                    className="border-input bg-background flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm"
                    value={form.scheduledTime}
                    onChange={(e) =>
                      setForm({ ...form, scheduledTime: e.target.value })
                    }
                    required
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
              <Button type="submit" disabled={pending || !form.routeId}>
                {dictionary.common?.save ?? "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

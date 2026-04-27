"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useMemo, useState, useTransition } from "react"
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

import { assignStudentToRoute, endAssignment } from "../actions/assignments"
import { TransportationEmptyState } from "../empty-state"
import type { RouteAssignmentRow, RouteRow } from "../shared/types"

type Direction = "PICKUP" | "DROPOFF" | "ROUND_TRIP"

interface FormState {
  studentId: string
  routeId: string
  stopId: string
  direction: Direction
  effectiveFrom: string
}

const EMPTY_FORM: FormState = {
  studentId: "",
  routeId: "",
  stopId: "",
  direction: "ROUND_TRIP",
  effectiveFrom: new Date().toISOString().slice(0, 10),
}

interface StudentLite {
  id: string
  firstName: string
  lastName: string
}

type StopLite = { id: string; name: string; stopOrder: number }

interface Props {
  locale: Locale
  assignments: RouteAssignmentRow[]
  routes: RouteRow[]
  students: StudentLite[]
  stopsByRoute: Record<string, StopLite[]>
  dictionary: Dictionary
}

export function AssignmentsClient({
  locale,
  assignments,
  routes,
  students,
  stopsByRoute,
  dictionary,
}: Props) {
  const t = dictionary.transportation
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const stopsForRoute = form.routeId ? (stopsByRoute[form.routeId] ?? []) : []

  const columns = useMemo<ColumnDef<RouteAssignmentRow>[]>(
    () => [
      {
        id: "student",
        header: t.assignments.fields.student,
        cell: ({ row }) =>
          row.original.student
            ? `${row.original.student.firstName} ${row.original.student.lastName}`
            : "—",
      },
      {
        id: "route",
        header: t.assignments.fields.route,
        cell: ({ row }) => row.original.route?.name ?? "—",
      },
      {
        id: "stop",
        header: t.assignments.fields.stop,
        cell: ({ row }) => row.original.stop?.name ?? "—",
      },
      {
        accessorKey: "direction",
        header: t.assignments.fields.direction,
        cell: ({ row }) =>
          t.routes.directions[
            row.original.direction as keyof typeof t.routes.directions
          ] ?? row.original.direction,
      },
      {
        accessorKey: "effectiveFrom",
        header: t.assignments.fields.effectiveFrom,
        cell: ({ row }) =>
          new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          }).format(new Date(row.original.effectiveFrom)),
      },
      {
        accessorKey: "status",
        header: t.assignments.fields.status,
        cell: ({ row }) => (
          <Badge variant="outline">
            {t.assignments.statuses[
              row.original.status as keyof typeof t.assignments.statuses
            ] ?? row.original.status}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) =>
          row.original.status === "ACTIVE" ? (
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={() => handleEnd(row.original.id)}
              >
                {t.assignments.deleteConfirm}
              </Button>
            </div>
          ) : null,
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, locale]
  )

  const table = useReactTable({
    data: assignments,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  function onRouteChange(routeId: string) {
    setForm((prev) => ({ ...prev, routeId, stopId: "" }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const result = await assignStudentToRoute({
        studentId: form.studentId,
        routeId: form.routeId,
        stopId: form.stopId,
        direction: form.direction,
        effectiveFrom: new Date(form.effectiveFrom).toISOString(),
        status: "ACTIVE",
      })
      if (result.success) {
        toast.success(t.toasts.assignmentCreated)
        setOpen(false)
        setForm(EMPTY_FORM)
        router.refresh()
      } else {
        toast.error(t.errors.internalError)
      }
    })
  }

  function handleEnd(id: string) {
    if (!window.confirm(t.assignments.deleteConfirm)) return
    startTransition(async () => {
      const result = await endAssignment({ id })
      if (result.success) {
        toast.success(t.toasts.assignmentEnded)
        router.refresh()
      } else {
        toast.error(t.errors.internalError)
      }
    })
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">{t.assignments.title}</h2>
          <p className="text-muted-foreground text-sm">
            {t.assignments.subtitle}
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>{t.assignments.addButton}</Button>
      </header>

      {assignments.length === 0 ? (
        <TransportationEmptyState
          title={t.empty.noAssignments}
          action={
            <Button onClick={() => setOpen(true)}>
              {t.assignments.addButton}
            </Button>
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
              <DialogTitle>{t.assignments.addButton}</DialogTitle>
            </DialogHeader>

            <div className="grid gap-3">
              <div className="grid gap-1.5">
                <Label>{t.assignments.fields.student}</Label>
                <Select
                  value={form.studentId}
                  onValueChange={(v) => setForm({ ...form, studentId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t.assignments.fields.student} />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.firstName} {s.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-1.5">
                <Label>{t.assignments.fields.route}</Label>
                <Select value={form.routeId} onValueChange={onRouteChange}>
                  <SelectTrigger>
                    <SelectValue placeholder={t.assignments.fields.route} />
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

              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label>{t.assignments.fields.direction}</Label>
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
                  <Label htmlFor="effectiveFrom">
                    {t.assignments.fields.effectiveFrom}
                  </Label>
                  <input
                    id="effectiveFrom"
                    type="date"
                    className="border-input bg-background flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm"
                    value={form.effectiveFrom}
                    onChange={(e) =>
                      setForm({ ...form, effectiveFrom: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid gap-1.5">
                <Label>{t.assignments.fields.stop}</Label>
                <Select
                  value={form.stopId}
                  onValueChange={(v) => setForm({ ...form, stopId: v })}
                  disabled={!form.routeId || stopsForRoute.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t.assignments.fields.stop} />
                  </SelectTrigger>
                  <SelectContent>
                    {stopsForRoute.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        #{s.stopOrder} — {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
              <Button
                type="submit"
                disabled={
                  pending || !form.studentId || !form.routeId || !form.stopId
                }
              >
                {dictionary.common?.save ?? "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

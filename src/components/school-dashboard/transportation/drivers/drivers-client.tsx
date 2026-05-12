"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
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

import { createDriver, deleteDriver, updateDriver } from "../actions/drivers"
import { TransportationEmptyState } from "../empty-state"
import type { DriverRow } from "../shared/types"

type DriverStatus = "ACTIVE" | "ON_LEAVE" | "INACTIVE"

interface FormState {
  id?: string
  firstName: string
  lastName: string
  phone: string
  email: string
  licenseNumber: string
  licenseClass: string
  licenseExpiry: string
  status: DriverStatus
}

const EMPTY_FORM: FormState = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  licenseNumber: "",
  licenseClass: "",
  licenseExpiry: "",
  status: "ACTIVE",
}

interface Props {
  locale: Locale
  drivers: DriverRow[]
  dictionary: Dictionary
}

function isExpiringSoon(date: Date | string) {
  const days = (new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  return days <= 30
}

export function DriversClient({ drivers, dictionary, locale }: Props) {
  const t = dictionary.transportation
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)

  const columns = useMemo<ColumnDef<DriverRow>[]>(
    () => [
      {
        id: "name",
        header: t.drivers.fields.firstName,
        cell: ({ row }) => `${row.original.firstName} ${row.original.lastName}`,
      },
      { accessorKey: "phone", header: t.drivers.fields.phone },
      {
        accessorKey: "licenseNumber",
        header: t.drivers.fields.licenseNumber,
      },
      {
        accessorKey: "licenseExpiry",
        header: t.drivers.fields.licenseExpiry,
        cell: ({ row }) => {
          const date = row.original.licenseExpiry
          const formatted = new Intl.DateTimeFormat(
            locale === "ar" ? "ar-EG" : "en-US",
            { year: "numeric", month: "short", day: "numeric" }
          ).format(new Date(date))
          const expiringSoon = isExpiringSoon(date)
          return (
            <span className="flex items-center gap-2">
              {formatted}
              {expiringSoon ? (
                <Badge variant="outline">{t.drivers.licenseExpiringSoon}</Badge>
              ) : null}
            </span>
          )
        },
      },
      {
        accessorKey: "status",
        header: t.drivers.fields.status,
        cell: ({ row }) => (
          <Badge variant="outline">
            {t.drivers.statuses[
              row.original.status as keyof typeof t.drivers.statuses
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
              type="button"
              onClick={() => openEdit(row.original)}
            >
              {t.drivers.editTitle}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={() => handleDelete(row.original.id)}
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
    data: drivers,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  function openCreate() {
    setForm(EMPTY_FORM)
    setOpen(true)
  }

  function openEdit(d: DriverRow) {
    setForm({
      id: d.id,
      firstName: d.firstName,
      lastName: d.lastName,
      phone: d.phone,
      email: d.email ?? "",
      licenseNumber: d.licenseNumber,
      licenseClass: d.licenseClass ?? "",
      licenseExpiry: new Date(d.licenseExpiry).toISOString().slice(0, 10),
      status: d.status as DriverStatus,
    })
    setOpen(true)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const payload = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        licenseNumber: form.licenseNumber.trim(),
        licenseClass: form.licenseClass.trim() || undefined,
        licenseExpiry: new Date(form.licenseExpiry).toISOString(),
        status: form.status,
      }
      const result = form.id
        ? await updateDriver({ id: form.id, ...payload })
        : await createDriver(payload)

      if (result.success) {
        toast.success(form.id ? t.toasts.driverUpdated : t.toasts.driverCreated)
        setOpen(false)
        router.refresh()
      } else {
        toast.error(t.errors.internalError)
      }
    })
  }

  function handleDelete(id: string) {
    if (!window.confirm(t.drivers.deleteConfirm)) return
    startTransition(async () => {
      const result = await deleteDriver(id)
      if (result.success) {
        toast.success(t.toasts.driverDeleted)
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
          <h2 className="text-2xl font-semibold">{t.drivers.title}</h2>
          <p className="text-muted-foreground text-sm">{t.drivers.subtitle}</p>
        </div>
        <Button onClick={openCreate}>{t.drivers.addButton}</Button>
      </header>

      {drivers.length === 0 ? (
        <TransportationEmptyState
          title={t.empty.noDrivers}
          action={<Button onClick={openCreate}>{t.drivers.addButton}</Button>}
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
                {form.id ? t.drivers.editTitle : t.drivers.addButton}
              </DialogTitle>
            </DialogHeader>

            <div className="grid gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="firstName">
                    {t.drivers.fields.firstName}
                  </Label>
                  <Input
                    id="firstName"
                    value={form.firstName}
                    onChange={(e) =>
                      setForm({ ...form, firstName: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="lastName">{t.drivers.fields.lastName}</Label>
                  <Input
                    id="lastName"
                    value={form.lastName}
                    onChange={(e) =>
                      setForm({ ...form, lastName: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="phone">{t.drivers.fields.phone}</Label>
                  <Input
                    id="phone"
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="email">{t.drivers.fields.email}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="licenseNumber">
                    {t.drivers.fields.licenseNumber}
                  </Label>
                  <Input
                    id="licenseNumber"
                    value={form.licenseNumber}
                    onChange={(e) =>
                      setForm({ ...form, licenseNumber: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="licenseClass">
                    {t.drivers.fields.licenseClass}
                  </Label>
                  <Input
                    id="licenseClass"
                    value={form.licenseClass}
                    onChange={(e) =>
                      setForm({ ...form, licenseClass: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="licenseExpiry">
                    {t.drivers.fields.licenseExpiry}
                  </Label>
                  <Input
                    id="licenseExpiry"
                    type="date"
                    value={form.licenseExpiry}
                    onChange={(e) =>
                      setForm({ ...form, licenseExpiry: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label>{t.drivers.fields.status}</Label>
                  <Select
                    value={form.status}
                    onValueChange={(v) =>
                      setForm({ ...form, status: v as DriverStatus })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(
                        ["ACTIVE", "ON_LEAVE", "INACTIVE"] as DriverStatus[]
                      ).map((s) => (
                        <SelectItem key={s} value={s}>
                          {t.drivers.statuses[s]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
    </div>
  )
}

"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import Link from "next/link"
import { ColumnDef } from "@tanstack/react-table"
import { Ellipsis } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useModal } from "@/components/atom/modal/context"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import { DataTableColumnHeader } from "@/components/table/data-table-column-header"

import { EventRow } from "./types"

export type { EventRow }

export interface EventColumnCallbacks {
  onDelete?: (row: EventRow) => void
}

const getStatusBadge = (status: string, lang?: Locale) => {
  const variants: Record<
    string,
    "default" | "secondary" | "destructive" | "outline"
  > = {
    PLANNED: "default",
    IN_PROGRESS: "secondary",
    COMPLETED: "outline",
    CANCELLED: "destructive",
  }

  const labels: Record<string, { en: string; ar: string }> = {
    PLANNED: { en: "Planned", ar: "مخطط" },
    IN_PROGRESS: { en: "In Progress", ar: "قيد التنفيذ" },
    COMPLETED: { en: "Completed", ar: "مكتمل" },
    CANCELLED: { en: "Cancelled", ar: "ملغي" },
  }

  const label = labels[status]?.[lang || "en"] || status.replace("_", " ")

  return <Badge variant={variants[status] || "default"}>{label}</Badge>
}

const getEventTypeBadge = (type: string, lang?: Locale) => {
  const variants: Record<
    string,
    "default" | "secondary" | "destructive" | "outline"
  > = {
    ACADEMIC: "default",
    SPORTS: "secondary",
    CULTURAL: "outline",
    PARENT_MEETING: "destructive",
    CELEBRATION: "default",
    WORKSHOP: "secondary",
    OTHER: "outline",
  }

  const labels: Record<string, { en: string; ar: string }> = {
    ACADEMIC: { en: "Academic", ar: "أكاديمي" },
    SPORTS: { en: "Sports", ar: "رياضي" },
    CULTURAL: { en: "Cultural", ar: "ثقافي" },
    PARENT_MEETING: { en: "Parent Meeting", ar: "اجتماع أولياء الأمور" },
    CELEBRATION: { en: "Celebration", ar: "احتفال" },
    WORKSHOP: { en: "Workshop", ar: "ورشة عمل" },
    OTHER: { en: "Other", ar: "أخرى" },
  }

  const label = labels[type]?.[lang || "en"] || type.replace("_", " ")

  return <Badge variant={variants[type] || "default"}>{label}</Badge>
}

export const getEventColumns = (
  dictionary?: Dictionary["school"]["events"],
  lang?: Locale,
  callbacks?: EventColumnCallbacks
): ColumnDef<EventRow>[] => {
  const statuses = dictionary?.statuses as Record<string, string> | undefined
  const types = dictionary?.types as Record<string, string> | undefined

  const t = {
    title: dictionary?.title || "Title",
    type: dictionary?.type || "Type",
    date: dictionary?.date || "Date",
    startTime: dictionary?.startTime || "Start Time",
    location: dictionary?.location || "Location",
    organizer: dictionary?.organizer || "Organizer",
    audience: dictionary?.audience || "Audience",
    attendees: dictionary?.attendees || "Attendees",
    status: dictionary?.status || "Status",
    actions: dictionary?.actions || "Actions",
    view: dictionary?.view || "View",
    edit: dictionary?.edit || "Edit",
    delete: dictionary?.delete || "Delete",
  }

  return [
    {
      accessorKey: "title",
      id: "title",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.title} />
      ),
      meta: { label: t.title, variant: "text" },
      enableColumnFilter: true,
    },
    {
      accessorKey: "eventType",
      id: "eventType",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.type} />
      ),
      cell: ({ getValue }) => getEventTypeBadge(getValue<string>(), lang),
      meta: {
        label: t.type,
        variant: "select",
        options: [
          { label: types?.ACADEMIC || "Academic", value: "ACADEMIC" },
          { label: types?.SPORTS || "Sports", value: "SPORTS" },
          { label: types?.CULTURAL || "Cultural", value: "CULTURAL" },
          {
            label: types?.PARENT_MEETING || "Parent Meeting",
            value: "PARENT_MEETING",
          },
          { label: types?.CELEBRATION || "Celebration", value: "CELEBRATION" },
          { label: types?.WORKSHOP || "Workshop", value: "WORKSHOP" },
          { label: types?.OTHER || "Other", value: "OTHER" },
        ],
      },
      enableColumnFilter: true,
    },
    {
      accessorKey: "eventDate",
      id: "eventDate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.date} />
      ),
      cell: ({ getValue }) => (
        <span className="text-muted-foreground text-xs tabular-nums">
          {new Date(getValue<string>()).toLocaleDateString(
            lang === "ar" ? "ar-SA" : "en-US"
          )}
        </span>
      ),
      meta: { label: t.date, variant: "text" },
    },
    {
      accessorKey: "startTime",
      id: "startTime",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.startTime} />
      ),
      cell: ({ getValue }) => (
        <span className="text-xs tabular-nums">{getValue<string>()}</span>
      ),
      meta: { label: t.startTime, variant: "text" },
    },
    {
      accessorKey: "location",
      id: "location",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.location} />
      ),
      cell: ({ getValue }) => (
        <span className="text-xs">{getValue<string>()}</span>
      ),
      meta: { label: t.location, variant: "text" },
      enableColumnFilter: true,
    },
    {
      accessorKey: "organizer",
      id: "organizer",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.organizer} />
      ),
      cell: ({ getValue }) => (
        <span className="text-xs">{getValue<string>()}</span>
      ),
      meta: { label: t.organizer, variant: "text" },
    },
    {
      accessorKey: "targetAudience",
      id: "targetAudience",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.audience} />
      ),
      cell: ({ getValue }) => (
        <span className="text-xs">{getValue<string>()}</span>
      ),
      meta: { label: t.audience, variant: "text" },
    },
    {
      accessorKey: "currentAttendees",
      id: "currentAttendees",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.attendees} />
      ),
      cell: ({ row }) => {
        const current = row.original.currentAttendees
        const max = row.original.maxAttendees
        return (
          <span className="text-xs tabular-nums">
            {current}
            {max ? `/${max}` : ""}
          </span>
        )
      },
      meta: { label: t.attendees, variant: "text" },
    },
    {
      accessorKey: "status",
      id: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.status} />
      ),
      cell: ({ getValue }) => getStatusBadge(getValue<string>(), lang),
      meta: {
        label: t.status,
        variant: "select",
        options: [
          { label: statuses?.PLANNED || "Planned", value: "PLANNED" },
          {
            label: statuses?.IN_PROGRESS || "In Progress",
            value: "IN_PROGRESS",
          },
          { label: statuses?.COMPLETED || "Completed", value: "COMPLETED" },
          { label: statuses?.CANCELLED || "Cancelled", value: "CANCELLED" },
        ],
      },
      enableColumnFilter: true,
    },
    {
      id: "actions",
      header: () => <span className="sr-only">{t.actions}</span>,
      cell: ({ row }) => {
        const event = row.original
        const { openModal } = useModal()

        const onEdit = () => openModal(event.id)

        const onDelete = () => {
          callbacks?.onDelete?.(event)
        }

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <Ellipsis className="h-4 w-4" />
                <span className="sr-only">{t.actions}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{t.actions}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={`/${lang}/events/${event.id}`}>{t.view}</Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onEdit}>{t.edit}</DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete}>{t.delete}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
      enableSorting: false,
      enableColumnFilter: false,
    },
  ]
}

// NOTE: Do NOT export pre-generated columns. Always use getEventColumns()
// inside useMemo in client components to avoid SSR hook issues.

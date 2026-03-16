"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { ColumnDef } from "@tanstack/react-table"
import { Eye } from "lucide-react"

import { formatDate } from "@/lib/i18n-format"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { ActionMenu, ActionMenuItem } from "@/components/atom/action-menu"
import { useModal } from "@/components/atom/modal/context"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import { DataTableColumnHeader } from "@/components/table/data-table-column-header"

import type { ExamTemplateRow } from "./types"

export type { ExamTemplateRow }

export const getTemplateColumns = (
  dictionary?: Dictionary
): ColumnDef<ExamTemplateRow>[] => [
  {
    accessorKey: "name",
    id: "name",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={dictionary?.generate?.columns?.templateName || "Template Name"}
      />
    ),
    meta: {
      label: dictionary?.generate?.columns?.templateName || "Template Name",
      variant: "text",
    },
    enableColumnFilter: true,
  },
  {
    accessorKey: "name",
    id: "name",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={dictionary?.generate?.columns?.subject || "Subject"}
      />
    ),
    meta: {
      label: dictionary?.generate?.columns?.subject || "Subject",
      variant: "text",
    },
    enableColumnFilter: true,
  },
  {
    accessorKey: "totalQuestions",
    id: "totalQuestions",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={dictionary?.generate?.columns?.questions || "Questions"}
      />
    ),
    cell: ({ getValue }) => (
      <span className="text-xs font-medium tabular-nums">
        {getValue<number>()}{" "}
        {dictionary?.generate?.columns?.questionsUnit || "questions"}
      </span>
    ),
    meta: {
      label: dictionary?.generate?.columns?.questions || "Questions",
      variant: "text",
    },
  },
  {
    accessorKey: "duration",
    id: "duration",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={dictionary?.generate?.columns?.duration || "Duration"}
      />
    ),
    cell: ({ getValue }) => (
      <span className="text-xs tabular-nums">
        {getValue<number>()}{" "}
        {dictionary?.generate?.columns?.durationUnit || "min"}
      </span>
    ),
    meta: {
      label: dictionary?.generate?.columns?.duration || "Duration",
      variant: "text",
    },
  },
  {
    accessorKey: "totalMarks",
    id: "totalMarks",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={dictionary?.generate?.columns?.totalMarks || "Total Marks"}
      />
    ),
    cell: ({ getValue }) => (
      <span className="text-xs font-medium tabular-nums">
        {getValue<number>()} {dictionary?.generate?.columns?.marksUnit || "pts"}
      </span>
    ),
    meta: {
      label: dictionary?.generate?.columns?.totalMarks || "Total Marks",
      variant: "text",
    },
  },
  {
    accessorKey: "timesUsed",
    id: "timesUsed",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={dictionary?.generate?.columns?.timesUsed || "Times Used"}
      />
    ),
    cell: ({ getValue }) => (
      <span className="text-muted-foreground text-xs tabular-nums">
        {getValue<number>()}{" "}
        {dictionary?.generate?.columns?.timesUnit || "times"}
      </span>
    ),
    meta: {
      label: dictionary?.generate?.columns?.timesUsed || "Times Used",
      variant: "text",
    },
  },
  {
    accessorKey: "isActive",
    id: "isActive",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={dictionary?.generate?.columns?.status || "Status"}
      />
    ),
    cell: ({ getValue }) => (
      <Badge variant={getValue<boolean>() ? "default" : "outline"}>
        {getValue<boolean>()
          ? dictionary?.generate?.columns?.active || "Active"
          : dictionary?.generate?.columns?.inactive || "Inactive"}
      </Badge>
    ),
    meta: {
      label: dictionary?.generate?.columns?.status || "Status",
      variant: "select",
      options: [
        {
          label: dictionary?.generate?.columns?.active || "Active",
          value: "true",
        },
        {
          label: dictionary?.generate?.columns?.inactive || "Inactive",
          value: "false",
        },
      ],
    },
    enableColumnFilter: true,
  },
  {
    accessorKey: "createdAt",
    id: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={dictionary?.generate?.columns?.created || "Created"}
      />
    ),
    cell: ({ getValue }) => (
      <span className="text-muted-foreground text-xs tabular-nums">
        {formatDate(getValue<string>(), "ar")}
      </span>
    ),
    meta: {
      label: dictionary?.generate?.columns?.created || "Created",
      variant: "text",
    },
  },
  {
    id: "actions",
    header: () => (
      <span className="sr-only">
        {dictionary?.generate?.columns?.actions || "Actions"}
      </span>
    ),
    cell: ({ row }) => {
      const template = row.original
      const { openModal } = useModal()

      const onView = () => {
        const qs =
          typeof window !== "undefined" ? window.location.search || "" : ""
        window.location.href = `/generate/templates/${template.id}${qs}`
      }

      const onEdit = () => openModal(template.id)

      const onUseTemplate = () => {
        const qs =
          typeof window !== "undefined" ? window.location.search || "" : ""
        window.location.href = `/generate?templateId=${template.id}${qs}`
      }

      return (
        <ActionMenu
          srLabel={dictionary?.generate?.columns?.openMenu || "Open menu"}
        >
          <DropdownMenuLabel>
            {dictionary?.generate?.columns?.actions || "Actions"}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <ActionMenuItem
            icon={Eye}
            label={dictionary?.generate?.columns?.view || "View"}
            onClick={onView}
          />
          <ActionMenuItem
            label={dictionary?.generate?.columns?.edit || "Pencil"}
            onClick={onEdit}
          />
          <ActionMenuItem
            label={dictionary?.generate?.columns?.useTemplate || "Use Template"}
            onClick={onUseTemplate}
          />
        </ActionMenu>
      )
    },
    enableSorting: false,
    enableColumnFilter: false,
  },
]

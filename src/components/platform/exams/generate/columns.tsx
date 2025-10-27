"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/table/data-table/data-table-column-header";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Eye } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useModal } from "@/components/atom/modal/context";
import { Badge } from "@/components/ui/badge";
import type { ExamTemplateRow } from "./types";

export type { ExamTemplateRow };

export const templateColumns: ColumnDef<ExamTemplateRow>[] = [
  {
    accessorKey: "name",
    id: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Template Name" />
    ),
    meta: { label: "Template Name", variant: "text" },
    enableColumnFilter: true,
  },
  {
    accessorKey: "subjectName",
    id: "subjectName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Subject" />
    ),
    meta: { label: "Subject", variant: "text" },
    enableColumnFilter: true,
  },
  {
    accessorKey: "totalQuestions",
    id: "totalQuestions",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Questions" />
    ),
    cell: ({ getValue }) => (
      <span className="text-xs tabular-nums font-medium">
        {getValue<number>()} questions
      </span>
    ),
    meta: { label: "Questions", variant: "text" },
  },
  {
    accessorKey: "duration",
    id: "duration",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Duration" />
    ),
    cell: ({ getValue }) => (
      <span className="text-xs tabular-nums">{getValue<number>()} min</span>
    ),
    meta: { label: "Duration", variant: "text" },
  },
  {
    accessorKey: "totalMarks",
    id: "totalMarks",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Total Marks" />
    ),
    cell: ({ getValue }) => (
      <span className="text-xs tabular-nums font-medium">
        {getValue<number>()} pts
      </span>
    ),
    meta: { label: "Total Marks", variant: "text" },
  },
  {
    accessorKey: "timesUsed",
    id: "timesUsed",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Times Used" />
    ),
    cell: ({ getValue }) => (
      <span className="text-xs tabular-nums text-muted-foreground">
        {getValue<number>()} times
      </span>
    ),
    meta: { label: "Times Used", variant: "text" },
  },
  {
    accessorKey: "isActive",
    id: "isActive",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ getValue }) => (
      <Badge variant={getValue<boolean>() ? "default" : "outline"}>
        {getValue<boolean>() ? "Active" : "Inactive"}
      </Badge>
    ),
    meta: {
      label: "Status",
      variant: "select",
      options: [
        { label: "Active", value: "true" },
        { label: "Inactive", value: "false" },
      ],
    },
    enableColumnFilter: true,
  },
  {
    accessorKey: "createdAt",
    id: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created" />
    ),
    cell: ({ getValue }) => (
      <span className="text-xs tabular-nums text-muted-foreground">
        {new Date(getValue<string>()).toLocaleDateString()}
      </span>
    ),
    meta: { label: "Created", variant: "text" },
  },
  {
    id: "actions",
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row }) => {
      const template = row.original;
      const { openModal } = useModal();

      const onView = () => {
        const qs =
          typeof window !== "undefined" ? window.location.search || "" : "";
        window.location.href = `/generate/templates/${template.id}${qs}`;
      };

      const onEdit = () => openModal(template.id);

      const onUseTemplate = () => {
        const qs =
          typeof window !== "undefined" ? window.location.search || "" : "";
        window.location.href = `/generate?templateId=${template.id}${qs}`;
      };

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onView}>
              <Eye className="mr-2 h-4 w-4" />
              View
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onEdit}>Edit</DropdownMenuItem>
            <DropdownMenuItem onClick={onUseTemplate}>
              Use Template
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
    enableSorting: false,
    enableColumnFilter: false,
  },
];

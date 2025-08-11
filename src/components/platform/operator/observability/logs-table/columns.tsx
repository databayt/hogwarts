"use client";
import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/table/data-table/data-table-column-header";

export type AuditRow = {
  id: string;
  createdAt: string;
  userEmail: string;
  schoolName: string | null;
  action: string;
  reason: string | null;
  ip?: string | null;
  level?: string | null;
  requestId?: string | null;
};

export const auditColumns: ColumnDef<AuditRow>[] = [
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Time" />
    ),
    meta: { label: "Time", variant: "dateRange" },
  },
  {
    accessorKey: "userEmail",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="User" />
    ),
    meta: { label: "User", variant: "text", placeholder: "email" },
  },
  {
    accessorKey: "ip",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="IP" />
    ),
    meta: { label: "IP", variant: "text", placeholder: "ip" },
  },
  {
    accessorKey: "schoolName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="School" />
    ),
    meta: { label: "School", variant: "text" },
  },
  {
    accessorKey: "action",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Action" />
    ),
    meta: { label: "Action", variant: "text" },
  },
  {
    accessorKey: "level",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Level" />
    ),
    meta: {
      label: "Level",
      variant: "select",
      options: [
        { label: "Info", value: "info" },
        { label: "Warn", value: "warn" },
        { label: "Error", value: "error" },
      ],
    },
  },
  {
    accessorKey: "requestId",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Request ID" />
    ),
    meta: { label: "Request ID", variant: "text", placeholder: "rid" },
  },
  {
    accessorKey: "reason",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Reason" />
    ),
    meta: { label: "Reason", variant: "text" },
  },
];



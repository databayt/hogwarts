"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { deleteCatalogAssignment } from "./assignment-actions"

export interface CatalogAssignmentRow {
  id: string
  title: string
  description: string | null
  lang: string
  assignmentType: string | null
  totalPoints: number | null
  estimatedTime: number | null
  approvalStatus: string
  visibility: string
  usageCount: number
  averageRating: number
  status: string
  tags: string[]
  createdAt: Date
}

function getApprovalVariant(
  status: string
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "APPROVED":
      return "default"
    case "PENDING":
      return "secondary"
    case "REJECTED":
      return "destructive"
    default:
      return "outline"
  }
}

export const assignmentColumns: ColumnDef<CatalogAssignmentRow>[] = [
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ row }) => {
      const { title } = row.original
      return <span className="font-medium">{title}</span>
    },
  },
  {
    accessorKey: "assignmentType",
    header: "Type",
    cell: ({ row }) => {
      const type = row.original.assignmentType
      if (!type) return <span className="text-muted-foreground">-</span>
      return (
        <Badge variant="outline" className="text-xs capitalize">
          {type}
        </Badge>
      )
    },
  },
  {
    accessorKey: "totalPoints",
    header: "Points",
    cell: ({ row }) => {
      const points = row.original.totalPoints
      return points != null ? String(points) : "-"
    },
  },
  {
    accessorKey: "estimatedTime",
    header: "Est. Time",
    cell: ({ row }) => {
      const time = row.original.estimatedTime
      if (!time) return "-"
      if (time < 60) return `${time}m`
      return `${Math.floor(time / 60)}h ${time % 60}m`
    },
  },
  {
    accessorKey: "approvalStatus",
    header: "Approval",
    cell: ({ row }) => {
      const status = row.original.approvalStatus
      return (
        <Badge variant={getApprovalVariant(status)} className="text-xs">
          {status}
        </Badge>
      )
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status
      const variant =
        status === "PUBLISHED"
          ? "default"
          : status === "DRAFT"
            ? "secondary"
            : "outline"
      return (
        <Badge variant={variant} className="text-xs">
          {status}
        </Badge>
      )
    },
  },
  {
    accessorKey: "usageCount",
    header: "Usage",
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const { id } = row.original

      async function handleDelete() {
        if (!confirm("Are you sure you want to delete this assignment?")) return
        await deleteCatalogAssignment(id)
      }

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(id)}>
              Copy ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={handleDelete}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

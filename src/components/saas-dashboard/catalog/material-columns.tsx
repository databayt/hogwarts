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

import { deleteCatalogMaterial } from "./material-actions"

export interface CatalogMaterialRow {
  id: string
  title: string
  description: string | null
  type: string
  lang: string
  fileUrl: string | null
  externalUrl: string | null
  fileSize: number | null
  approvalStatus: string
  visibility: string
  usageCount: number
  downloadCount: number
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

function formatFileSize(bytes: number | null): string {
  if (!bytes) return "-"
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export const materialColumns: ColumnDef<CatalogMaterialRow>[] = [
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ row }) => {
      const { title } = row.original
      return <span className="font-medium">{title}</span>
    },
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => {
      const type = row.original.type
      return (
        <Badge variant="outline" className="text-xs">
          {type.replace("_", " ")}
        </Badge>
      )
    },
  },
  {
    accessorKey: "fileSize",
    header: "Size",
    cell: ({ row }) => formatFileSize(row.original.fileSize),
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
    accessorKey: "downloadCount",
    header: "Downloads",
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const { id, fileUrl, externalUrl } = row.original

      async function handleDelete() {
        if (!confirm("Are you sure you want to delete this material?")) return
        await deleteCatalogMaterial(id)
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
            {(fileUrl || externalUrl) && (
              <DropdownMenuItem asChild>
                <a
                  href={fileUrl || externalUrl || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open File
                </a>
              </DropdownMenuItem>
            )}
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

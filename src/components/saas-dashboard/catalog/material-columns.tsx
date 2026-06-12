"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import type { ContentStatus, ContentVisibility } from "./approval-actions"
import { ContentFlagsDialog } from "./content-flags-dialog"
import { catalogActionError } from "./error-messages"
import { deleteMaterial } from "./material-actions"

export interface MaterialRow {
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

function MaterialRowActions({
  row,
  dictionary,
}: {
  row: MaterialRow
  dictionary?: Dictionary
}) {
  const [flagsOpen, setFlagsOpen] = useState(false)
  const m = dictionary?.operator?.catalog?.manage
  const { id, fileUrl, externalUrl } = row

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this material?")) return
    const result = await deleteMaterial(id)
    if (!result.success) toast.error(catalogActionError(result.error))
  }

  return (
    <>
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
          <DropdownMenuItem onClick={() => setFlagsOpen(true)}>
            {m?.manageFlags ?? "Manage visibility"}
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
          <DropdownMenuItem className="text-destructive" onClick={handleDelete}>
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ContentFlagsDialog
        contentType="Material"
        contentId={id}
        currentVisibility={row.visibility as ContentVisibility}
        currentStatus={row.status as ContentStatus}
        open={flagsOpen}
        onOpenChange={setFlagsOpen}
        dictionary={dictionary}
      />
    </>
  )
}

export function getMaterialColumns(
  dictionary?: Dictionary
): ColumnDef<MaterialRow>[] {
  return [
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
      cell: ({ row }) => (
        <MaterialRowActions row={row.original} dictionary={dictionary} />
      ),
    },
  ]
}

"use client"

import { useMemo, useState, useTransition } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { Check, MoreHorizontal, X } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Textarea } from "@/components/ui/textarea"
import { DataTable } from "@/components/table/data-table"
import { useDataTable } from "@/components/table/use-data-table"

import { approveContent, rejectContent } from "./approval-actions"
import type { PendingItem } from "./approval-content"

function getContentTypeBadge(
  contentType: string
): "default" | "secondary" | "destructive" | "outline" {
  switch (contentType) {
    case "CatalogQuestion":
      return "default"
    case "CatalogMaterial":
      return "secondary"
    case "CatalogAssignment":
      return "outline"
    case "LessonVideo":
      return "destructive"
    default:
      return "outline"
  }
}

function getContentTypeLabel(contentType: string): string {
  switch (contentType) {
    case "CatalogQuestion":
      return "Question"
    case "CatalogMaterial":
      return "Material"
    case "CatalogAssignment":
      return "Assignment"
    case "LessonVideo":
      return "Video"
    default:
      return contentType
  }
}

function ApprovalActions({ item }: { item: PendingItem }) {
  const [isPending, startTransition] = useTransition()
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")

  function handleApprove() {
    startTransition(async () => {
      await approveContent(item.contentType, item.id)
    })
  }

  function handleReject() {
    if (!rejectionReason.trim()) return
    startTransition(async () => {
      await rejectContent(item.contentType, item.id, rejectionReason)
      setRejectDialogOpen(false)
      setRejectionReason("")
    })
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0" disabled={isPending}>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleApprove} disabled={isPending}>
            <Check className="mr-2 h-4 w-4" />
            Approve
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setRejectDialogOpen(true)}
            disabled={isPending}
            className="text-destructive"
          >
            <X className="mr-2 h-4 w-4" />
            Reject
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Content</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting this content. This will be visible
              to the contributor.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Reason for rejection..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isPending || !rejectionReason.trim()}
            >
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

const approvalColumns: ColumnDef<PendingItem>[] = [
  {
    accessorKey: "contentType",
    header: "Type",
    cell: ({ row }) => {
      const type = row.original.contentType
      return (
        <Badge variant={getContentTypeBadge(type)} className="text-xs">
          {getContentTypeLabel(type)}
        </Badge>
      )
    },
  },
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ row }) => {
      const { title } = row.original
      return <span className="font-medium">{title}</span>
    },
  },
  {
    accessorKey: "contributedBy",
    header: "Contributed By",
    cell: ({ row }) => {
      const userId = row.original.contributedBy
      return (
        <span className="text-muted-foreground text-sm">
          {userId || "System"}
        </span>
      )
    },
  },
  {
    accessorKey: "createdAt",
    header: "Submitted",
    cell: ({ row }) => {
      const date = row.original.createdAt
      return (
        <span className="text-muted-foreground text-sm">
          {new Date(date).toLocaleDateString()}
        </span>
      )
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <ApprovalActions item={row.original} />,
  },
]

interface Props {
  data: PendingItem[]
}

export function ApprovalTable({ data }: Props) {
  const columns = useMemo(() => approvalColumns, [])

  const { table } = useDataTable<PendingItem>({
    data,
    columns,
    pageCount: 1,
    initialState: {
      pagination: { pageIndex: 0, pageSize: data.length || 50 },
    },
  })

  return <DataTable table={table} />
}

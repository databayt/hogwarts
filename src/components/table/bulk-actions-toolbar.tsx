"use client"

import * as React from "react"
import type { Table } from "@tanstack/react-table"
import { Download, Mail, Trash2, UserPlus, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

export interface BulkAction<TData> {
  id: string
  label: string
  icon?: React.ReactNode
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost"
  onClick: (selectedRows: TData[]) => void | Promise<void>
  disabled?: boolean
}

interface BulkActionsToolbarProps<TData> {
  table: Table<TData>
  actions: BulkAction<TData>[]
  lang?: "ar" | "en"
  className?: string
}

export function BulkActionsToolbar<TData>({
  table,
  actions,
  lang = "en",
  className,
}: BulkActionsToolbarProps<TData>) {
  const selectedRows = table.getFilteredSelectedRowModel().rows
  const selectedCount = selectedRows.length

  if (selectedCount === 0) {
    return null
  }

  const t = {
    selected: lang === "ar" ? "محدد" : "selected",
    clearSelection: lang === "ar" ? "إلغاء التحديد" : "Clear selection",
  }

  const handleAction = async (action: BulkAction<TData>) => {
    const data = selectedRows.map((row) => row.original)
    await action.onClick(data)
  }

  return (
    <div
      className={cn("fixed inset-x-0 bottom-6 z-50 mx-auto w-fit", className)}
    >
      <div className="bg-background flex items-center gap-2 rounded-lg border px-4 py-2 shadow-lg">
        {/* Selection count */}
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium tabular-nums">{selectedCount}</span>
          <span className="text-muted-foreground">{t.selected}</span>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Action buttons */}
        <div className="flex items-center gap-1">
          {actions.map((action) => (
            <Button
              key={action.id}
              variant={action.variant || "ghost"}
              size="sm"
              onClick={() => handleAction(action)}
              disabled={action.disabled}
              className="h-8"
            >
              {action.icon}
              <span className="ml-1.5">{action.label}</span>
            </Button>
          ))}
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Clear selection */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => table.toggleAllPageRowsSelected(false)}
          className="h-8"
        >
          <X className="h-4 w-4" />
          <span className="sr-only ml-1.5 sm:not-sr-only">
            {t.clearSelection}
          </span>
        </Button>
      </div>
    </div>
  )
}

// Pre-built common actions for convenience
export function createDeleteAction<TData>(
  onDelete: (rows: TData[]) => void | Promise<void>,
  lang?: "ar" | "en"
): BulkAction<TData> {
  return {
    id: "delete",
    label: lang === "ar" ? "حذف" : "Delete",
    icon: <Trash2 className="h-4 w-4" />,
    variant: "destructive",
    onClick: onDelete,
  }
}

export function createExportAction<TData>(
  onExport: (rows: TData[]) => void | Promise<void>,
  lang?: "ar" | "en"
): BulkAction<TData> {
  return {
    id: "export",
    label: lang === "ar" ? "تصدير" : "Export",
    icon: <Download className="h-4 w-4" />,
    variant: "outline",
    onClick: onExport,
  }
}

export function createMessageAction<TData>(
  onMessage: (rows: TData[]) => void | Promise<void>,
  lang?: "ar" | "en"
): BulkAction<TData> {
  return {
    id: "message",
    label: lang === "ar" ? "رسالة" : "Message",
    icon: <Mail className="h-4 w-4" />,
    variant: "secondary",
    onClick: onMessage,
  }
}

export function createEnrollAction<TData>(
  onEnroll: (rows: TData[]) => void | Promise<void>,
  lang?: "ar" | "en"
): BulkAction<TData> {
  return {
    id: "enroll",
    label: lang === "ar" ? "تسجيل" : "Enroll",
    icon: <UserPlus className="h-4 w-4" />,
    variant: "default",
    onClick: onEnroll,
  }
}

"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import type { Task } from "@prisma/client"
import type { Table } from "@tanstack/react-table"
import { Download } from "lucide-react"

import { Button } from "@/components/ui/button"
import { exportTableToCSV } from "@/components/table/lib/export"

import { CreateTaskSheet } from "./create-task-sheet"
import { DeleteTasksDialog } from "./delete-tasks-dialog"

interface TasksTableToolbarActionsProps {
  table: Table<Task>
}

export function TasksTableToolbarActions({
  table,
}: TasksTableToolbarActionsProps) {
  return (
    <div className="flex items-center gap-2">
      {table.getFilteredSelectedRowModel().rows.length > 0 ? (
        <DeleteTasksDialog
          tasks={table
            .getFilteredSelectedRowModel()
            .rows.map((row) => row.original)}
          onSuccess={() => table.toggleAllRowsSelected(false)}
        />
      ) : null}
      <CreateTaskSheet />
      <Button
        variant="outline"
        size="sm"
        onClick={() =>
          exportTableToCSV(table, {
            filename: "tasks",
            excludeColumns: ["select", "actions"],
          })
        }
      >
        <Download />
        Export
      </Button>
      {/**
       * Other actions can be added here.
       * For example, import, view, etc.
       */}
    </div>
  )
}

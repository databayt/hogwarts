"use client"

import * as React from "react"
import type { Task } from "@prisma/client"

import { DataTable } from "@/components/table/data-table"
import { DataTableAdvancedToolbar } from "@/components/table/data-table-advanced-toolbar"
import { DataTableFilterList } from "@/components/table/data-table-filter-list"
import { DataTableFilterMenu } from "@/components/table/data-table-filter-menu"
import { DataTableSortList } from "@/components/table/data-table-sort-list"
import { DataTableToolbar } from "@/components/table/data-table-toolbar"
import type { DataTableRowAction } from "@/components/table/types"
import { useDataTable } from "@/components/table/use-data-table"

import type {
  getEstimatedHoursRange,
  getTaskPriorityCounts,
  getTasks,
  getTaskStatusCounts,
} from "../_lib/queries"
import { DeleteTasksDialog } from "./delete-tasks-dialog"
import { useFeatureFlags } from "./feature-flags-provider"
import { TasksTableActionBar } from "./tasks-table-action-bar"
import { getTasksTableColumns } from "./tasks-table-columns"
import { UpdateTaskSheet } from "./update-task-sheet"

interface TasksTableProps {
  promises: Promise<
    [
      Awaited<ReturnType<typeof getTasks>>,
      Awaited<ReturnType<typeof getTaskStatusCounts>>,
      Awaited<ReturnType<typeof getTaskPriorityCounts>>,
      Awaited<ReturnType<typeof getEstimatedHoursRange>>,
    ]
  >
}

export function TasksTable({ promises }: TasksTableProps) {
  const { enableAdvancedFilter, filterFlag } = useFeatureFlags()

  const [
    { data, pageCount },
    statusCounts,
    priorityCounts,
    estimatedHoursRange,
  ] = React.use(promises)

  const [rowAction, setRowAction] =
    React.useState<DataTableRowAction<Task> | null>(null)

  const columns = React.useMemo(
    () =>
      getTasksTableColumns({
        statusCounts,
        priorityCounts,
        estimatedHoursRange,
        setRowAction,
      }),
    [statusCounts, priorityCounts, estimatedHoursRange]
  )

  const { table, shallow, debounceMs, throttleMs } = useDataTable({
    data,
    columns,
    pageCount,
    enableAdvancedFilter,
    initialState: {
      sorting: [{ id: "createdAt", desc: true }],
      columnPinning: { right: ["actions"] },
    },
    getRowId: (originalRow) => originalRow.id,
    shallow: false,
    clearOnDefault: true,
  })

  return (
    <>
      <DataTable
        table={table}
        actionBar={<TasksTableActionBar table={table} />}
      >
        {enableAdvancedFilter ? (
          <DataTableAdvancedToolbar table={table}>
            <DataTableSortList table={table} align="start" />
            {filterFlag === "advancedFilters" ? (
              <DataTableFilterList
                table={table}
                shallow={shallow}
                debounceMs={debounceMs}
                throttleMs={throttleMs}
                align="start"
              />
            ) : (
              <DataTableFilterMenu
                table={table}
                shallow={shallow}
                debounceMs={debounceMs}
                throttleMs={throttleMs}
              />
            )}
          </DataTableAdvancedToolbar>
        ) : (
          <DataTableToolbar table={table}>
            <DataTableSortList table={table} align="end" />
          </DataTableToolbar>
        )}
      </DataTable>
      <UpdateTaskSheet
        open={rowAction?.variant === "update"}
        onOpenChange={() => setRowAction(null)}
        task={rowAction?.row.original ?? null}
      />
      <DeleteTasksDialog
        open={rowAction?.variant === "delete"}
        onOpenChange={() => setRowAction(null)}
        tasks={rowAction?.row.original ? [rowAction?.row.original] : []}
        showTrigger={false}
        onSuccess={() => rowAction?.row.toggleSelected(false)}
      />
    </>
  )
}

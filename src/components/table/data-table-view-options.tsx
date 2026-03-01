"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import * as React from "react"
import type { Table } from "@tanstack/react-table"
import { Check, ChevronsUpDown, Settings2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DataTableViewOptionsProps<TData> {
  table: Table<TData>
  translations?: {
    view?: string
    searchColumns?: string
    noColumns?: string
    all?: string
  }
}

function DataTableViewOptionsInner<TData>({
  table,
  translations = {},
}: DataTableViewOptionsProps<TData>) {
  const t = {
    view: translations.view || "View",
    searchColumns: translations.searchColumns || "Search columns...",
    noColumns: translations.noColumns || "No columns found.",
    all: translations.all || "All",
  }
  const columns = React.useMemo(
    () =>
      table
        .getAllColumns()
        .filter(
          (column) =>
            typeof column.accessorFn !== "undefined" && column.getCanHide()
        ),
    [table]
  )

  // Check if all columns are visible
  const allVisible = React.useMemo(
    () => columns.every((col) => col.getIsVisible()),
    [columns]
  )

  // Toggle all columns visibility
  const toggleAll = React.useCallback(() => {
    columns.forEach((col) => col.toggleVisibility(!allVisible))
  }, [columns, allVisible])

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          aria-label="Toggle columns"
          role="combobox"
          variant="outline"
          size="sm"
          className="hidden h-9 lg:flex"
        >
          <Settings2 />
          {t.view}
          <ChevronsUpDown className="ms-auto opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-44 p-0">
        <Command>
          <CommandInput placeholder={t.searchColumns} />
          <CommandList>
            <CommandEmpty>{t.noColumns}</CommandEmpty>
            <CommandGroup>
              {/* Select All option */}
              <CommandItem onSelect={toggleAll}>
                <span className="truncate font-medium">{t.all}</span>
                <Check
                  className={cn(
                    "ms-auto size-4 shrink-0",
                    allVisible ? "opacity-100" : "opacity-0"
                  )}
                />
              </CommandItem>
              <CommandSeparator className="my-1" />
              {columns.map((column) => (
                <CommandItem
                  key={column.id}
                  onSelect={() =>
                    column.toggleVisibility(!column.getIsVisible())
                  }
                >
                  <span className="truncate">
                    {column.columnDef.meta?.label ?? column.id}
                  </span>
                  <Check
                    className={cn(
                      "ms-auto size-4 shrink-0",
                      column.getIsVisible() ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export const DataTableViewOptions = React.memo(
  DataTableViewOptionsInner
) as typeof DataTableViewOptionsInner

"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useMemo, useState } from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { displayName } from "@/lib/name-utils"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useNameDisplay } from "@/components/school-dashboard/context/use-name-display"
import { getStudentsForGrade } from "@/components/school-dashboard/listings/grades/wizard/selection/actions"

type Student = {
  id: string
  label: string
  name: string
}

/**
 * Pick one student by typing any of name, grade · section or student
 * number. Outside a form — the grades screens that act on one student
 * (transcripts) use it in place of a typed id.
 */
export function StudentPicker({
  value,
  onChange,
  placeholder,
  searchPlaceholder,
  emptyMessage,
  className,
}: {
  value: string
  onChange: (id: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  className?: string
}) {
  const nameDisplay = useNameDisplay()
  const [open, setOpen] = useState(false)
  const [rows, setRows] =
    useState<Awaited<ReturnType<typeof getStudentsForGrade>>>()

  useEffect(() => {
    let alive = true
    getStudentsForGrade().then((res) => alive && setRows(res))
    return () => {
      alive = false
    }
  }, [])

  const students: Student[] = useMemo(
    () =>
      rows?.success && rows.data
        ? rows.data.map((s) => {
            const name = displayName(s, nameDisplay)
            return {
              id: s.id,
              name,
              label: [name, s.place, s.number].filter(Boolean).join(" — "),
            }
          })
        : [],
    [rows, nameDisplay]
  )
  const selected = students.find((s) => s.id === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-72 justify-between font-normal", className)}
        >
          <span className="truncate">
            {selected ? (
              <bdi dir="auto">{selected.name}</bdi>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </span>
          <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {students.map((s) => (
                <CommandItem
                  key={s.id}
                  // cmdk matches on value; the id keeps namesakes distinct.
                  value={`${s.label} ${s.id}`}
                  onSelect={() => {
                    onChange(s.id)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "size-4",
                      s.id === value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <bdi dir="auto" className="truncate">
                    {s.label}
                  </bdi>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

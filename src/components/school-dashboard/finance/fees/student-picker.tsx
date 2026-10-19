// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

"use client"

import { useEffect, useState } from "react"
import { Check, ChevronsUpDown } from "lucide-react"

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

import { searchFeeStudents } from "./actions"

export interface FeeStudentOption {
  id: string
  name: string
  grade: string | null
}

// Stable default: a fresh `[]` per render would re-fire the search effect.
const NONE: FeeStudentOption[] = []

/**
 * Server-side student search for the fee forms, debounced. With `gradeId`
 * and no search it loads that grade's students; with neither it falls back
 * to `initial` (the page's first rows).
 */
export function useFeeStudentSearch(
  search: string,
  {
    gradeId,
    initial = NONE,
  }: { gradeId?: string; initial?: FeeStudentOption[] }
) {
  const [options, setOptions] = useState(initial)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const term = search.trim()
    if (!term && !gradeId) {
      setOptions(initial)
      setLoading(false)
      return
    }
    let alive = true
    setLoading(true)
    const timer = setTimeout(
      () => {
        searchFeeStudents({ search: term, gradeId }).then((rows) => {
          if (!alive) return
          setOptions(rows)
          setLoading(false)
        })
      },
      term ? 250 : 0
    )
    return () => {
      alive = false
      clearTimeout(timer)
    }
  }, [search, gradeId, initial])

  return { options, loading }
}

/** One student, picked by typing a name or student number. */
export function StudentCombobox({
  name,
  id,
  initial,
  placeholder,
  searchPlaceholder,
  emptyMessage,
}: {
  /** Form field name for the hidden input carrying the student id. */
  name: string
  id?: string
  initial: FeeStudentOption[]
  placeholder: string
  searchPlaceholder: string
  emptyMessage: string
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<FeeStudentOption>()
  // cmdk's highlight; async results replace the list and clear its own.
  const [active, setActive] = useState("")
  const { options, loading } = useFeeStudentSearch(search, { initial })

  useEffect(() => {
    setActive(options[0]?.id ?? "")
  }, [options])

  const label = (s: FeeStudentOption) =>
    s.grade ? `${s.name} — ${s.grade}` : s.name

  return (
    <>
      <input type="hidden" name={name} value={selected?.id ?? ""} />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal"
          >
            <span className="truncate">
              {selected ? (
                <bdi dir="auto">{label(selected)}</bdi>
              ) : (
                <span className="text-muted-foreground">{placeholder}</span>
              )}
            </span>
            <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-(--radix-popover-trigger-width) p-0"
          align="start"
        >
          {/* The server filters; cmdk must not filter the page again. */}
          <Command
            shouldFilter={false}
            value={active}
            onValueChange={setActive}
          >
            <CommandInput
              value={search}
              onValueChange={setSearch}
              placeholder={searchPlaceholder}
            />
            <CommandList>
              {!loading && <CommandEmpty>{emptyMessage}</CommandEmpty>}
              <CommandGroup>
                {options.map((s) => (
                  <CommandItem
                    key={s.id}
                    value={s.id}
                    onSelect={() => {
                      setSelected(s)
                      setOpen(false)
                    }}
                  >
                    <Check
                      className={cn(
                        "size-4",
                        s.id === selected?.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <bdi dir="auto" className="truncate">
                      {label(s)}
                    </bdi>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </>
  )
}

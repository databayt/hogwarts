"use client"

import { cn } from "@/lib/utils"

import { IosFilterChip } from "./ios-filter-chip"

export type FilterId = "all" | "unread" | "favourites" | "groups"

type Filter = { id: FilterId; label: string }

type Props = {
  filters: Filter[]
  active: FilterId
  onChange: (id: FilterId) => void
  onAdd?: () => void
  className?: string
}

export function IosFilterChips({
  filters,
  active,
  onChange,
  onAdd,
  className,
}: Props) {
  return (
    <div
      className={cn("flex w-max items-center gap-[6px]", className)}
      role="tablist"
      aria-label="Chat filters"
    >
      {filters.map((f) => (
        <IosFilterChip
          key={f.id}
          label={f.label}
          active={f.id === active}
          onClick={() => onChange(f.id)}
        />
      ))}
      {/* The trailing "+" closes the chip row in the reference, so it is part
          of the grammar rather than something a handler opts into. */}
      <IosFilterChip iconOnly onClick={onAdd} />
    </div>
  )
}

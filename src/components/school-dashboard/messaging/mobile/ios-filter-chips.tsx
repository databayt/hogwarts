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
      className={cn("flex w-full items-start gap-[8px]", className)}
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
      {onAdd && <IosFilterChip iconOnly onClick={onAdd} />}
    </div>
  )
}

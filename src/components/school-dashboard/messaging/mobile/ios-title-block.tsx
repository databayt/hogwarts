"use client"

import { cn } from "@/lib/utils"

import { IosFilterChips, type FilterId } from "./ios-filter-chips"
import { WaIcon } from "./wa-icon"

type Filter = { id: FilterId; label: string }

type Props = {
  title: string
  searchPlaceholder: string
  searchValue?: string
  onSearchChange?: (value: string) => void
  onSearchFocus?: () => void
  filters: Filter[]
  activeFilter: FilterId
  onFilterChange: (id: FilterId) => void
  onAddFilter?: () => void
  /** Rendered between the search field and the chip row, as in the reference. */
  notice?: React.ReactNode
  className?: string
}

export function IosTitleBlock({
  title,
  searchPlaceholder,
  searchValue = "",
  onSearchChange,
  onSearchFocus,
  filters,
  activeFilter,
  onFilterChange,
  onAddFilter,
  notice,
  className,
}: Props) {
  return (
    <div
      className={cn(
        "flex w-full flex-col items-start gap-[8px] pt-[5px] pb-[8px]",
        className
      )}
    >
      <div className="flex w-full flex-col items-start gap-[8px] px-[16px]">
        <h1 className="w-full text-[33.33px] leading-none font-bold tracking-[-1.3332px] text-[color:var(--wa-text-primary)]">
          {title}
        </h1>

        <label className="flex w-full items-center gap-[6px] h-[36px] rounded-[10px] bg-[color:var(--wa-surface-search-chat)] px-[8px]">
          <WaIcon
            name="ic-wa-search-24"
            className="size-[16px] shrink-0 text-[color:var(--wa-text-secondary)]"
            ariaLabel="Search"
          />
          <input
            type="search"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange?.(e.target.value)}
            onFocus={onSearchFocus}
            className="min-w-0 flex-1 bg-transparent text-[16.4px] text-[color:var(--wa-text-primary)] placeholder:text-[color:var(--wa-text-secondary)] focus:outline-none"
          />
        </label>
      </div>

      {notice}

      {/* Its own scroller: Arabic filter labels run longer than English and
          would otherwise be clipped at the edge of the screen. */}
      <div className="w-full overflow-x-auto px-[16px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <IosFilterChips
          filters={filters}
          active={activeFilter}
          onChange={onFilterChange}
          onAdd={onAddFilter}
        />
      </div>
    </div>
  )
}

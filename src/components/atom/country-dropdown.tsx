"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import * as React from "react"
import { Country, type ICountry } from "country-state-city"
import { Check, ChevronsUpDown } from "lucide-react"
import { CircleFlag } from "react-circle-flags"

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

export type { ICountry }

interface CountryDropdownProps {
  value?: string
  onChange?: (value: string, country: ICountry) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  disabled?: boolean
  className?: string
  locale?: string
}

const countries = Country.getAllCountries()

function getCountryName(country: ICountry, locale?: string): string {
  if (!locale || locale === "en") return country.name
  try {
    const displayNames = new Intl.DisplayNames([locale], { type: "region" })
    return displayNames.of(country.isoCode) || country.name
  } catch {
    return country.name
  }
}

export function CountryDropdown({
  value,
  onChange,
  placeholder = "Select country",
  searchPlaceholder = "Search country...",
  emptyMessage = "No country found.",
  disabled,
  className,
  locale,
}: CountryDropdownProps) {
  const [open, setOpen] = React.useState(false)

  const selected = React.useMemo(
    () => countries.find((c) => c.isoCode === value),
    [value]
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "h-9 w-full justify-between px-2 text-sm",
            !value && "text-muted-foreground",
            className
          )}
        >
          {selected ? (
            <span className="flex items-center gap-2">
              <span className="size-4 shrink-0 overflow-hidden rounded-full">
                <CircleFlag
                  countryCode={selected.isoCode.toLowerCase()}
                  height={16}
                  width={16}
                />
              </span>
              {getCountryName(selected, locale)}
            </span>
          ) : (
            placeholder
          )}
          <ChevronsUpDown className="ms-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-(--radix-popover-trigger-width) p-0"
        align="start"
      >
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {countries.map((country) => (
                <CommandItem
                  key={country.isoCode}
                  value={`${country.name} ${getCountryName(country, locale)}`}
                  className="gap-2 px-2"
                  onSelect={() => {
                    onChange?.(country.isoCode, country)
                    setOpen(false)
                  }}
                >
                  <span className="size-4 shrink-0 overflow-hidden rounded-full">
                    <CircleFlag
                      countryCode={country.isoCode.toLowerCase()}
                      height={16}
                      width={16}
                    />
                  </span>
                  <span className="truncate">
                    {getCountryName(country, locale)}
                  </span>
                  {value === country.isoCode && (
                    <Check className="ms-auto h-3.5 w-3.5 shrink-0" />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { forwardRef, useEffect, useState } from "react"
import { lookup } from "country-data-list"
import parsePhoneNumber, { isValidPhoneNumber } from "libphonenumber-js"
import { Check, GlobeIcon } from "lucide-react"
import { CircleFlag } from "react-circle-flags"
import { z } from "zod"

import { cn } from "@/lib/utils"
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

export const phoneSchema = z.string().refine((value) => {
  if (!value) return true // allow empty
  try {
    return isValidPhoneNumber(value)
  } catch {
    return false
  }
}, "Invalid phone number")

export const phoneRequiredSchema = z.string().refine((value) => {
  try {
    return isValidPhoneNumber(value)
  } catch {
    return false
  }
}, "Invalid phone number")

export type CountryData = {
  alpha2: string
  alpha3: string
  countryCallingCodes: string[]
  currencies: string[]
  emoji?: string
  ioc: string
  languages: string[]
  name: string
  status: string
}

// Build country list once
const allCountries: CountryData[] = lookup.countries({ status: "assigned" })

interface PhoneInputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "onChange"
> {
  onCountryChange?: (data: CountryData | undefined) => void
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  defaultCountry?: string
  className?: string
  inline?: boolean
}

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  (
    {
      className,
      onCountryChange,
      onChange,
      value,
      placeholder,
      defaultCountry,
      inline = false,
      ...props
    },
    ref
  ) => {
    const [countryData, setCountryData] = useState<CountryData | undefined>()
    const [displayFlag, setDisplayFlag] = useState<string>("")
    const [hasInitialized, setHasInitialized] = useState(false)
    const [open, setOpen] = useState(false)

    useEffect(() => {
      if (defaultCountry) {
        const newCountryData = lookup.countries({
          alpha2: defaultCountry.toLowerCase(),
        })[0]
        setCountryData(newCountryData)
        setDisplayFlag(defaultCountry.toLowerCase())

        if (
          !hasInitialized &&
          newCountryData?.countryCallingCodes?.[0] &&
          !value
        ) {
          const syntheticEvent = {
            target: {
              value: newCountryData.countryCallingCodes[0],
            },
          } as React.ChangeEvent<HTMLInputElement>
          onChange?.(syntheticEvent)
          setHasInitialized(true)
        }
      }
    }, [defaultCountry, onChange, value, hasInitialized])

    const fireChange = (val: string) => {
      const syntheticEvent = {
        target: { value: val },
      } as React.ChangeEvent<HTMLInputElement>
      onChange?.(syntheticEvent)
    }

    const handleCountrySelect = (country: CountryData) => {
      setDisplayFlag(country.alpha2.toLowerCase())
      setCountryData(country)
      onCountryChange?.(country)
      setOpen(false)

      // Set the calling code as the phone value
      if (country.countryCallingCodes?.[0]) {
        fireChange(country.countryCallingCodes[0])
      }
    }

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let newValue = e.target.value

      if (!newValue.startsWith("+")) {
        if (newValue.startsWith("00")) {
          newValue = "+" + newValue.slice(2)
        } else {
          newValue = "+" + newValue
        }
      }

      const fireVal = (val: string) => {
        const syntheticEvent = {
          ...e,
          target: { ...e.target, value: val },
        } as React.ChangeEvent<HTMLInputElement>
        onChange?.(syntheticEvent)
      }

      try {
        const parsed = parsePhoneNumber(newValue)

        if (parsed?.country) {
          const countryCode = parsed.country

          setDisplayFlag("")
          setTimeout(() => {
            setDisplayFlag(countryCode.toLowerCase())
          }, 0)

          const countryInfo = lookup.countries({ alpha2: countryCode })[0]
          setCountryData(countryInfo)
          onCountryChange?.(countryInfo)

          fireVal(parsed.number as string)
        } else {
          fireVal(newValue)
          setDisplayFlag("")
          setCountryData(undefined)
          onCountryChange?.(undefined)
        }
      } catch {
        fireVal(newValue)
        setDisplayFlag("")
        setCountryData(undefined)
        onCountryChange?.(undefined)
      }
    }

    return (
      <div
        className={cn(
          "border-input has-[input:focus]:ring-ring relative flex h-9 items-center gap-2 rounded-md border bg-transparent pl-1 text-base shadow-sm transition-colors [interpolate-size:allow-keywords] disabled:cursor-not-allowed disabled:opacity-50 has-[input:focus]:ring-1 has-[input:focus]:outline-none md:text-sm",
          inline && "w-full rounded-l-none",
          className
        )}
      >
        {!inline && (
          <>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="hover:bg-accent flex h-7 w-7 shrink-0 items-center justify-center rounded-sm transition-colors"
                  aria-label="Select country"
                >
                  {displayFlag ? (
                    <div className="h-4 w-4 shrink-0 rounded-full">
                      <CircleFlag countryCode={displayFlag} height={16} />
                    </div>
                  ) : (
                    <GlobeIcon size={16} />
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-60 p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search country..." />
                  <CommandList>
                    <CommandEmpty>No country found.</CommandEmpty>
                    <CommandGroup>
                      {allCountries.map((country) => (
                        <CommandItem
                          key={country.alpha2}
                          value={country.name}
                          className="gap-2 px-2"
                          onSelect={() => handleCountrySelect(country)}
                        >
                          <span className="h-4 w-4 shrink-0 overflow-hidden rounded-full">
                            <CircleFlag
                              countryCode={country.alpha2.toLowerCase()}
                              height={16}
                              width={16}
                            />
                          </span>
                          <span className="truncate text-sm">
                            {country.name}
                          </span>
                          <span className="text-muted-foreground ms-auto text-xs">
                            {country.countryCallingCodes?.[0]}
                          </span>
                          {countryData?.alpha2 === country.alpha2 && (
                            <Check className="h-3.5 w-3.5 shrink-0" />
                          )}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <div className="bg-border h-5 w-px shrink-0" />
          </>
        )}
        <input
          ref={ref}
          value={value}
          onChange={handlePhoneChange}
          placeholder={placeholder || "Enter number"}
          type="tel"
          autoComplete="tel"
          name="phone"
          className="placeholder:text-muted-foreground flex h-9 w-full border-none bg-transparent p-0 py-1 text-base leading-none transition-colors outline-none [interpolate-size:allow-keywords] md:text-sm"
          {...props}
        />
      </div>
    )
  }
)

PhoneInput.displayName = "PhoneInput"

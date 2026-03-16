"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { forwardRef, useEffect, useState } from "react"
import { lookup } from "country-data-list"
import parsePhoneNumber, { isValidPhoneNumber } from "libphonenumber-js"
import { GlobeIcon } from "lucide-react"
import { CircleFlag } from "react-circle-flags"
import { z } from "zod"

import { cn } from "@/lib/utils"

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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [countryData, setCountryData] = useState<CountryData | undefined>()
    const [displayFlag, setDisplayFlag] = useState<string>("")
    const [hasInitialized, setHasInitialized] = useState(false)

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

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let newValue = e.target.value

      // Ensure the value starts with "+"
      if (!newValue.startsWith("+")) {
        if (newValue.startsWith("00")) {
          newValue = "+" + newValue.slice(2)
        } else {
          newValue = "+" + newValue
        }
      }

      // Helper to fire onChange with a specific value
      const fireChange = (val: string) => {
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

          fireChange(parsed.number as string)
        } else {
          fireChange(newValue)
          setDisplayFlag("")
          setCountryData(undefined)
          onCountryChange?.(undefined)
        }
      } catch {
        fireChange(newValue)
        setDisplayFlag("")
        setCountryData(undefined)
        onCountryChange?.(undefined)
      }
    }

    return (
      <div
        className={cn(
          "border-input has-[input:focus]:ring-ring flex h-9 items-center gap-2 rounded-md border bg-transparent pl-3 shadow-sm transition-colors [interpolate-size:allow-keywords] disabled:cursor-not-allowed disabled:opacity-50 has-[input:focus]:ring-1 has-[input:focus]:outline-none md:text-sm",
          inline && "w-full rounded-l-none",
          className
        )}
      >
        {!inline && (
          <div className="size-4 shrink-0 rounded-full">
            {displayFlag ? (
              <CircleFlag countryCode={displayFlag} height={16} />
            ) : (
              <GlobeIcon size={16} />
            )}
          </div>
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

"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { createContext, useContext, useSyncExternalStore } from "react"

import { cn } from "@/lib/utils"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

import {
  CURRENCIES,
  currencyLabel,
  FALLBACK_RATES,
  type Currency,
  type Rates,
} from "./rates"

interface CurrencyState {
  currency: Currency
  setCurrency: (currency: Currency) => void
  rates: Rates
  /** ISO date of the live rates, or null on the pinned fallback. */
  updated: string | null
}

const CurrencyContext = createContext<CurrencyState>({
  currency: "SAR",
  setCurrency: () => {},
  rates: FALLBACK_RATES,
  updated: null,
})

const STORAGE_KEY = "pricing-currency"

// The choice lives in localStorage (per browser), read through
// useSyncExternalStore so the server render and hydration both see SAR and
// the saved currency applies right after. `memory` keeps the toggle working
// when storage is blocked (private mode).
const listeners = new Set<() => void>()
let memory: Currency = "SAR"

function subscribe(listener: () => void) {
  listeners.add(listener)
  window.addEventListener("storage", listener)
  return () => {
    listeners.delete(listener)
    window.removeEventListener("storage", listener)
  }
}

function readCurrency(): Currency {
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as Currency | null
    if (saved && CURRENCIES.includes(saved)) return saved
  } catch {}
  return memory
}

function writeCurrency(next: Currency) {
  memory = next
  try {
    localStorage.setItem(STORAGE_KEY, next)
  } catch {}
  listeners.forEach((listener) => listener())
}

/**
 * One currency for the whole pricing page — the cards and the calculator
 * switch together. Remembered per browser; SAR until the visitor picks.
 */
export function CurrencyProvider({
  rates,
  updated,
  children,
}: {
  rates: Rates
  updated: string | null
  children: React.ReactNode
}) {
  const currency = useSyncExternalStore(
    subscribe,
    readCurrency,
    () => "SAR" as Currency
  )

  return (
    <CurrencyContext.Provider
      value={{ currency, setCurrency: writeCurrency, rates, updated }}
    >
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  return useContext(CurrencyContext)
}

export function CurrencyToggle({
  locale,
  label,
  className,
}: {
  locale: string
  label: string
  className?: string
}) {
  const { currency, setCurrency } = useCurrency()

  return (
    <ToggleGroup
      type="single"
      size="sm"
      value={currency}
      onValueChange={(value) => value && setCurrency(value as Currency)}
      aria-label={label}
      className={cn(
        "bg-background grid h-9 grid-cols-4 overflow-hidden rounded-md border p-0",
        className
      )}
    >
      {CURRENCIES.map((c) => (
        <ToggleGroupItem
          key={c}
          value={c}
          className={cn(
            "h-9 min-w-16 justify-center rounded-md px-3",
            currency === c
              ? "bg-muted text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {currencyLabel(c, locale)}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}

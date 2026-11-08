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
  currency: "USD",
  setCurrency: () => {},
  rates: FALLBACK_RATES,
  updated: null,
})

const STORAGE_KEY = "pricing-currency"

// The page is prerendered once a day, so the server can't see the visitor's
// country. The browser picks the currency from its time zone instead —
// Sudan → SDG, Saudi Arabia → SAR, Egypt → EGP, anywhere else → USD. A
// currency the visitor chose (localStorage) wins over the guess. Read through
// useSyncExternalStore: server render and hydration see USD, the local
// currency applies right after. `memory` keeps a choice working when storage
// is blocked (private mode).
const TIME_ZONE_CURRENCY: Record<string, Currency> = {
  "Africa/Khartoum": "SDG",
  "Asia/Riyadh": "SAR",
  "Africa/Cairo": "EGP",
}

function detectCurrency(): Currency {
  try {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone
    return TIME_ZONE_CURRENCY[zone] ?? "USD"
  } catch {
    return "USD"
  }
}

const listeners = new Set<() => void>()
let memory: Currency | null = null

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
  return (memory ??= detectCurrency())
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
 * switch together. Remembered per browser; the time-zone guess until the
 * visitor picks.
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
    () => "USD" as Currency
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

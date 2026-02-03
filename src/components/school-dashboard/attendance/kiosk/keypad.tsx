/**
 * Kiosk Keypad
 *
 * Touch-friendly numeric keypad for manual student ID entry.
 */
"use client"

import { useState } from "react"

import { cn } from "@/lib/utils"

interface KioskKeypadProps {
  onSubmit: (value: string) => void
  onCancel: () => void
  locale: string
  maxLength?: number
}

export function KioskKeypad({
  onSubmit,
  onCancel,
  locale,
  maxLength = 10,
}: KioskKeypadProps) {
  const isRTL = locale === "ar"
  const [value, setValue] = useState("")

  const handleDigit = (digit: string) => {
    if (value.length < maxLength) {
      setValue((prev) => prev + digit)
    }
  }

  const handleBackspace = () => {
    setValue((prev) => prev.slice(0, -1))
  }

  const handleClear = () => {
    setValue("")
  }

  const handleSubmit = () => {
    if (value.length > 0) {
      onSubmit(value)
    }
  }

  const digits = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"]

  return (
    <div className="flex w-full max-w-sm flex-col items-center">
      <h2 className="mb-6 text-2xl font-bold">
        {isRTL ? "أدخل رقم الطالب" : "Enter Student ID"}
      </h2>

      {/* Display */}
      <div className="bg-muted mb-6 w-full rounded-xl p-4">
        <div
          className={cn(
            "min-h-[3rem] text-center font-mono text-4xl tracking-widest",
            !value && "text-muted-foreground"
          )}
        >
          {value || (isRTL ? "_ _ _ _ _ _" : "_ _ _ _ _ _")}
        </div>
      </div>

      {/* Keypad grid */}
      <div className="mb-4 grid w-full grid-cols-3 gap-3">
        {digits.slice(0, 9).map((digit) => (
          <button
            key={digit}
            onClick={() => handleDigit(digit)}
            className="bg-card hover:bg-accent active:bg-primary active:text-primary-foreground h-16 rounded-xl border text-2xl font-semibold transition-colors"
          >
            {digit}
          </button>
        ))}

        {/* Bottom row: Clear, 0, Backspace */}
        <button
          onClick={handleClear}
          className="bg-destructive/10 text-destructive hover:bg-destructive/20 h-16 rounded-xl text-lg font-medium transition-colors"
        >
          {isRTL ? "مسح" : "Clear"}
        </button>

        <button
          onClick={() => handleDigit("0")}
          className="bg-card hover:bg-accent active:bg-primary active:text-primary-foreground h-16 rounded-xl border text-2xl font-semibold transition-colors"
        >
          0
        </button>

        <button
          onClick={handleBackspace}
          className="bg-muted hover:bg-muted/80 flex h-16 items-center justify-center rounded-xl transition-colors"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z"
            />
          </svg>
        </button>
      </div>

      {/* Action buttons */}
      <div className="flex w-full gap-3">
        <button
          onClick={onCancel}
          className="bg-secondary text-secondary-foreground hover:bg-secondary/80 flex-1 rounded-xl py-4 text-lg font-medium transition-colors"
        >
          {isRTL ? "إلغاء" : "Cancel"}
        </button>

        <button
          onClick={handleSubmit}
          disabled={value.length === 0}
          className={cn(
            "flex-1 rounded-xl py-4 text-lg font-medium transition-colors",
            value.length > 0
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          )}
        >
          {isRTL ? "تأكيد" : "Confirm"}
        </button>
      </div>
    </div>
  )
}

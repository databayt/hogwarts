"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useRef, useState, useTransition } from "react"
import { Check, DollarSign, Edit2, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"

import { updateSchoolPricing } from "./actions"

interface Props {
  schoolId: string
  initialPrice: number
  dictionary?: any
}

export function ConfigPriceForm({ schoolId, initialPrice, dictionary }: Props) {
  const [price, setPrice] = useState<number>(initialPrice)
  const [isFocused, setIsFocused] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dict = (dictionary as any)?.school?.onboarding || {}

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
      setIsFocused(true)
      const length = inputRef.current.value.length
      inputRef.current.setSelectionRange(length, length)
    }
  }, [])

  useEffect(() => {
    if (inputRef.current && isFocused) {
      const length = inputRef.current.value.length
      inputRef.current.setSelectionRange(length, length)
    }
  }, [price, isFocused])

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace("$", "")
    const numValue = parseInt(value) || 0
    setPrice(numValue)
    setSaved(false)
  }

  const handleSave = () => {
    startTransition(async () => {
      await updateSchoolPricing(schoolId, {
        tuitionFee: price || null,
        registrationFee: null,
        applicationFee: null,
        currency: "USD",
        paymentSchedule: "annual",
      })
      setSaved(true)
    })
  }

  return (
    <div className="flex flex-col items-center space-y-6">
      <div className="mb-6 flex items-start justify-center">
        <div className="relative flex items-center">
          <input
            ref={inputRef}
            type="text"
            value={`$${price}`}
            onChange={handlePriceChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => {
              setIsFocused(false)
              handleSave()
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowLeft" || e.key === "Home") {
                const selectionStart = e.currentTarget.selectionStart || 0
                if (selectionStart <= 1) {
                  e.preventDefault()
                  e.currentTarget.setSelectionRange(1, 1)
                }
              }
            }}
            onClick={(e) => {
              const selectionStart = e.currentTarget.selectionStart || 0
              if (selectionStart < 1) {
                e.currentTarget.setSelectionRange(1, 1)
              }
            }}
            className="text-foreground w-auto min-w-0 border-none bg-transparent text-center text-6xl font-extrabold outline-none"
            style={{
              width: `${`$${price}`.length * 0.8}em`,
              caretColor: "var(--foreground)",
            }}
          />
          {!isFocused && (
            <div
              className="bg-muted hover:bg-accent -ms-3 mb-4 flex h-8 w-8 cursor-pointer items-center justify-center self-end rounded-full transition-colors"
              onClick={() => inputRef.current?.focus()}
            >
              <Edit2 size={16} />
            </div>
          )}
        </div>
      </div>

      <div className="mb-4 flex justify-center">
        <Button
          variant="outline"
          className="inline-flex items-center gap-2 rounded-full"
        >
          <DollarSign size={12} />
          <span>{dict.viewSimilarSchools || "View similar schools"}</span>
        </Button>
      </div>

      <div className="flex justify-center">
        <Button
          variant="link"
          className="text-muted-foreground p-0 underline hover:no-underline"
        >
          {dict.learnMoreAboutFees || "Learn more about fees"}
        </Button>
      </div>

      {isPending && (
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          Saving...
        </div>
      )}
      {saved && !isPending && (
        <div className="flex items-center gap-2 text-sm text-green-500">
          <Check className="h-4 w-4" />
          Saved
        </div>
      )}
    </div>
  )
}

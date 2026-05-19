"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useMemo, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { DollarSign, Edit2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import { createI18nHelpers } from "@/components/internationalization/helpers"
import { useHostValidation } from "@/components/onboarding/host-validation-context"

import { getSchoolPricing, updateSchoolTuition } from "./actions"
import { createTuitionSchema } from "./validation"

interface Props {
  dictionary: Dictionary
  lang: Locale
  id: string
}

export default function PriceContent({ dictionary, lang, id }: Props) {
  const schoolId = id
  const router = useRouter()
  const { enableNext, setCustomNavigation } = useHostValidation()
  const dict = ((dictionary?.school as Record<string, unknown> | undefined)
    ?.onboarding ?? {}) as Record<string, string>

  const [price, setPrice] = useState<number>(5000)
  const [currency, setCurrency] = useState<string>("USD")
  const [isFocused, setIsFocused] = useState<boolean>(false)
  const [isPending, startTransition] = useTransition()
  const [errorText, setErrorText] = useState<string>("")
  const inputRef = useRef<HTMLInputElement>(null)

  const { v, e } = useMemo(() => {
    if (!dictionary?.messages) return { v: undefined, e: undefined }
    const { validation, error } = createI18nHelpers(dictionary.messages)
    return { v: validation, e: error }
  }, [dictionary])

  const schema = useMemo(() => createTuitionSchema(v), [v])

  // Initial load from DB — respects whatever admin set last
  useEffect(() => {
    let active = true
    getSchoolPricing(schoolId).then((r) => {
      if (!active || !r.success || !r.data) return
      if (typeof r.data.tuitionFee === "number" && r.data.tuitionFee > 0) {
        setPrice(r.data.tuitionFee)
      }
      if (typeof r.data.currency === "string") {
        setCurrency(r.data.currency)
      }
    })
    return () => {
      active = false
    }
  }, [schoolId])

  useEffect(() => {
    enableNext()
  }, [enableNext])

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

  // Persist on Next — save the value, then advance to the discount step. On
  // save failure surface an inline error and stay on the current step so the
  // user can correct it (or retry).
  useEffect(() => {
    const onNext = () => {
      const parsed = schema.safeParse({ tuitionFee: price })
      if (!parsed.success) {
        setErrorText(
          (parsed.error.issues[0].message || v?.get("invalidFormat")) ??
            "Invalid value"
        )
        return
      }
      setErrorText("")
      startTransition(async () => {
        const result = await updateSchoolTuition(schoolId, parsed.data)
        if (!result.success) {
          setErrorText(
            e?.server.internalError() ??
              dict.saveError ??
              "Could not save tuition"
          )
          return
        }
        router.push(`/${lang}/onboarding/${schoolId}/discount`)
      })
    }
    setCustomNavigation({ onNext, nextDisabled: isPending })
    return () => setCustomNavigation(undefined)
  }, [
    schoolId,
    lang,
    price,
    schema,
    isPending,
    setCustomNavigation,
    router,
    v,
    e,
    dict.saveError,
  ])

  const currencySymbol = useMemo(() => {
    try {
      const parts = new Intl.NumberFormat(undefined, {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
      }).formatToParts(0)
      return parts.find((p) => p.type === "currency")?.value ?? currency
    } catch {
      return currency
    }
  }, [currency])

  const handlePriceChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = ev.target.value.replace(/[^\d]/g, "")
    setPrice(cleaned ? parseInt(cleaned, 10) : 0)
  }

  const displayValue = `${currencySymbol}${price}`

  return (
    <div className="flex flex-col items-center space-y-6">
      {errorText && (
        <div className="text-destructive bg-destructive/10 rounded-md p-3 text-sm">
          {errorText}
        </div>
      )}
      <div className="mb-6 flex w-full max-w-full items-start justify-center px-2">
        <div className="relative flex max-w-full items-center">
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            value={displayValue}
            onChange={handlePriceChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={(ev) => {
              // Prevent cursor from moving before the currency symbol
              if (ev.key === "ArrowLeft" || ev.key === "Home") {
                const selectionStart = ev.currentTarget.selectionStart || 0
                if (selectionStart <= currencySymbol.length) {
                  ev.preventDefault()
                  ev.currentTarget.setSelectionRange(
                    currencySymbol.length,
                    currencySymbol.length
                  )
                }
              }
            }}
            onClick={(ev) => {
              const selectionStart = ev.currentTarget.selectionStart || 0
              if (selectionStart < currencySymbol.length) {
                ev.currentTarget.setSelectionRange(
                  currencySymbol.length,
                  currencySymbol.length
                )
              }
            }}
            className="text-foreground w-auto max-w-full min-w-0 border-none bg-transparent text-center text-4xl font-extrabold outline-none sm:text-5xl md:text-6xl"
            style={{
              width: `${displayValue.length * 0.8}em`,
              caretColor: "var(--foreground)",
            }}
          />
          {!isFocused && (
            <div
              className="bg-muted hover:bg-accent -ms-3 mb-4 flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center self-end rounded-full transition-colors"
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
    </div>
  )
}

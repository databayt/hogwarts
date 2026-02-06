"use client"

import { useEffect, useRef, useState } from "react"
import { ChevronDown, DollarSign, Edit2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { Locale } from "@/components/internationalization/config"
import type { getDictionary } from "@/components/internationalization/dictionaries"
import { useHostValidation } from "@/components/onboarding/host-validation-context"

interface Props {
  dictionary: Awaited<ReturnType<typeof getDictionary>>
  lang: Locale
  id: string
}

export default function PriceContent(props: Props) {
  const { dictionary, lang, id } = props
  const [price, setPrice] = useState<number>(158)
  const [isFocused, setIsFocused] = useState<boolean>(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const schoolId = id
  const { enableNext } = useHostValidation()
  const dict = (dictionary as any)?.school?.onboarding || {}

  // Enable next button since we have a default price
  useEffect(() => {
    enableNext()
  }, [enableNext])

  useEffect(() => {
    // Auto-focus the input when component mounts
    if (inputRef.current) {
      inputRef.current.focus()
      setIsFocused(true)
      // Position cursor at the end
      const length = inputRef.current.value.length
      inputRef.current.setSelectionRange(length, length)
    }
  }, [])

  useEffect(() => {
    // Position cursor at the end whenever price changes
    if (inputRef.current && isFocused) {
      const length = inputRef.current.value.length
      inputRef.current.setSelectionRange(length, length)
    }
  }, [price, isFocused])

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace("$", "")
    const numValue = parseInt(value) || 0
    setPrice(numValue)
  }

  return (
    <div className="flex flex-col items-center space-y-6">
      {/* Large price display with edit functionality */}
      <div className="mb-6 flex items-start justify-center">
        <div className="relative flex items-center">
          <input
            ref={inputRef}
            type="text"
            value={`$${price}`}
            onChange={handlePriceChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={(e) => {
              // Prevent cursor from moving before "$"
              if (e.key === "ArrowLeft" || e.key === "Home") {
                const selectionStart = e.currentTarget.selectionStart || 0
                if (selectionStart <= 1) {
                  e.preventDefault()
                  e.currentTarget.setSelectionRange(1, 1)
                }
              }
            }}
            onClick={(e) => {
              // Ensure cursor doesn't go before "$"
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
              onClick={() => {
                if (inputRef.current) {
                  inputRef.current.focus()
                }
              }}
            >
              <Edit2 size={16} />
            </div>
          )}
        </div>
      </div>

      {/* View similar schools button */}
      <div className="mb-4 flex justify-center">
        <Button
          variant="outline"
          className="inline-flex items-center gap-2 rounded-full"
        >
          <DollarSign size={12} />
          <span>{dict.viewSimilarSchools || "View similar schools"}</span>
        </Button>
      </div>

      {/* Learn more link */}
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

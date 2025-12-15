"use client"

import React from "react"
import { Check } from "lucide-react"

interface PropertySelectorProps {
  title: string
  description: string
  isSelected: boolean
  onClick: () => void
}

export function PropertySelector({
  title,
  description,
  isSelected,
  onClick,
}: PropertySelectorProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-xl border-2 p-6 text-start transition-colors ${
        isSelected
          ? "border-primary bg-primary/5"
          : "border-border hover:border-muted-foreground"
      } `}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-medium">{title}</h3>
          <p className="text-muted-foreground mt-1 text-sm">{description}</p>
        </div>

        {isSelected && (
          <div className="bg-primary rounded-full p-1">
            <Check className="text-primary-foreground h-4 w-4" />
          </div>
        )}
      </div>
    </button>
  )
}

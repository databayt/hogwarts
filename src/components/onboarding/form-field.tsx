"use client"

import React from "react"

interface FormFieldProps {
  label: string
  description?: string
  error?: string
  children: React.ReactNode
}

export function FormField({
  label,
  description,
  error,
  children,
}: FormFieldProps) {
  return (
    <div className="space-y-2 sm:space-y-3">
      <div>
        <label className="text-foreground text-base font-medium sm:text-lg">
          {label}
        </label>
        {description && (
          <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
            {description}
          </p>
        )}
      </div>

      <div className="min-h-[44px] sm:min-h-[40px]">{children}</div>

      {error && <p className="text-destructive text-xs sm:text-sm">{error}</p>}
    </div>
  )
}

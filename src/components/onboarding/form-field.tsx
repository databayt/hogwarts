"use client"

import React from 'react'

interface FormFieldProps {
  label: string
  description?: string
  error?: string
  children: React.ReactNode
}

export function FormField({ label, description, error, children }: FormFieldProps) {
  return (
    <div className="space-y-2 sm:space-y-3">
      <div>
        <label className="text-base sm:text-lg font-medium text-foreground">
          {label}
        </label>
        {description && (
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            {description}
          </p>
        )}
      </div>

      <div className="min-h-[44px] sm:min-h-[40px]">
        {children}
      </div>

      {error && (
        <p className="text-xs sm:text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  )
} 
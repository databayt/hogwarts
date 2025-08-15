"use client"

import React from 'react'

interface StepWrapperProps {
  children: React.ReactNode
}

export function StepWrapper({ children }: StepWrapperProps) {
  return (
    <div className="max-w-2xl mx-auto">
      {children}
    </div>
  )
} 
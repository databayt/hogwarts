"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React from "react"

interface StepWrapperProps {
  children: React.ReactNode
}

export function StepWrapper({ children }: StepWrapperProps) {
  return <div className="mx-auto max-w-2xl">{children}</div>
}

"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { createContext, useContext, type Dispatch } from "react"

import type { TemplateWizardState, WizardAction } from "../types"

interface WizardContextValue {
  state: TemplateWizardState
  dispatch: Dispatch<WizardAction>
  totalSteps: number
  clearDraft: () => void
}

const WizardContext = createContext<WizardContextValue | null>(null)

export function WizardProvider({
  children,
  value,
}: {
  children: React.ReactNode
  value: WizardContextValue
}) {
  return (
    <WizardContext.Provider value={value}>{children}</WizardContext.Provider>
  )
}

export function useWizard() {
  const ctx = useContext(WizardContext)
  if (!ctx) {
    throw new Error("useWizard must be used within WizardProvider")
  }
  return ctx
}

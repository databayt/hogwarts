"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { createContext, useContext, type Dispatch } from "react"

import type { CertWizardAction, CertWizardState } from "../types"

interface CertWizardContextValue {
  state: CertWizardState
  dispatch: Dispatch<CertWizardAction>
  totalSteps: number
  clearDraft: () => void
}

const CertWizardContext = createContext<CertWizardContextValue | null>(null)

export function CertWizardProvider({
  children,
  value,
}: {
  children: React.ReactNode
  value: CertWizardContextValue
}) {
  return (
    <CertWizardContext.Provider value={value}>
      {children}
    </CertWizardContext.Provider>
  )
}

export function useCertWizard() {
  const ctx = useContext(CertWizardContext)
  if (!ctx) {
    throw new Error("useCertWizard must be used within CertWizardProvider")
  }
  return ctx
}

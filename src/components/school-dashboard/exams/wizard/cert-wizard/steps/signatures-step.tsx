"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { CertSlotStep } from "./cert-slot-step"

export function SignaturesStep({ lang }: { lang: string }) {
  return <CertSlotStep slotName="signatures" lang={lang} />
}

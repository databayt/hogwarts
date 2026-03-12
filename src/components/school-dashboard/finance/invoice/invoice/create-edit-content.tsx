"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

import { type Locale } from "@/components/internationalization/config"
import { type Dictionary } from "@/components/internationalization/dictionaries"
import { createDraftInvoice } from "@/components/school-dashboard/finance/invoice/wizard/actions"

interface Props {
  invoiceId?: string
  defaults?: {
    firstName?: string | null
    lastName?: string | null
    email?: string | null
    currency?: string | null
  }
  dictionary: Dictionary
  lang: Locale
}

export default function CreateEditInvoiceModalContent({ invoiceId }: Props) {
  const router = useRouter()

  useEffect(() => {
    async function navigate() {
      if (invoiceId) {
        // Edit mode - go directly to wizard with existing id
        router.replace(`/finance/invoice/add/${invoiceId}/details`)
      } else {
        // Create mode - create draft and redirect
        const result = await createDraftInvoice()
        if (result.success && result.data) {
          router.replace(`/finance/invoice/add/${result.data.id}/details`)
        } else {
          router.back()
        }
      }
    }
    navigate()
  }, [invoiceId, router])

  return (
    <div className="flex items-center justify-center p-8">
      <Loader2 className="h-6 w-6 animate-spin" />
    </div>
  )
}

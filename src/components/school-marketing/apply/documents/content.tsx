"use client"

import React, { useCallback, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { Upload } from "lucide-react"

import { useLocale } from "@/components/internationalization/use-locale"

import { useApplySession } from "../application-context"
import type { DocumentsStepData } from "../types"
import { useApplyValidation } from "../validation-context"
import { DOCUMENTS_STEP_CONFIG } from "./config"
import { DocumentsForm } from "./form"
import type { DocumentsFormRef } from "./types"

interface Props {
  dictionary?: Record<string, unknown>
}

export default function DocumentsContent({ dictionary }: Props) {
  const params = useParams()
  const router = useRouter()
  const { locale } = useLocale()
  const isRTL = locale === "ar"
  const subdomain = params.subdomain as string
  const id = params.id as string

  const { enableNext, disableNext, setCustomNavigation } = useApplyValidation()
  const { session, getStepData } = useApplySession()
  const documentsFormRef = useRef<DocumentsFormRef>(null)

  const initialData = getStepData("documents")

  const onNext = useCallback(async () => {
    if (documentsFormRef.current) {
      try {
        await documentsFormRef.current.saveAndNext()
        router.push(`/${locale}/apply/${id}/review`)
      } catch (error) {
        console.error("Error saving documents step:", error)
      }
    }
  }, [locale, subdomain, id, router])

  useEffect(() => {
    // Documents step is optional, always enable next
    enableNext()
    setCustomNavigation({ onNext })
  }, [enableNext, setCustomNavigation, onNext])

  const dict = ((dictionary as Record<string, Record<string, string>> | null)
    ?.apply?.documents ?? {}) as Record<string, string>

  return (
    <div className="space-y-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-start gap-4">
          <div className="bg-primary/10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full">
            <Upload className="text-primary h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">
              {dict.title || DOCUMENTS_STEP_CONFIG.label}
            </h1>
            <p className="text-muted-foreground mt-1">
              {dict.description || DOCUMENTS_STEP_CONFIG.description}
            </p>
          </div>
        </div>

        <DocumentsForm
          ref={documentsFormRef}
          initialData={initialData as DocumentsStepData}
          dictionary={dictionary}
        />
      </div>
    </div>
  )
}

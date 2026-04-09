"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { useEffect, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { FileText } from "lucide-react"

import { FormHeading } from "@/components/form"
import { useWizardValidation } from "@/components/form/template/wizard-validation-context"
import { useDictionary } from "@/components/internationalization/use-dictionary"
import { useLocale } from "@/components/internationalization/use-locale"

import { getStepMeta } from "../config"
import { useOnboarding } from "../use-onboarding"

export function DocumentsStep() {
  const router = useRouter()
  const params = useParams()
  const { locale } = useLocale()
  const subdomain = params.subdomain as string
  const { dictionary } = useDictionary()

  const d = dictionary?.school?.onboarding?.internalJoin
  const doc = d?.documents
  const meta = useMemo(() => getStepMeta(d).documents, [d])

  const { state } = useOnboarding()
  const { enableNext, setCustomNavigation } = useWizardValidation()
  const role = state.role
  const autoFillDocs = state.applicationData?.documents

  // Documents are optional - always allow moving forward
  useEffect(() => {
    enableNext()
    setCustomNavigation({
      onNext: () => {
        router.push(`/${locale}/internal-onboarding/review`)
      },
    })
  }, [enableNext, setCustomNavigation, router, locale, subdomain])

  const getDocumentRequirements = () => {
    switch (role) {
      case "teacher":
        return [
          doc?.teachingCertificate ?? "Teaching certificate",
          doc?.degreeCertificate ?? "Degree certificate",
          doc?.idPassportCopy ?? "ID/Passport copy",
        ]
      case "staff":
      case "admin":
        return [
          doc?.relevantCertifications ?? "Relevant certifications",
          doc?.idPassportCopy ?? "ID/Passport copy",
        ]
      case "student":
        return [
          doc?.transferCertificate ?? "Transfer certificate",
          doc?.previousSchoolReport ?? "Previous school report",
          doc?.idPassportCopy ?? "ID/Passport copy",
        ]
      default:
        return [doc?.idPassportCopy ?? "ID/Passport copy"]
    }
  }

  return (
    <div className="space-y-8">
      <FormHeading title={meta.title} description={meta.description} />

      <div className="space-y-4">
        <p className="text-muted-foreground text-sm">
          {doc?.documentsNote ??
            "Documents can be uploaded after your account is approved. The following documents may be required:"}
        </p>

        <div className="space-y-2">
          {getDocumentRequirements().map((docName) => (
            <div
              key={docName}
              className="flex items-center gap-3 rounded-lg border p-3"
            >
              <FileText className="text-muted-foreground h-5 w-5" />
              <span className="text-sm">{docName}</span>
            </div>
          ))}
        </div>

        {autoFillDocs && autoFillDocs.length > 0 && (
          <div className="mt-6">
            <h3 className="mb-3 font-medium">
              {doc?.fromAdmission ??
                "Documents from your admission application"}
            </h3>
            <div className="space-y-2">
              {autoFillDocs.map((autoDoc, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-900/20"
                >
                  <FileText className="h-5 w-5 text-green-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{autoDoc.name}</p>
                    <p className="text-muted-foreground text-xs">
                      {autoDoc.type}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-muted mt-4 rounded-lg p-4">
          <p className="text-muted-foreground text-sm">
            {doc?.skipNote ??
              "You can skip this step for now. Document upload will be available in your profile after account approval."}
          </p>
        </div>
      </div>
    </div>
  )
}

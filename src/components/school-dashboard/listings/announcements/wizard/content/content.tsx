"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { useEffect, useRef, useState } from "react"
import { useParams } from "next/navigation"

import { FormHeading, FormLayout } from "@/components/form"
import type { WizardFormRef } from "@/components/form/wizard"
import { WizardStep } from "@/components/form/wizard"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import { ANNOUNCEMENT_WIZARD_CONFIG } from "../config"
import { useAnnouncementWizard } from "../use-announcement-wizard"
import { ContentForm } from "./form"

export default function AnnouncementContentContent() {
  const params = useParams()
  const announcementId = params.id as string
  const formRef = useRef<WizardFormRef>(null)
  const { data, isLoading } = useAnnouncementWizard()
  const [isValid, setIsValid] = useState(false)
  const { dictionary } = useDictionary()
  const wc = (dictionary?.school?.announcements as any)?.wizard?.content as
    | Record<string, string>
    | undefined

  // Set initial validity from loaded data
  useEffect(() => {
    if (data) {
      const isTitleValid = (data.title?.trim().length ?? 0) >= 1
      const isBodyValid = (data.body?.trim().length ?? 0) >= 1
      const isScopeValid =
        data.scope === "class"
          ? !!data.classId
          : data.scope === "role"
            ? !!data.role
            : true
      setIsValid(isTitleValid && isBodyValid && isScopeValid)
    }
  }, [data])

  return (
    <WizardStep
      entityId={announcementId}
      isValid={isValid}
      formRef={formRef}
      isLoading={isLoading}
      // Single-step wizard: saving IS finishing, so return to the list.
      finalDestination={ANNOUNCEMENT_WIZARD_CONFIG.finalDestination}
    >
      <FormLayout>
        <FormHeading
          title={wc?.title || "Announcement Content"}
          description={
            wc?.description || "Enter the announcement title and body."
          }
        />
        <ContentForm
          ref={formRef}
          announcementId={announcementId}
          initialData={
            data
              ? {
                  title: data.title ?? "",
                  body: data.body ?? "",
                  lang: (data.lang as "ar" | "en") ?? "ar",
                  priority: data.priority as
                    | "low"
                    | "normal"
                    | "high"
                    | "urgent"
                    | undefined,
                  scope:
                    (data.scope as "school" | "class" | "role") ?? "school",
                  classId: data.classId ?? undefined,
                  role: data.role ?? undefined,
                }
              : undefined
          }
          onValidChange={setIsValid}
        />
      </FormLayout>
    </WizardStep>
  )
}

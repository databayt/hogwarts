"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { useEffect, useRef, useState } from "react"
import { useParams } from "next/navigation"

import { FormHeading, FormLayout } from "@/components/form"
import type { WizardFormRef } from "@/components/form/wizard"
import { WizardStep } from "@/components/form/wizard"

import { useAnnouncementWizard } from "../use-announcement-wizard"
import { ContentForm } from "./form"

export default function AnnouncementContentContent() {
  const params = useParams()
  const announcementId = params.id as string
  const formRef = useRef<WizardFormRef>(null)
  const { data, isLoading } = useAnnouncementWizard()
  const [isValid, setIsValid] = useState(false)

  // Set initial validity from loaded data
  useEffect(() => {
    if (data) {
      setIsValid(
        (data.title?.trim().length ?? 0) >= 1 &&
          (data.body?.trim().length ?? 0) >= 1
      )
    }
  }, [data])

  return (
    <WizardStep
      entityId={announcementId}
      nextStep={`/announcements/add/${announcementId}/targeting`}
      isValid={isValid}
      formRef={formRef}
      isLoading={isLoading}
    >
      <FormLayout>
        <FormHeading
          title="Announcement Content"
          description="Enter the announcement title and body."
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
                }
              : undefined
          }
          onValidChange={setIsValid}
        />
      </FormLayout>
    </WizardStep>
  )
}

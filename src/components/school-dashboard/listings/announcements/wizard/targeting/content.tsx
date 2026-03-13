"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { useEffect, useRef, useState } from "react"
import { useParams } from "next/navigation"

import { FormHeading, FormLayout } from "@/components/form"
import type { WizardFormRef } from "@/components/form/wizard"
import { WizardStep } from "@/components/form/wizard"

import { useAnnouncementWizard } from "../use-announcement-wizard"
import { TargetingForm } from "./form"

const TAB_HEADINGS: Record<string, { title: string; description: string }> = {
  audience: {
    title: "Audience",
    description: "Choose who sees this announcement.",
  },
  publishing: {
    title: "Publishing",
    description: "Configure when and how the announcement is published.",
  },
}

export default function TargetingContent() {
  const params = useParams()
  const announcementId = params.id as string
  const formRef = useRef<WizardFormRef>(null)
  const { data, isLoading } = useAnnouncementWizard()
  const [isValid, setIsValid] = useState(true)
  const [heading, setHeading] = useState(TAB_HEADINGS.audience)

  const handleTabChange = (tabId: string) => {
    setHeading(TAB_HEADINGS[tabId] || TAB_HEADINGS.audience)
  }

  // Set initial validity from loaded data
  useEffect(() => {
    if (data) {
      let valid = true
      if (data.scope === "class" && !data.classId) valid = false
      if (data.scope === "role" && !data.role) valid = false
      setIsValid(valid)
    }
  }, [data])

  return (
    <WizardStep
      entityId={announcementId}
      nextStep={undefined}
      isValid={isValid}
      formRef={formRef}
      isLoading={isLoading}
    >
      <FormLayout>
        <FormHeading title={heading.title} description={heading.description} />
        <TargetingForm
          ref={formRef}
          announcementId={announcementId}
          initialData={
            data
              ? {
                  scope: data.scope as "school" | "class" | "role",
                  classId: data.classId ?? undefined,
                  role: data.role ?? undefined,
                  published: data.published,
                  scheduledFor: data.scheduledFor ?? undefined,
                  expiresAt: data.expiresAt ?? undefined,
                  pinned: data.pinned,
                  featured: data.featured,
                }
              : undefined
          }
          onValidChange={setIsValid}
          onTabChange={handleTabChange}
        />
      </FormLayout>
    </WizardStep>
  )
}

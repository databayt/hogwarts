"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { useEffect, useRef, useState } from "react"
import { useParams } from "next/navigation"

import { FormHeading, FormLayout } from "@/components/form"
import type { WizardFormRef } from "@/components/form/wizard"
import { WizardStep } from "@/components/form/wizard"

import { useExamWizard } from "../use-exam-wizard"
import { ScheduleForm } from "./form"

const TAB_HEADINGS: Record<string, { title: string; description: string }> = {
  schedule: {
    title: "Schedule",
    description: "Set the exam date, time, and duration.",
  },
  marks: {
    title: "Marks & Instructions",
    description: "Set the marks and exam instructions.",
  },
}

export default function ScheduleContent() {
  const params = useParams()
  const examId = params.id as string
  const formRef = useRef<WizardFormRef>(null)
  const { data, isLoading } = useExamWizard()
  const [isValid, setIsValid] = useState(false)
  const [heading, setHeading] = useState(TAB_HEADINGS.schedule)

  const handleTabChange = (tabId: string) => {
    setHeading(TAB_HEADINGS[tabId] || TAB_HEADINGS.schedule)
  }

  // Set initial validity from loaded data
  useEffect(() => {
    if (data) {
      setIsValid(
        !!data.examDate &&
          !!data.startTime &&
          !!data.endTime &&
          data.duration >= 1 &&
          data.totalMarks >= 1 &&
          data.passingMarks >= 1
      )
    }
  }, [data])

  return (
    <WizardStep
      entityId={examId}
      nextStep={`/exams/manage/add/${examId}/settings`}
      isValid={isValid}
      formRef={formRef}
      isLoading={isLoading}
    >
      <FormLayout>
        <FormHeading title={heading.title} description={heading.description} />
        <ScheduleForm
          ref={formRef}
          examId={examId}
          initialData={
            data
              ? {
                  examDate: data.examDate,
                  startTime: data.startTime,
                  endTime: data.endTime,
                  duration: data.duration,
                  totalMarks: data.totalMarks,
                  passingMarks: data.passingMarks,
                  instructions: data.instructions ?? undefined,
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

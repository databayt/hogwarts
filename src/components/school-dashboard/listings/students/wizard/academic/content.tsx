"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"

import { formatDate } from "@/lib/i18n-format"
import { FormHeading, FormLayout } from "@/components/form"
import { useWizardValidation } from "@/components/form/template/wizard-validation-context"
import type { WizardFormRef } from "@/components/form/wizard"
import { WizardStep } from "@/components/form/wizard"
import { useDictionary } from "@/components/internationalization/use-dictionary"
import { useLocale } from "@/components/internationalization/use-locale"

import { finishStudentWizard } from "../finish"
import { useStudentWizard } from "../use-student-wizard"
import { AcademicForm } from "./form"
import type { AcademicFormData } from "./validation"

// Small summary card shown when the student was created from an admission
// application — gives admins immediate context about where the draft came from.
function AdmissionInfo({
  application,
  t,
  statusLabels,
  locale,
}: {
  application: NonNullable<
    NonNullable<ReturnType<typeof useStudentWizard>["data"]>["application"]
  >
  t?: Record<string, string>
  /** `school.admission.status.*` — the raw enum used to render here. */
  statusLabels?: Record<string, string>
  locale: "ar" | "en"
}) {
  return (
    <div className="bg-muted/50 rounded-lg border p-4">
      <h4 className="mb-3 font-medium">
        {t?.admissionHistory || "Admission History"}
      </h4>
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
        <div>
          <span className="text-muted-foreground">
            {t?.applicationNumber || "Application #"}
          </span>
          <p className="font-medium">{application.applicationNumber}</p>
        </div>
        <div>
          <span className="text-muted-foreground">
            {t?.campaign || "Campaign"}
          </span>
          <p className="font-medium">{application.campaign.name}</p>
        </div>
        <div>
          <span className="text-muted-foreground">
            {t?.academicYear || "Academic Year"}
          </span>
          <p className="font-medium">{application.campaign.academicYear}</p>
        </div>
        <div>
          <span className="text-muted-foreground">
            {t?.applicationStatus || "Status"}
          </span>
          <p className="font-medium">
            {statusLabels?.[application.status] || application.status}
          </p>
        </div>
        {application.submittedAt && (
          <div>
            <span className="text-muted-foreground">
              {t?.submittedAt || "Submitted"}
            </span>
            <p className="font-medium">
              {formatDate(application.submittedAt, locale)}
            </p>
          </div>
        )}
        {application.confirmationDate && (
          <div>
            <span className="text-muted-foreground">
              {t?.enrolledAt || "Enrolled"}
            </span>
            <p className="font-medium">
              {formatDate(application.confirmationDate, locale)}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AcademicContent() {
  const params = useParams()
  const router = useRouter()
  const { locale } = useLocale()
  const studentId = params.id as string
  const formRef = useRef<WizardFormRef>(null)
  const { data, isLoading } = useStudentWizard()
  const [isValid, setIsValid] = useState(true)
  const { setCustomNavigation } = useWizardValidation()
  const isSavingRef = useRef(false)

  const { dictionary } = useDictionary()
  const students = (dictionary?.school as Record<string, unknown>)?.students as
    | Record<string, unknown>
    | undefined
  const t = students?.academic as Record<string, string> | undefined
  const tEnrollment = students?.enrollment as Record<string, string> | undefined

  // Academic is the final step. Next saves this step, then runs the shared
  // finisher (provision + warnings + credentials dialog) and returns to the
  // list. The footer's "Skip & Create" runs the same finisher (see the wizard
  // layout), so both exits behave identically.
  useEffect(() => {
    const handleNext = async () => {
      if (isSavingRef.current) return
      isSavingRef.current = true
      try {
        await formRef.current?.saveAndNext()
        const ok = await finishStudentWizard(studentId, dictionary)
        if (ok) router.push(`/${locale}/students`)
      } catch {
        // saveAndNext already toasted its own error.
      } finally {
        isSavingRef.current = false
      }
    }

    setCustomNavigation({ onNext: handleNext })
    return () => setCustomNavigation(undefined)
  }, [studentId, router, locale, setCustomNavigation, dictionary])

  return (
    <WizardStep
      entityId={studentId}
      isValid={isValid}
      formRef={formRef}
      isLoading={isLoading}
      isReviewStep
    >
      <FormLayout>
        <FormHeading
          title={t?.title || "Academic Information"}
          description={
            t?.description ||
            "Select the student's grade and section to enrol them."
          }
        />
        {/* ONE right-column child: FormLayout renders exactly two children
            (heading | content). With the admission card as a bare sibling,
            the form became a third child and was silently dropped — an
            enrolled student's edit screen showed the card and no grade or
            section controls at all. */}
        <div className="space-y-6">
          {data?.application && (
            <AdmissionInfo
              application={data.application}
              t={tEnrollment}
              statusLabels={
                (
                  (dictionary?.school as Record<string, unknown> | undefined)
                    ?.admission as Record<string, unknown> | undefined
                )?.status as Record<string, string> | undefined
              }
              locale={locale === "en" ? "en" : "ar"}
            />
          )}
          <AcademicForm
            ref={formRef}
            studentId={studentId}
            initialData={
              data
                ? ({
                    academicGradeId: data.academicGradeId ?? undefined,
                    academicStreamId: data.academicStreamId ?? undefined,
                    sectionId: data.sectionId ?? undefined,
                    previousSchoolName: data.previousSchoolName ?? undefined,
                  } as Partial<AcademicFormData>)
                : undefined
            }
            onValidChange={setIsValid}
          />
        </div>
      </FormLayout>
    </WizardStep>
  )
}

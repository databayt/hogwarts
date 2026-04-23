"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { useCallback, useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, ArrowRight } from "lucide-react"

import type { NameFormat } from "@/lib/name-utils"
import { composeFullName } from "@/lib/name-utils"
import { Button } from "@/components/ui/button"
import { FormHeading, FormLayout } from "@/components/form"
import { useWizardValidation } from "@/components/form/template/wizard-validation-context"
import type { WizardFormRef } from "@/components/form/wizard"
import { useDictionary } from "@/components/internationalization/use-dictionary"
import { useLocale } from "@/components/internationalization/use-locale"

import { useStudentWizard } from "../use-student-wizard"
import { getStudentPersonalGuardians } from "./actions"
import { PERSONAL_STEP_CONFIG } from "./config"
import { PersonalForm } from "./form"
import { GuardianForm } from "./guardian-form"
import type { PersonalGuardianFormData } from "./validation"

type ActiveTab = "student" | "father" | "mother"

export default function PersonalContent() {
  const params = useParams()
  const router = useRouter()
  const { locale, isRTL } = useLocale()
  const studentId = params.id as string

  const { data, isLoading } = useStudentWizard()
  const { dictionary } = useDictionary()
  const students = (dictionary?.school as Record<string, unknown>)?.students as
    | Record<string, unknown>
    | undefined
  const t = students?.personal as Record<string, string> | undefined

  const { enableNext, disableNext, setCustomNavigation } = useWizardValidation()
  const studentFormRef = useRef<WizardFormRef>(null)
  const guardianFormRef = useRef<WizardFormRef>(null)
  const [activeTab, setActiveTab] = useState<ActiveTab>("student")
  const [studentValid, setStudentValid] = useState(false)
  const [guardianValid, setGuardianValid] = useState(false)
  const [guardianInitial, setGuardianInitial] = useState<
    Partial<PersonalGuardianFormData> | undefined
  >()

  const nameFormat = (data?.nameFormat as NameFormat) ?? "full"

  // Load existing guardian data (not included in the wizard provider cache).
  useEffect(() => {
    if (!studentId) return
    getStudentPersonalGuardians(studentId).then((result) => {
      if (result.success && result.data) {
        setGuardianInitial(result.data)
        setGuardianValid(
          (result.data.fatherName?.trim().length ?? 0) > 0 ||
            (result.data.motherName?.trim().length ?? 0) > 0
        )
      }
    })
  }, [studentId])

  // Compute initial student validity from the loaded data.
  useEffect(() => {
    if (!data) return
    if (nameFormat === "full") {
      const full = composeFullName(
        data.firstName,
        data.middleName,
        data.lastName
      )
      setStudentValid(full.trim().length >= 1)
    } else {
      setStudentValid(
        data.firstName.trim().length >= 1 && data.lastName.trim().length >= 1
      )
    }
  }, [data, nameFormat])

  // Sequential save: Student sub-form first, then Guardian (father+mother
  // persisted together in a single transaction). Both must succeed to advance.
  const onNext = useCallback(async () => {
    try {
      if (studentFormRef.current) {
        await studentFormRef.current.saveAndNext()
      }
      if (guardianFormRef.current) {
        await guardianFormRef.current.saveAndNext()
      }
      router.push(`/${locale}/students/add/${studentId}/location`)
    } catch (error) {
      console.error("Error saving personal step:", error)
    }
  }, [locale, studentId, router])

  // Wire validity + custom onNext into the wizard footer.
  useEffect(() => {
    if (studentValid && guardianValid) {
      enableNext()
      setCustomNavigation({ onNext })
    } else {
      disableNext()
      setCustomNavigation(undefined)
    }
  }, [
    studentValid,
    guardianValid,
    enableNext,
    disableNext,
    setCustomNavigation,
    onNext,
  ])

  const sections: { key: ActiveTab; label: string }[] = [
    { key: "student", label: t?.studentTab || (isRTL ? "الطالب" : "Student") },
    { key: "father", label: t?.fatherTab || (isRTL ? "الأب" : "Father") },
    { key: "mother", label: t?.motherTab || (isRTL ? "الأم" : "Mother") },
  ]

  const currentIndex = sections.findIndex((s) => s.key === activeTab)
  const previous = currentIndex > 0 ? sections[currentIndex - 1] : null
  const next =
    currentIndex < sections.length - 1 ? sections[currentIndex + 1] : null

  if (isLoading) {
    return null
  }

  return (
    <FormLayout>
      <FormHeading
        title={t?.title || PERSONAL_STEP_CONFIG.label(isRTL)}
        description={t?.description || PERSONAL_STEP_CONFIG.description(isRTL)}
      />
      <div className="space-y-6">
        <div className={activeTab === "student" ? "" : "hidden"}>
          <PersonalForm
            ref={studentFormRef}
            studentId={studentId}
            nameFormat={nameFormat}
            initialData={
              data
                ? {
                    firstName: data.firstName,
                    middleName: data.middleName ?? undefined,
                    lastName: data.lastName,
                    mobileNumber: data.mobileNumber ?? undefined,
                    alternatePhone: data.alternatePhone ?? undefined,
                  }
                : undefined
            }
            onValidChange={setStudentValid}
          />
        </div>

        <div className={activeTab !== "student" ? "" : "hidden"}>
          <GuardianForm
            ref={guardianFormRef}
            studentId={studentId}
            initialData={guardianInitial}
            onValidChange={setGuardianValid}
            controlledParent={activeTab === "mother" ? "mother" : "father"}
          />
        </div>

        <div className="flex items-center gap-2">
          {previous && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="shadow-none"
              onClick={() => setActiveTab(previous.key)}
            >
              <ArrowLeft className="rtl:rotate-180" /> {previous.label}
            </Button>
          )}
          {next && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="ms-auto shadow-none"
              onClick={() => setActiveTab(next.key)}
            >
              {next.label} <ArrowRight className="rtl:rotate-180" />
            </Button>
          )}
        </div>
      </div>
    </FormLayout>
  )
}

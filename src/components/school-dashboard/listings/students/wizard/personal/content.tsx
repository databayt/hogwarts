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
import { useWizardRuntime } from "@/components/form/wizard"
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

  const { data, isLoading, isFreshDraft } = useStudentWizard()
  const runtime = useWizardRuntime()
  const { dictionary } = useDictionary()
  const students = (dictionary?.school as Record<string, unknown>)?.students as
    | Record<string, unknown>
    | undefined
  const t = students?.personal as Record<string, string> | undefined

  const { enableNext, disableNext, setCustomNavigation, setOnSave } =
    useWizardValidation()
  const studentFormRef = useRef<WizardFormRef>(null)
  const guardianFormRef = useRef<WizardFormRef>(null)
  const [activeTab, setActiveTab] = useState<ActiveTab>("student")
  const [studentValid, setStudentValid] = useState(false)
  const [guardianValid, setGuardianValid] = useState(false)
  const [guardianInitial, setGuardianInitial] = useState<
    Partial<PersonalGuardianFormData> | undefined
  >()

  const nameFormat = (data?.nameFormat as NameFormat) ?? "full"

  // A draft row carries stub values for its NOT NULL columns (DOB 2000-01-01,
  // gender "male" — see createDraftStudent). Showing them pre-filled read as
  // real data, so admins skipped both and every wizard student was born on
  // New Year 2000. Present the stubs as empty while the wizard is still a
  // draft; an enrolled student's real values (edit mode) show as before.
  const isDraft = !!data?.wizardStep
  const dobIso = data?.dateOfBirth
    ? new Date(data.dateOfBirth).toISOString().slice(0, 10)
    : undefined
  const initialDob = isDraft && dobIso === "2000-01-01" ? undefined : dobIso
  const initialGender = isDraft ? undefined : (data?.gender ?? undefined)

  // Load existing guardian data (not included in the wizard provider cache).
  // Once per student — a hidden step re-runs its effects when shown again, and
  // a refetch would reset the guardian form over what was typed. A draft
  // opened from "+" this session has no guardians yet: nothing to fetch.
  const guardiansForRef = useRef<string | null>(null)
  useEffect(() => {
    if (!studentId || isFreshDraft || guardiansForRef.current === studentId)
      return
    guardiansForRef.current = studentId
    getStudentPersonalGuardians(studentId).then((result) => {
      if (result.success && result.data) {
        setGuardianInitial(result.data)
        setGuardianValid(
          (result.data.fatherName?.trim().length ?? 0) > 0 ||
            (result.data.motherName?.trim().length ?? 0) > 0
        )
      }
    })
  }, [studentId, isFreshDraft])

  // Compute initial student validity from the loaded data — once per student,
  // for the same reason (it would override the form's current validity).
  const validityFromRef = useRef<string | null>(null)
  useEffect(() => {
    if (!data || validityFromRef.current === data.id) return
    validityFromRef.current = data.id
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

  // Admins press Next from the Father/Mother tab, where the student form is
  // hidden — a student-side failure stopped the save with nothing on screen
  // (hogwarts#424, #425). Bring the student tab back so its error shows.
  //
  // The handles are taken by the caller at click time: once the step is
  // hidden its refs detach, but the handles keep working.
  const saveBoth = useCallback(
    async (student: WizardFormRef | null, guardian: WizardFormRef | null) => {
      if (student) {
        try {
          await student.saveAndNext()
        } catch (error) {
          setActiveTab("student")
          throw error
        }
      }
      // Guardian (father+mother) persisted together in a single transaction.
      if (guardian) await guardian.saveAndNext()
    },
    []
  )

  // Optimistic: location paints now; both saves finish behind it, and a
  // failure brings this step back with its error (see wizard-runtime.tsx).
  const onNext = useCallback(async () => {
    const student = studentFormRef.current
    const guardian = guardianFormRef.current
    const next = `/${locale}/students/add/${studentId}/location`
    try {
      if (runtime) {
        await runtime.advance(next, () => saveBoth(student, guardian))
      } else {
        await saveBoth(student, guardian)
        router.push(next)
      }
    } catch (error) {
      console.error("Error saving personal step:", error)
    }
  }, [locale, studentId, router, runtime, saveBoth])

  // Save without advancing. Footer's save-and-skip (Bookmark) icon awaits this
  // and only redirects on success — must re-throw on failure.
  const onSaveStep = useCallback(async () => {
    const student = studentFormRef.current
    const guardian = guardianFormRef.current
    if (!runtime) return saveBoth(student, guardian)
    const saved = await runtime.enqueue(
      () => saveBoth(student, guardian),
      window.location.pathname
    )
    if (!saved) throw new Error("SAVE_FAILED")
  }, [runtime, saveBoth])

  // Wire validity + custom onNext + onSave into the wizard footer.
  useEffect(() => {
    if (studentValid && guardianValid) {
      enableNext()
      setCustomNavigation({ onNext })
      setOnSave(onSaveStep)
    } else {
      disableNext()
      setCustomNavigation(undefined)
      setOnSave(undefined)
    }
    return () => {
      setCustomNavigation(undefined)
      setOnSave(undefined)
    }
  }, [
    studentValid,
    guardianValid,
    enableNext,
    disableNext,
    setCustomNavigation,
    setOnSave,
    onNext,
    onSaveStep,
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
                    dateOfBirth: initialDob,
                    gender: initialGender,
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

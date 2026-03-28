"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, {
  forwardRef,
  useImperativeHandle,
  useState,
  useTransition,
} from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowRight } from "lucide-react"
import { useForm } from "react-hook-form"

import type { NameFormat } from "@/lib/name-utils"
import { composeFullName } from "@/lib/name-utils"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { ErrorToast } from "@/components/atom/toast"
import { InputField, NameFields, PhoneField } from "@/components/form"
import type { WizardFormRef } from "@/components/form/wizard"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import { saveStudentGuardians } from "./actions"
import { createGuardianSchema, type GuardianFormData } from "./validation"

interface GuardianFormProps {
  studentId: string
  initialData?: Partial<GuardianFormData>
  nameFormat?: NameFormat
  onValidChange?: (isValid: boolean) => void
}

export const GuardianForm = forwardRef<WizardFormRef, GuardianFormProps>(
  ({ studentId, initialData, nameFormat = "full", onValidChange }, ref) => {
    const [isPending, startTransition] = useTransition()
    const [activeParent, setActiveParent] = useState<"father" | "mother">(
      initialData?.motherFirstName && !initialData?.fatherFirstName
        ? "mother"
        : "father"
    )
    const { dictionary } = useDictionary()
    const students = (dictionary?.school as Record<string, unknown>)
      ?.students as Record<string, unknown> | undefined
    const t = (students as Record<string, unknown>)?.guardian as
      | Record<string, string>
      | undefined
    const tRoot = students as Record<string, string> | undefined

    const schema = createGuardianSchema(t?.atLeastOneParent)

    const form = useForm({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      resolver: zodResolver(schema) as any,
      defaultValues: {
        fatherFirstName: initialData?.fatherFirstName || "",
        fatherLastName: initialData?.fatherLastName || "",
        fatherOccupation: initialData?.fatherOccupation || "",
        fatherPhone: initialData?.fatherPhone || "",
        fatherEmail: initialData?.fatherEmail || "",
        motherFirstName: initialData?.motherFirstName || "",
        motherLastName: initialData?.motherLastName || "",
        motherOccupation: initialData?.motherOccupation || "",
        motherPhone: initialData?.motherPhone || "",
        motherEmail: initialData?.motherEmail || "",
        // Virtual _fullName fields for NameFields atom in "full" mode
        ...(nameFormat === "full"
          ? {
              _fatherFullName: composeFullName(
                initialData?.fatherFirstName,
                undefined,
                initialData?.fatherLastName
              ),
              _motherFullName: composeFullName(
                initialData?.motherFirstName,
                undefined,
                initialData?.motherLastName
              ),
            }
          : {}),
      },
    })

    // Notify parent of validity changes
    const fatherFirst = form.watch("fatherFirstName")
    const motherFirst = form.watch("motherFirstName")
    React.useEffect(() => {
      const isValid =
        (fatherFirst as string)?.trim().length > 0 ||
        (motherFirst as string)?.trim().length > 0
      onValidChange?.(isValid)
    }, [fatherFirst, motherFirst, onValidChange])

    useImperativeHandle(ref, () => ({
      saveAndNext: () =>
        new Promise<void>((resolve, reject) => {
          startTransition(async () => {
            try {
              const valid = await form.trigger()
              if (!valid) {
                reject(
                  new Error(tRoot?.validationFailed || "Validation failed")
                )
                return
              }
              const data = form.getValues()
              // Strip virtual _fullName fields
              const { _fatherFullName, _motherFullName, ...saveData } =
                data as GuardianFormData & {
                  _fatherFullName?: string
                  _motherFullName?: string
                }
              const result = await saveStudentGuardians(
                studentId,
                saveData as GuardianFormData
              )
              if (!result.success) {
                ErrorToast(
                  result.error || tRoot?.failedToSave || "Failed to save"
                )
                reject(new Error(result.error))
                return
              }
              resolve()
            } catch (err) {
              const msg =
                err instanceof Error
                  ? err.message
                  : tRoot?.failedToSave || "Failed to save"
              ErrorToast(msg)
              reject(err)
            }
          })
        }),
    }))

    const isFather = activeParent === "father"
    const namePrefix = isFather ? "father" : "mother"

    return (
      <Form {...form}>
        <form className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="min-w-0 text-lg font-semibold">
              {isFather
                ? t?.fatherInfo || "Father Information"
                : t?.motherInfo || "Mother Information"}
            </h3>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() =>
                setActiveParent((p) => (p === "father" ? "mother" : "father"))
              }
              className="text-muted-foreground gap-2"
              disabled={isPending}
            >
              {isFather
                ? t?.switchToMother || "Switch to Mother"
                : t?.switchToFather || "Switch to Father"}
              <ArrowRight className="size-4 rtl:rotate-180" />
            </Button>
          </div>

          <NameFields
            nameFormat={nameFormat}
            fields={{
              firstName: `${namePrefix}FirstName`,
              middleName: `_${namePrefix}MiddleName`,
              lastName: `${namePrefix}LastName`,
            }}
            labels={{
              firstName: t?.firstName || "First Name",
              lastName: t?.lastName || "Last Name",
              fullName: t?.name || "Full Name",
            }}
            placeholders={{
              firstName: t?.firstNamePlaceholder,
              lastName: t?.lastNamePlaceholder,
              fullName: t?.namePlaceholder,
            }}
            disabled={isPending}
          />
          <InputField
            name={`${namePrefix}Occupation`}
            label={t?.occupation || "Occupation"}
            placeholder={t?.occupationPlaceholder || "Enter occupation"}
            disabled={isPending}
          />
          <PhoneField
            name={`${namePrefix}Phone`}
            label={t?.phone || "Phone Number"}
            placeholder={t?.phonePlaceholder || "Enter phone number"}
            disabled={isPending}
          />
          <InputField
            name={`${namePrefix}Email`}
            label={t?.email || "Email Address"}
            placeholder={t?.emailPlaceholder || "Enter email address"}
            type="email"
            disabled={isPending}
          />
        </form>
      </Form>
    )
  }
)

GuardianForm.displayName = "GuardianForm"

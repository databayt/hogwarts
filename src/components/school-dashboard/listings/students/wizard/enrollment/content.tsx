"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { useRef, useState } from "react"
import { useParams } from "next/navigation"

import { FormHeading, FormLayout } from "@/components/form"
import type { WizardFormRef } from "@/components/form/wizard"
import { WizardStep } from "@/components/form/wizard"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import { useStudentWizard } from "../use-student-wizard"
import { EnrollmentForm } from "./form"

function AdmissionInfo({
  application,
  t,
}: {
  application: NonNullable<
    NonNullable<ReturnType<typeof useStudentWizard>["data"]>["application"]
  >
  t?: Record<string, string>
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
          <p className="font-medium">{application.status}</p>
        </div>
        {application.submittedAt && (
          <div>
            <span className="text-muted-foreground">
              {t?.submittedAt || "Submitted"}
            </span>
            <p className="font-medium">
              {new Date(application.submittedAt).toLocaleDateString()}
            </p>
          </div>
        )}
        {application.confirmationDate && (
          <div>
            <span className="text-muted-foreground">
              {t?.enrolledAt || "Enrolled"}
            </span>
            <p className="font-medium">
              {new Date(application.confirmationDate).toLocaleDateString()}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function EnrollmentContent() {
  const params = useParams()
  const studentId = params.id as string
  const formRef = useRef<WizardFormRef>(null)
  const { data, isLoading } = useStudentWizard()
  const [isValid, setIsValid] = useState(true)
  const { dictionary } = useDictionary()
  const students = (dictionary?.school as any)?.students
  const t = students?.enrollment as Record<string, any> | undefined

  return (
    <WizardStep
      entityId={studentId}
      nextStep={`/students/add/${studentId}/contact`}
      isValid={isValid}
      formRef={formRef}
      isLoading={isLoading}
    >
      <FormLayout>
        <FormHeading
          title={t?.title || "Enrollment Details"}
          description={
            t?.description || "Enter the student's enrollment information."
          }
        />
        {data?.application && (
          <AdmissionInfo application={data.application} t={t} />
        )}
        <EnrollmentForm
          ref={formRef}
          studentId={studentId}
          initialData={
            data
              ? ({
                  enrollmentDate: data.enrollmentDate ?? undefined,
                  admissionNumber: data.admissionNumber ?? undefined,
                  status: data.status ?? undefined,
                  studentType: data.studentType ?? undefined,
                  category: data.category ?? undefined,
                  academicGradeId: data.academicGradeId ?? undefined,
                  sectionId: data.sectionId ?? undefined,
                } as Partial<Record<string, unknown>>)
              : undefined
          }
          onValidChange={setIsValid}
        />
      </FormLayout>
    </WizardStep>
  )
}

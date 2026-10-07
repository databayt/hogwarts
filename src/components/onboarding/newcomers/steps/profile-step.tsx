"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import * as React from "react"
import { useFormContext } from "react-hook-form"

import { gradeLabel } from "@/lib/grade"
import {
  FormStepContainer,
  FormStepHeader,
  NumberField,
  SelectField,
  TextareaField,
  TextField,
} from "@/components/form"
import { useLocale } from "@/components/internationalization/use-locale"

import { NEWCOMER_STEPS, RELATIONSHIP_TYPES, TEACHER_SUBJECTS } from "../config"
import type { NewcomerFormData } from "../validation"

/**
 * Profile Step
 *
 * Fourth step of newcomers onboarding.
 * Shows role-specific fields based on the selected role.
 */
export function ProfileStep() {
  const form = useFormContext<NewcomerFormData>()
  const stepConfig = NEWCOMER_STEPS[3]
  const role = form.watch("role")

  return (
    <FormStepContainer maxWidth="md">
      <FormStepHeader
        stepNumber={4}
        totalSteps={5}
        title={stepConfig?.title || "Complete Profile"}
        description={getDescriptionForRole(role)}
        showStepIndicator={false}
      />

      <div className="space-y-4">
        {role === "teacher" && <TeacherFields />}
        {role === "parent" && <ParentFields />}
        {role === "staff" && <StaffFields />}
      </div>
    </FormStepContainer>
  )
}

function getDescriptionForRole(role?: string): string {
  switch (role) {
    case "teacher":
      return "Tell us about your teaching experience"
    case "parent":
      return "Tell us about your child"
    case "staff":
      return "Tell us about your role"
    default:
      return "Add details specific to your role"
  }
}

function TeacherFields() {
  return (
    <>
      <SelectField
        name="subjects"
        label="Subjects"
        placeholder="Select subjects you teach"
        options={TEACHER_SUBJECTS}
        required
        description="Select all subjects you can teach"
      />

      <NumberField
        name="yearsExperience"
        label="Years of Experience"
        placeholder="0"
        min={0}
        max={50}
        description="How many years have you been teaching?"
      />

      <TextareaField
        name="qualifications"
        label="Qualifications"
        placeholder="List your degrees, certifications, and relevant qualifications"
        rows={3}
      />
    </>
  )
}

// No school yet, so no country: default wording ("الصف السابع" / "Grade 7").
const GRADE_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

function ParentFields() {
  const { locale } = useLocale()
  const gradeOptions = React.useMemo(
    () =>
      GRADE_NUMBERS.map((n) => ({
        value: String(n),
        label: gradeLabel(n, { lang: locale }),
      })),
    [locale]
  )
  return (
    <>
      <SelectField
        name="relationship"
        label="Relationship to Student"
        placeholder="Select your relationship"
        options={RELATIONSHIP_TYPES}
        required
      />

      <TextField
        name="childName"
        label="Child's Full Name"
        placeholder="Enter your child's full name"
        required
      />

      <SelectField
        name="childGrade"
        label="Child's Grade Level"
        placeholder="Select grade"
        options={gradeOptions}
      />
    </>
  )
}

function StaffFields() {
  return (
    <>
      <SelectField
        name="department"
        label="Department"
        placeholder="Select your department"
        options={[
          { value: "administration", label: "Administration" },
          { value: "finance", label: "Finance" },
          { value: "hr", label: "Human Resources" },
          { value: "it", label: "IT Support" },
          { value: "maintenance", label: "Maintenance" },
          { value: "security", label: "Security" },
          { value: "cafeteria", label: "Cafeteria" },
          { value: "library", label: "Library" },
          { value: "other", label: "Other" },
        ]}
        required
      />

      <TextField
        name="position"
        label="Position/Title"
        placeholder="e.g., Office Manager, IT Specialist"
        required
      />
    </>
  )
}

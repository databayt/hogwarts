"use client"

import * as React from "react"
import { useFormContext } from "react-hook-form"

import {
  DateField,
  FormStepContainer,
  FormStepHeader,
  NumberField,
  SelectField,
  TextareaField,
  TextField,
} from "@/components/form"

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
        {role === "student" && <StudentFields />}
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
    case "student":
      return "Tell us about your academic background"
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

function StudentFields() {
  return (
    <>
      <DateField
        name="dateOfBirth"
        label="Date of Birth"
        maxDate={new Date()}
        required
      />

      <SelectField
        name="gradeLevel"
        label="Grade Level"
        placeholder="Select your grade"
        options={[
          { value: "1", label: "Grade 1" },
          { value: "2", label: "Grade 2" },
          { value: "3", label: "Grade 3" },
          { value: "4", label: "Grade 4" },
          { value: "5", label: "Grade 5" },
          { value: "6", label: "Grade 6" },
          { value: "7", label: "Grade 7" },
          { value: "8", label: "Grade 8" },
          { value: "9", label: "Grade 9" },
          { value: "10", label: "Grade 10" },
          { value: "11", label: "Grade 11" },
          { value: "12", label: "Grade 12" },
        ]}
        required
      />

      <TextField
        name="previousSchool"
        label="Previous School"
        placeholder="Name of your previous school"
        description="Leave blank if this is your first school"
      />
    </>
  )
}

function ParentFields() {
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
        options={[
          { value: "1", label: "Grade 1" },
          { value: "2", label: "Grade 2" },
          { value: "3", label: "Grade 3" },
          { value: "4", label: "Grade 4" },
          { value: "5", label: "Grade 5" },
          { value: "6", label: "Grade 6" },
          { value: "7", label: "Grade 7" },
          { value: "8", label: "Grade 8" },
          { value: "9", label: "Grade 9" },
          { value: "10", label: "Grade 10" },
          { value: "11", label: "Grade 11" },
          { value: "12", label: "Grade 12" },
        ]}
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

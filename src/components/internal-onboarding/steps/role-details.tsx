"use client"

import React, { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { Checkbox } from "@/components/ui/checkbox"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FormHeading } from "@/components/form"
import { useWizardValidation } from "@/components/form/template/wizard-validation-context"
import { useLocale } from "@/components/internationalization/use-locale"
import { TEACHER_SUBJECTS } from "@/components/onboarding/newcomers/config"

import {
  ADMIN_AREAS,
  EMPLOYMENT_TYPES,
  STEP_META,
  STUDENT_TYPES,
} from "../config"
import type {
  AdminDetailsData,
  StaffDetailsData,
  StudentDetailsData,
  TeacherDetailsData,
} from "../types"
import { useOnboarding } from "../use-onboarding"
import {
  adminDetailsSchema,
  staffDetailsSchema,
  studentDetailsSchema,
  teacherDetailsSchema,
} from "../validation"

export function RoleDetailsStep() {
  const router = useRouter()
  const params = useParams()
  const { locale } = useLocale()
  const subdomain = params.subdomain as string

  const { state, updateStepData } = useOnboarding()
  const role = state.role

  if (!role) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">Please select a role first.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <FormHeading
        title={STEP_META["role-details"].title}
        description={STEP_META["role-details"].description}
      />
      {role === "teacher" && <TeacherFields />}
      {role === "staff" && <StaffFields />}
      {role === "admin" && <AdminFields />}
      {role === "student" && <StudentFields />}
    </div>
  )
}

// =============================================================================
// TEACHER FIELDS
// =============================================================================

function TeacherFields() {
  const router = useRouter()
  const params = useParams()
  const { locale } = useLocale()
  const subdomain = params.subdomain as string
  const { state, updateStepData } = useOnboarding()
  const { enableNext, disableNext, setCustomNavigation } = useWizardValidation()

  const existing = state.formData.roleDetails as TeacherDetailsData | undefined

  const form = useForm({
    resolver: zodResolver(teacherDetailsSchema),
    defaultValues: {
      subjects: existing?.subjects || [],
      yearsOfExperience: existing?.yearsOfExperience || 0,
      employmentType: existing?.employmentType || "",
      qualificationName: existing?.qualificationName || "",
      qualificationInstitution: existing?.qualificationInstitution || "",
      qualificationYear: existing?.qualificationYear || "",
    },
  })

  useEffect(() => {
    const subscription = form.watch((value) => {
      updateStepData("roleDetails", value as TeacherDetailsData)
    })
    return () => subscription.unsubscribe()
  }, [form, updateStepData])

  useEffect(() => {
    const data = form.watch()
    const isValid =
      data.subjects && data.subjects.length > 0 && data.employmentType

    if (isValid) {
      enableNext()
      setCustomNavigation({
        onNext: async () => {
          const valid = await form.trigger()
          if (valid) {
            updateStepData(
              "roleDetails",
              form.getValues() as TeacherDetailsData
            )
            router.push(`/${locale}/s/${subdomain}/join/documents`)
          }
        },
      })
    } else {
      disableNext()
      setCustomNavigation(undefined)
    }
  })

  return (
    <Form {...form}>
      <form className="space-y-6">
        {/* Subjects */}
        <FormField
          control={form.control}
          name="subjects"
          render={() => (
            <FormItem>
              <FormLabel>Subjects *</FormLabel>
              <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                {TEACHER_SUBJECTS.map((subject) => (
                  <FormField
                    key={subject.value}
                    control={form.control}
                    name="subjects"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(subject.value)}
                            onCheckedChange={(checked) => {
                              const current = field.value || []
                              field.onChange(
                                checked
                                  ? [...current, subject.value]
                                  : current.filter(
                                      (v: string) => v !== subject.value
                                    )
                              )
                            }}
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-normal">
                          {subject.label}
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="yearsOfExperience"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Years of Experience</FormLabel>
                <FormControl>
                  <Input
                    name={field.name}
                    ref={field.ref}
                    onBlur={field.onBlur}
                    value={String(field.value ?? "")}
                    type="number"
                    min={0}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="employmentType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Employment Type *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {EMPLOYMENT_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Qualification */}
        <div>
          <h3 className="mb-4 font-medium">Qualification</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <FormField
              control={form.control}
              name="qualificationName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Degree/Certificate</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g. Bachelor of Education"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="qualificationInstitution"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Institution</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="University name" />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="qualificationYear"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Year</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g. 2020" />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </div>
      </form>
    </Form>
  )
}

// =============================================================================
// STAFF FIELDS
// =============================================================================

function StaffFields() {
  const router = useRouter()
  const params = useParams()
  const { locale } = useLocale()
  const subdomain = params.subdomain as string
  const { state, updateStepData } = useOnboarding()
  const { enableNext, disableNext, setCustomNavigation } = useWizardValidation()

  const existing = state.formData.roleDetails as StaffDetailsData | undefined

  const form = useForm({
    resolver: zodResolver(staffDetailsSchema),
    defaultValues: {
      departmentId: existing?.departmentId || "",
      position: existing?.position || "",
      employmentType: existing?.employmentType || "",
      qualificationName: existing?.qualificationName || "",
      qualificationInstitution: existing?.qualificationInstitution || "",
      qualificationYear: existing?.qualificationYear || "",
    },
  })

  useEffect(() => {
    const subscription = form.watch((value) => {
      updateStepData("roleDetails", value as StaffDetailsData)
    })
    return () => subscription.unsubscribe()
  }, [form, updateStepData])

  useEffect(() => {
    const data = form.watch()
    const isValid = data.position && data.employmentType

    if (isValid) {
      enableNext()
      setCustomNavigation({
        onNext: async () => {
          const valid = await form.trigger()
          if (valid) {
            updateStepData("roleDetails", form.getValues() as StaffDetailsData)
            router.push(`/${locale}/s/${subdomain}/join/documents`)
          }
        },
      })
    } else {
      disableNext()
      setCustomNavigation(undefined)
    }
  })

  return (
    <Form {...form}>
      <form className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="position"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Position *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="e.g. Accountant, Librarian" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="employmentType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Employment Type *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {EMPLOYMENT_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Qualification */}
        <div>
          <h3 className="mb-4 font-medium">Qualification</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <FormField
              control={form.control}
              name="qualificationName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Degree/Certificate</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g. Bachelor of Science" />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="qualificationInstitution"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Institution</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="University name" />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="qualificationYear"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Year</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g. 2020" />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </div>
      </form>
    </Form>
  )
}

// =============================================================================
// ADMIN FIELDS
// =============================================================================

function AdminFields() {
  const router = useRouter()
  const params = useParams()
  const { locale } = useLocale()
  const subdomain = params.subdomain as string
  const { state, updateStepData } = useOnboarding()
  const { enableNext, disableNext, setCustomNavigation } = useWizardValidation()

  const existing = state.formData.roleDetails as AdminDetailsData | undefined

  const form = useForm({
    resolver: zodResolver(adminDetailsSchema),
    defaultValues: {
      departmentId: existing?.departmentId || "",
      position: existing?.position || "",
      administrativeArea: existing?.administrativeArea || "",
    },
  })

  useEffect(() => {
    const subscription = form.watch((value) => {
      updateStepData("roleDetails", value as AdminDetailsData)
    })
    return () => subscription.unsubscribe()
  }, [form, updateStepData])

  useEffect(() => {
    const data = form.watch()
    const isValid = data.position && data.administrativeArea

    if (isValid) {
      enableNext()
      setCustomNavigation({
        onNext: async () => {
          const valid = await form.trigger()
          if (valid) {
            updateStepData("roleDetails", form.getValues() as AdminDetailsData)
            router.push(`/${locale}/s/${subdomain}/join/documents`)
          }
        },
      })
    } else {
      disableNext()
      setCustomNavigation(undefined)
    }
  })

  return (
    <Form {...form}>
      <form className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="position"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Position *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="e.g. Vice Principal" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="administrativeArea"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Administrative Area *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select area" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {ADMIN_AREAS.map((a) => (
                      <SelectItem key={a.value} value={a.value}>
                        {a.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </form>
    </Form>
  )
}

// =============================================================================
// STUDENT FIELDS
// =============================================================================

function StudentFields() {
  const router = useRouter()
  const params = useParams()
  const { locale } = useLocale()
  const subdomain = params.subdomain as string
  const { state, updateStepData } = useOnboarding()
  const { enableNext, disableNext, setCustomNavigation } = useWizardValidation()

  const existing = state.formData.roleDetails as StudentDetailsData | undefined
  const autoFill = state.applicationData

  const form = useForm({
    resolver: zodResolver(studentDetailsSchema),
    defaultValues: {
      gradeLevel: existing?.gradeLevel || autoFill?.applyingForClass || "",
      previousSchool:
        existing?.previousSchool || autoFill?.previousSchool || "",
      previousGrade: existing?.previousGrade || autoFill?.previousClass || "",
      studentType: existing?.studentType || "REGULAR",
    },
  })

  useEffect(() => {
    const subscription = form.watch((value) => {
      updateStepData("roleDetails", value as StudentDetailsData)
    })
    return () => subscription.unsubscribe()
  }, [form, updateStepData])

  useEffect(() => {
    const data = form.watch()
    const isValid = data.gradeLevel && data.studentType

    if (isValid) {
      enableNext()
      setCustomNavigation({
        onNext: async () => {
          const valid = await form.trigger()
          if (valid) {
            updateStepData(
              "roleDetails",
              form.getValues() as StudentDetailsData
            )
            router.push(`/${locale}/s/${subdomain}/join/documents`)
          }
        },
      })
    } else {
      disableNext()
      setCustomNavigation(undefined)
    }
  })

  return (
    <Form {...form}>
      <form className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="gradeLevel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Grade Level *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="e.g. Grade 10" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="studentType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Student Type *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {STUDENT_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="previousSchool"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Previous School</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="School name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="previousGrade"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Previous Grade</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="e.g. Grade 9" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </form>
    </Form>
  )
}

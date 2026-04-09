"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
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
import { useDictionary } from "@/components/internationalization/use-dictionary"
import { useLocale } from "@/components/internationalization/use-locale"
import { TEACHER_SUBJECTS } from "@/components/onboarding/newcomers/config"

import {
  getAdminAreas,
  getEmploymentTypes,
  getStepMeta,
  getStudentTypes,
} from "../config"
import {
  getSchoolDepartments,
  getSchoolGrades,
  getSchoolSubjects,
} from "../queries"
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
  const { state } = useOnboarding()
  const { dictionary } = useDictionary()
  const d = dictionary?.school?.onboarding?.internalJoin
  const role = state.role

  if (!role) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">
          {d?.roleDetails?.selectRoleFirst ?? "Please select a role first."}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <FormHeading
        title={getStepMeta(d)["role-details"].title}
        description={getStepMeta(d)["role-details"].description}
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
  const { state, updateStepData, schoolId } = useOnboarding()
  const { enableNext, disableNext, setCustomNavigation } = useWizardValidation()
  const { dictionary } = useDictionary()

  const d = dictionary?.school?.onboarding?.internalJoin
  const r = d?.roleDetails
  const employmentTypes = useMemo(() => getEmploymentTypes(d), [d])

  const existing = state.formData.roleDetails as TeacherDetailsData | undefined

  // Fetch school subjects
  const [schoolSubjects, setSchoolSubjects] = useState<
    { id: string; name: string }[]
  >([])
  const [loadingSubjects, setLoadingSubjects] = useState(true)

  useEffect(() => {
    getSchoolSubjects(schoolId)
      .then((s) => setSchoolSubjects(s))
      .catch(() => {})
      .finally(() => setLoadingSubjects(false))
  }, [schoolId])

  // Use school subjects if available, fall back to hardcoded list
  const subjectOptions =
    schoolSubjects.length > 0
      ? schoolSubjects.map((s) => ({ value: s.id, label: s.name }))
      : TEACHER_SUBJECTS

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
    const evaluate = (value: Partial<TeacherDetailsData>) => {
      updateStepData("roleDetails", value as TeacherDetailsData)

      const isValid =
        value.subjects && value.subjects.length > 0 && value.employmentType
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
              router.push(`/${locale}/internal-onboarding/documents`)
            }
          },
        })
      } else {
        disableNext()
        setCustomNavigation(undefined)
      }
    }

    evaluate(form.getValues() as unknown as Partial<TeacherDetailsData>)

    const subscription = form.watch((value) => {
      evaluate(value as unknown as Partial<TeacherDetailsData>)
    })
    return () => subscription.unsubscribe()
  }, [
    form,
    updateStepData,
    enableNext,
    disableNext,
    setCustomNavigation,
    router,
    locale,
    subdomain,
  ])

  return (
    <Form {...form}>
      <form className="space-y-6">
        {/* Subjects */}
        <FormField
          control={form.control}
          name="subjects"
          render={() => (
            <FormItem>
              <FormLabel>{r?.subjects ?? "Subjects"} *</FormLabel>
              {loadingSubjects ? (
                <div className="flex items-center gap-2 py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-muted-foreground text-sm">
                    {r?.loadingSubjects ?? "Loading subjects..."}
                  </span>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                  {subjectOptions.map((subject) => (
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
              )}
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
                <FormLabel>
                  {r?.yearsOfExperience ?? "Years of Experience"}
                </FormLabel>
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
                <FormLabel>
                  {r?.employmentType ?? "Employment Type"} *
                </FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={r?.selectType ?? "Select type"}
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {employmentTypes.map((t) => (
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
          <h3 className="mb-4 font-medium">
            {r?.qualification ?? "Qualification"}
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <FormField
              control={form.control}
              name="qualificationName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {r?.degreeCertificate ?? "Degree/Certificate"}
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={
                        r?.degreePlaceholder ?? "e.g. Bachelor of Education"
                      }
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
                  <FormLabel>{r?.institution ?? "Institution"}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={
                        r?.institutionPlaceholder ?? "University name"
                      }
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="qualificationYear"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{r?.year ?? "Year"}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={r?.yearPlaceholder ?? "e.g. 2020"}
                    />
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
  const { state, updateStepData, schoolId } = useOnboarding()
  const { enableNext, disableNext, setCustomNavigation } = useWizardValidation()
  const { dictionary } = useDictionary()

  const d = dictionary?.school?.onboarding?.internalJoin
  const r = d?.roleDetails
  const employmentTypes = useMemo(() => getEmploymentTypes(d), [d])

  const existing = state.formData.roleDetails as StaffDetailsData | undefined

  // Fetch school departments
  const [departments, setDepartments] = useState<
    { id: string; departmentName: string }[]
  >([])
  const [loadingDepartments, setLoadingDepartments] = useState(true)

  useEffect(() => {
    getSchoolDepartments(schoolId)
      .then((d) => setDepartments(d))
      .catch(() => {})
      .finally(() => setLoadingDepartments(false))
  }, [schoolId])

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
    const evaluate = (value: Partial<StaffDetailsData>) => {
      updateStepData("roleDetails", value as StaffDetailsData)

      const isValid = value.position && value.employmentType
      if (isValid) {
        enableNext()
        setCustomNavigation({
          onNext: async () => {
            const valid = await form.trigger()
            if (valid) {
              updateStepData(
                "roleDetails",
                form.getValues() as StaffDetailsData
              )
              router.push(`/${locale}/internal-onboarding/documents`)
            }
          },
        })
      } else {
        disableNext()
        setCustomNavigation(undefined)
      }
    }

    evaluate(form.getValues())

    const subscription = form.watch((value) => {
      evaluate(value as Partial<StaffDetailsData>)
    })
    return () => subscription.unsubscribe()
  }, [
    form,
    updateStepData,
    enableNext,
    disableNext,
    setCustomNavigation,
    router,
    locale,
    subdomain,
  ])

  return (
    <Form {...form}>
      <form className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="position"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{r?.position ?? "Position"} *</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder={
                      r?.positionTeacherPlaceholder ??
                      "e.g. Accountant, Librarian"
                    }
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
                <FormLabel>
                  {r?.employmentType ?? "Employment Type"} *
                </FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={r?.selectType ?? "Select type"}
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {employmentTypes.map((t) => (
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

        {/* Department (only shown if school has departments) */}
        {!loadingDepartments && departments.length > 0 && (
          <FormField
            control={form.control}
            name="departmentId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{r?.department ?? "Department"}</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value || ""}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={r?.selectDepartment ?? "Select department"}
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.departmentName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Qualification */}
        <div>
          <h3 className="mb-4 font-medium">
            {r?.qualification ?? "Qualification"}
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <FormField
              control={form.control}
              name="qualificationName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {r?.degreeCertificate ?? "Degree/Certificate"}
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={
                        r?.sciencePlaceholder ?? "e.g. Bachelor of Science"
                      }
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
                  <FormLabel>{r?.institution ?? "Institution"}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={
                        r?.institutionPlaceholder ?? "University name"
                      }
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="qualificationYear"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{r?.year ?? "Year"}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={r?.yearPlaceholder ?? "e.g. 2020"}
                    />
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
  const { state, updateStepData, schoolId } = useOnboarding()
  const { enableNext, disableNext, setCustomNavigation } = useWizardValidation()
  const { dictionary } = useDictionary()

  const d = dictionary?.school?.onboarding?.internalJoin
  const r = d?.roleDetails
  const adminAreas = useMemo(() => getAdminAreas(d), [d])

  const existing = state.formData.roleDetails as AdminDetailsData | undefined

  // Fetch school departments
  const [departments, setDepartments] = useState<
    { id: string; departmentName: string }[]
  >([])
  const [loadingDepartments, setLoadingDepartments] = useState(true)

  useEffect(() => {
    getSchoolDepartments(schoolId)
      .then((d) => setDepartments(d))
      .catch(() => {})
      .finally(() => setLoadingDepartments(false))
  }, [schoolId])

  const form = useForm({
    resolver: zodResolver(adminDetailsSchema),
    defaultValues: {
      departmentId: existing?.departmentId || "",
      position: existing?.position || "",
      administrativeArea: existing?.administrativeArea || "",
    },
  })

  useEffect(() => {
    const evaluate = (value: Partial<AdminDetailsData>) => {
      updateStepData("roleDetails", value as AdminDetailsData)

      const isValid = value.position && value.administrativeArea
      if (isValid) {
        enableNext()
        setCustomNavigation({
          onNext: async () => {
            const valid = await form.trigger()
            if (valid) {
              updateStepData(
                "roleDetails",
                form.getValues() as AdminDetailsData
              )
              router.push(`/${locale}/internal-onboarding/documents`)
            }
          },
        })
      } else {
        disableNext()
        setCustomNavigation(undefined)
      }
    }

    evaluate(form.getValues())

    const subscription = form.watch((value) => {
      evaluate(value as Partial<AdminDetailsData>)
    })
    return () => subscription.unsubscribe()
  }, [
    form,
    updateStepData,
    enableNext,
    disableNext,
    setCustomNavigation,
    router,
    locale,
    subdomain,
  ])

  return (
    <Form {...form}>
      <form className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="position"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{r?.position ?? "Position"} *</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder={
                      r?.positionAdminPlaceholder ?? "e.g. Vice Principal"
                    }
                  />
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
                <FormLabel>
                  {r?.administrativeArea ?? "Administrative Area"} *
                </FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={r?.selectArea ?? "Select area"}
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {adminAreas.map((a) => (
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

        {/* Department (only shown if school has departments) */}
        {!loadingDepartments && departments.length > 0 && (
          <FormField
            control={form.control}
            name="departmentId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{r?.department ?? "Department"}</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value || ""}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={r?.selectDepartment ?? "Select department"}
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.departmentName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
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
  const { state, updateStepData, schoolId } = useOnboarding()
  const { enableNext, disableNext, setCustomNavigation } = useWizardValidation()
  const { dictionary } = useDictionary()

  const d = dictionary?.school?.onboarding?.internalJoin
  const r = d?.roleDetails
  const studentTypes = useMemo(() => getStudentTypes(d), [d])

  const existing = state.formData.roleDetails as StudentDetailsData | undefined
  const autoFill = state.applicationData

  // Fetch school grades
  const [grades, setGrades] = useState<
    { id: string; name: string; gradeNumber: number }[]
  >([])
  const [loadingGrades, setLoadingGrades] = useState(true)

  useEffect(() => {
    getSchoolGrades(schoolId)
      .then((g) => setGrades(g))
      .catch(() => {})
      .finally(() => setLoadingGrades(false))
  }, [schoolId])

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
    const evaluate = (value: Partial<StudentDetailsData>) => {
      updateStepData("roleDetails", value as StudentDetailsData)

      const isValid = value.gradeLevel && value.studentType
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
              router.push(`/${locale}/internal-onboarding/documents`)
            }
          },
        })
      } else {
        disableNext()
        setCustomNavigation(undefined)
      }
    }

    evaluate(form.getValues())

    const subscription = form.watch((value) => {
      evaluate(value as Partial<StudentDetailsData>)
    })
    return () => subscription.unsubscribe()
  }, [
    form,
    updateStepData,
    enableNext,
    disableNext,
    setCustomNavigation,
    router,
    locale,
    subdomain,
  ])

  return (
    <Form {...form}>
      <form className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="gradeLevel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{r?.gradeLevel ?? "Grade Level"} *</FormLabel>
                {loadingGrades ? (
                  <div className="flex items-center gap-2 py-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-muted-foreground text-sm">
                      {r?.loadingGrades ?? "Loading grades..."}
                    </span>
                  </div>
                ) : grades.length > 0 ? (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={r?.selectGrade ?? "Select grade"}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {grades.map((g) => (
                        <SelectItem key={g.id} value={g.name}>
                          {g.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={r?.gradePlaceholder ?? "e.g. Grade 10"}
                    />
                  </FormControl>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="studentType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{r?.studentType ?? "Student Type"} *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={r?.selectType ?? "Select type"}
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {studentTypes.map((t) => (
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
                <FormLabel>{r?.previousSchool ?? "Previous School"}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder={r?.schoolName ?? "School name"}
                  />
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
                <FormLabel>{r?.previousGrade ?? "Previous Grade"}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder={r?.previousGradePlaceholder ?? "e.g. Grade 9"}
                  />
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

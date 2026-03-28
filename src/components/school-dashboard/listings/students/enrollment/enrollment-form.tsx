"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { BookOpen, CreditCard, TriangleAlert, Users } from "lucide-react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Icons } from "@/components/icons"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import type { Batch, Student } from "../registration/types"
import type { Course, Section, Subject } from "./types"
import { enrollmentSchema, type EnrollmentFormInput } from "./validation"

interface EnrollmentFormProps {
  student?: Student
  batches: Batch[]
  courses: Course[]
  subjects: Subject[]
  sections: Section[]
  onSubmit: (data: EnrollmentFormInput) => Promise<void>
  onCancel: () => void
}

export function EnrollmentForm({
  student,
  batches,
  courses,
  subjects,
  sections,
  onSubmit,
  onCancel,
}: EnrollmentFormProps) {
  const { dictionary } = useDictionary()
  const t = dictionary?.messages?.toast
  const ef = dictionary?.school?.students?.enrollmentForm
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null)
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)

  const form = useForm<EnrollmentFormInput>({
    resolver: zodResolver(enrollmentSchema) as any,
    defaultValues: {
      studentId: student?.id || "",
      enrollmentDate: new Date(),
      enrollmentType: "NEW",
      mandatorySubjects: [],
      electiveSubjects: [],
      transportRequired: false,
      hostelRequired: false,
      libraryAccess: true,
      labAccess: true,
    },
  })

  const enrollmentType = form.watch("enrollmentType")
  const selectedBatchId = form.watch("batchId")
  const selectedCourseId = form.watch("courseId")

  // ListFilter subjects based on selected course
  const courseSubjects = selectedCourse
    ? subjects.filter((s) =>
        selectedCourse.subjects?.some((cs) => cs.id === s.id)
      )
    : subjects

  const mandatorySubjects = courseSubjects.filter((s) => s.type === "MANDATORY")
  const electiveSubjects = courseSubjects.filter((s) => s.type === "ELECTIVE")
  const languageSubjects = courseSubjects.filter((s) => s.type === "LANGUAGE")

  // ListFilter sections based on selected batch
  const batchSections = sections.filter((s) => s.batchId === selectedBatchId)

  const handleSubmit = async (data: EnrollmentFormInput) => {
    try {
      setIsSubmitting(true)
      await onSubmit(data)
      toast.success(
        t?.success?.studentCreated || "Student enrolled successfully"
      )
    } catch (error) {
      toast.error(t?.error?.generic || "Failed to enroll student")
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <Tabs defaultValue="student" className="space-y-4">
          <TabsList className="grid w-full max-w-2xl grid-cols-4">
            <TabsTrigger value="student">
              <Users className="me-2 h-4 w-4" />
              {ef?.tabs?.student || "Student"}
            </TabsTrigger>
            <TabsTrigger value="academic">
              <BookOpen className="me-2 h-4 w-4" />
              {ef?.tabs?.academic || "Academic"}
            </TabsTrigger>
            <TabsTrigger value="fees">
              <CreditCard className="me-2 h-4 w-4" />
              {ef?.tabs?.feesServices || "Fees & Services"}
            </TabsTrigger>
            <TabsTrigger value="documents">
              <Icons.fileText className="me-2 h-4 w-4" />
              {ef?.tabs?.documents || "Documents"}
            </TabsTrigger>
          </TabsList>

          {/* Student Information Tab */}
          <TabsContent value="student" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>
                  {ef?.studentInfo?.title || "Student Information"}
                </CardTitle>
                <CardDescription>
                  {ef?.studentInfo?.description ||
                    "Basic enrollment details for the student"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {student && (
                  <Alert>
                    <Icons.info className="h-4 w-4" />
                    <AlertDescription>
                      {ef?.studentInfo?.enrolling || "Enrolling:"}{" "}
                      <strong>
                        {student.firstName} {student.lastName}
                      </strong>
                      {student.grNumber && ` (${student.grNumber})`}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="enrollmentType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {ef?.studentInfo?.enrollmentType || "Enrollment Type"}
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue
                                placeholder={
                                  ef?.studentInfo?.selectEnrollmentType ||
                                  "Select enrollment type"
                                }
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="NEW">
                              {ef?.studentInfo?.newAdmission || "New Admission"}
                            </SelectItem>
                            <SelectItem value="TRANSFER">
                              {ef?.studentInfo?.transfer || "Transfer"}
                            </SelectItem>
                            <SelectItem value="READMISSION">
                              {ef?.studentInfo?.readmission || "Readmission"}
                            </SelectItem>
                            <SelectItem value="PROMOTION">
                              {ef?.studentInfo?.promotion || "Promotion"}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="enrollmentDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {ef?.studentInfo?.enrollmentDate || "Enrollment Date"}
                        </FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full justify-start text-start font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                <Icons.calendar className="me-2 h-4 w-4" />
                                {field.value
                                  ? format(field.value, "PPP")
                                  : ef?.studentInfo?.pickDate || "Pick a date"}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date > new Date() ||
                                date < new Date("1900-01-01")
                              }
                              autoFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {(enrollmentType === "TRANSFER" ||
                  enrollmentType === "READMISSION") && (
                  <div className="space-y-4 border-t pt-4">
                    <h4 className="text-sm font-medium">
                      {ef?.studentInfo?.previousInstitution ||
                        "Previous Institution Details"}
                    </h4>

                    <FormField
                      control={form.control}
                      name="previousSchoolId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {ef?.studentInfo?.previousSchool ||
                              "Previous School"}
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder={
                                ef?.studentInfo?.enterPreviousSchool ||
                                "Enter previous school name"
                              }
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="transferReason"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {enrollmentType === "TRANSFER"
                              ? ef?.studentInfo?.reasonForTransfer ||
                                "Reason for Transfer"
                              : ef?.studentInfo?.reasonForReadmission ||
                                "Reason for Readmission"}
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder={
                                ef?.studentInfo?.provideReason ||
                                "Provide detailed reason..."
                              }
                              className="min-h-[100px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Academic Tab */}
          <TabsContent value="academic" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>
                  {ef?.academic?.title || "Academic Details"}
                </CardTitle>
                <CardDescription>
                  {ef?.academic?.description ||
                    "Select batch, course, and subjects for enrollment"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="academicYearId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {ef?.academic?.academicYear || "Academic Year"}
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue
                                placeholder={
                                  ef?.academic?.selectAcademicYear ||
                                  "Select academic year"
                                }
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="2024-25">2024-25</SelectItem>
                            <SelectItem value="2025-26">2025-26</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="batchId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{ef?.academic?.batch || "Batch"}</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value)
                            const batch = batches.find((b) => b.id === value)
                            setSelectedBatch(batch || null)
                          }}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue
                                placeholder={
                                  ef?.academic?.selectBatch || "Select batch"
                                }
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {batches.map((batch) => (
                              <SelectItem key={batch.id} value={batch.id}>
                                {batch.name} ({batch.currentStrength}/
                                {batch.maxCapacity})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="courseId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {ef?.academic?.courseOptional || "Course (Optional)"}
                        </FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value)
                            const course = courses.find((c) => c.id === value)
                            setSelectedCourse(course || null)
                          }}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue
                                placeholder={
                                  ef?.academic?.selectCourse || "Select course"
                                }
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {courses.map((course) => (
                              <SelectItem key={course.id} value={course.id}>
                                {course.name} ({course.code})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          {ef?.academic?.courseDescription ||
                            "Select if student is enrolling in a specific course"}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="sectionId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {ef?.academic?.sectionOptional ||
                            "Section (Optional)"}
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue
                                placeholder={
                                  ef?.academic?.selectSection ||
                                  "Select section"
                                }
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {batchSections.map((section) => (
                              <SelectItem key={section.id} value={section.id}>
                                {ef?.academic?.section || "Section"}{" "}
                                {section.name} ({section.currentStrength}/
                                {section.capacity})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Subject Selection */}
                <div className="space-y-4 border-t pt-4">
                  <h4 className="text-sm font-medium">
                    {ef?.academic?.subjectSelection || "Subject Selection"}
                  </h4>

                  {/* Mandatory Subjects */}
                  <FormField
                    control={form.control}
                    name="mandatorySubjects"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {ef?.academic?.mandatorySubjects ||
                            "Mandatory Subjects"}
                        </FormLabel>
                        <FormDescription>
                          {ef?.academic?.mandatoryDescription ||
                            "These subjects are required for the selected course"}
                        </FormDescription>
                        <div className="mt-2 grid grid-cols-2 gap-3">
                          {mandatorySubjects.map((subject) => (
                            <div
                              key={subject.id}
                              className="flex items-center gap-2"
                            >
                              <Checkbox
                                checked={field.value?.includes(subject.id)}
                                onCheckedChange={(checked) => {
                                  const updated = checked
                                    ? [...(field.value || []), subject.id]
                                    : field.value?.filter(
                                        (id) => id !== subject.id
                                      ) || []
                                  field.onChange(updated)
                                }}
                              />
                              <label className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                {subject.name} ({subject.code})
                                {subject.credits && (
                                  <Badge
                                    variant="outline"
                                    className="ms-2 text-xs"
                                  >
                                    {subject.credits}{" "}
                                    {ef?.academic?.credits || "credits"}
                                  </Badge>
                                )}
                              </label>
                            </div>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Elective Subjects */}
                  {electiveSubjects.length > 0 && (
                    <FormField
                      control={form.control}
                      name="electiveSubjects"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {ef?.academic?.electiveSubjects ||
                              "Elective Subjects"}
                          </FormLabel>
                          <FormDescription>
                            {ef?.academic?.electiveDescription ||
                              "Choose optional subjects based on student preference"}
                          </FormDescription>
                          <div className="mt-2 grid grid-cols-2 gap-3">
                            {electiveSubjects.map((subject) => (
                              <div
                                key={subject.id}
                                className="flex items-center gap-2"
                              >
                                <Checkbox
                                  checked={field.value?.includes(subject.id)}
                                  onCheckedChange={(checked) => {
                                    const updated = checked
                                      ? [...(field.value || []), subject.id]
                                      : field.value?.filter(
                                          (id) => id !== subject.id
                                        ) || []
                                    field.onChange(updated)
                                  }}
                                />
                                <label className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                  {subject.name} ({subject.code})
                                  {subject.credits && (
                                    <Badge
                                      variant="outline"
                                      className="ms-2 text-xs"
                                    >
                                      {subject.credits}{" "}
                                      {ef?.academic?.credits || "credits"}
                                    </Badge>
                                  )}
                                </label>
                              </div>
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {/* Language Preference */}
                  {languageSubjects.length > 0 && (
                    <FormField
                      control={form.control}
                      name="languagePreference"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {ef?.academic?.languagePreference ||
                              "Language Preference"}
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue
                                  placeholder={
                                    ef?.academic?.selectLanguage ||
                                    "Select language"
                                  }
                                />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {languageSubjects.map((subject) => (
                                <SelectItem key={subject.id} value={subject.id}>
                                  {subject.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                <FormField
                  control={form.control}
                  name="expectedGraduationDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {ef?.academic?.expectedGraduation ||
                          "Expected Graduation Date (Optional)"}
                      </FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-start font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              <Icons.calendar className="me-2 h-4 w-4" />
                              {field.value
                                ? format(field.value, "PPP")
                                : ef?.studentInfo?.pickDate || "Pick a date"}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date()}
                            autoFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Fees & Services Tab */}
          <TabsContent value="fees" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>
                  {ef?.fees?.title || "Fees & Additional Services"}
                </CardTitle>
                <CardDescription>
                  {ef?.fees?.description ||
                    "Configure fee structure and additional services"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="feeStructureId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {ef?.fees?.feeStructure || "Fee Structure (Optional)"}
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue
                                placeholder={
                                  ef?.fees?.selectFeeStructure ||
                                  "Select fee structure"
                                }
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="standard">
                              {ef?.fees?.standardFee || "Standard Fee"}
                            </SelectItem>
                            <SelectItem value="subsidized">
                              {ef?.fees?.subsidizedFee || "Subsidized Fee"}
                            </SelectItem>
                            <SelectItem value="premium">
                              {ef?.fees?.premiumFee || "Premium Fee"}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="scholarshipId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {ef?.fees?.scholarship || "Scholarship (Optional)"}
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue
                                placeholder={
                                  ef?.fees?.selectScholarship ||
                                  "Select scholarship"
                                }
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="merit">
                              {ef?.fees?.meritScholarship ||
                                "Merit Scholarship"}
                            </SelectItem>
                            <SelectItem value="sports">
                              {ef?.fees?.sportsScholarship ||
                                "Sports Scholarship"}
                            </SelectItem>
                            <SelectItem value="need">
                              {ef?.fees?.needBasedScholarship ||
                                "Need-Based Scholarship"}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="discountPercentage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {ef?.fees?.discountPercentage ||
                            "Discount Percentage (Optional)"}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0-100"
                            {...field}
                            onChange={(e) =>
                              field.onChange(e.target.valueAsNumber)
                            }
                          />
                        </FormControl>
                        <FormDescription>
                          {ef?.fees?.discountDescription ||
                            "Additional discount on fees (if applicable)"}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4 border-t pt-4">
                  <h4 className="text-sm font-medium">
                    {ef?.fees?.additionalServices || "Additional Services"}
                  </h4>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="transportRequired"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-y-0 gap-x-3">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              {ef?.fees?.transportRequired ||
                                "Transport Required"}
                            </FormLabel>
                            <FormDescription>
                              {ef?.fees?.transportDescription ||
                                "School bus/van service needed"}
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="hostelRequired"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-y-0 gap-x-3">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              {ef?.fees?.hostelRequired || "Hostel Required"}
                            </FormLabel>
                            <FormDescription>
                              {ef?.fees?.hostelDescription ||
                                "Accommodation needed"}
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="libraryAccess"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-y-0 gap-x-3">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              {ef?.fees?.libraryAccess || "Library Access"}
                            </FormLabel>
                            <FormDescription>
                              {ef?.fees?.libraryDescription ||
                                "Access to school library"}
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="labAccess"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-y-0 gap-x-3">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              {ef?.fees?.labAccess || "Lab Access"}
                            </FormLabel>
                            <FormDescription>
                              {ef?.fees?.labDescription ||
                                "Access to science/computer labs"}
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>
                  {ef?.documents?.title || "Required Documents"}
                </CardTitle>
                <CardDescription>
                  {ef?.documents?.description ||
                    "Mark documents that have been submitted"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {enrollmentType === "TRANSFER" && (
                  <Alert>
                    <TriangleAlert className="h-4 w-4" />
                    <AlertDescription>
                      {ef?.documents?.transferAlert ||
                        "Transfer students must submit additional documents"}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-3">
                  <FormField
                    control={form.control}
                    name="transferCertificate"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-y-0 gap-x-3">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            {ef?.documents?.transferCertificate ||
                              "Transfer Certificate"}
                          </FormLabel>
                          <FormDescription>
                            {ef?.documents?.transferCertificateDesc ||
                              "Original TC from previous school"}
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="previousMarksheets"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-y-0 gap-x-3">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            {ef?.documents?.previousMarksheets ||
                              "Previous Marksheets"}
                          </FormLabel>
                          <FormDescription>
                            {ef?.documents?.previousMarksheetsDesc ||
                              "Last 2 years academic records"}
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="migrationCertificate"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-y-0 gap-x-3">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            {ef?.documents?.migrationCertificate ||
                              "Migration Certificate"}
                          </FormLabel>
                          <FormDescription>
                            {ef?.documents?.migrationCertificateDesc ||
                              "Required for inter-state transfers"}
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {ef?.documents?.additionalNotes ||
                          "Additional Notes (Optional)"}
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={
                            ef?.documents?.additionalNotesPlaceholder ||
                            "Any additional information about the enrollment..."
                          }
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onCancel}>
            {ef?.actions?.cancel || "Cancel"}
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && (
              <Icons.circleCheck className="me-2 h-4 w-4 animate-spin" />
            )}
            {isSubmitting
              ? ef?.actions?.enrolling || "Enrolling..."
              : ef?.actions?.enrollStudent || "Enroll Student"}
          </Button>
        </div>
      </form>
    </Form>
  )
}

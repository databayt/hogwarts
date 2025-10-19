"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, CheckCircle, Info, AlertTriangle, Users, BookOpen, CreditCard, FileText } from "lucide-react";
import { enrollmentSchema, type EnrollmentFormInput } from "./validation";
import type { Student, Batch } from "../registration/types";
import type { Course, Subject, Section } from "./types";
import { toast } from "sonner";

interface EnrollmentFormProps {
  student?: Student;
  batches: Batch[];
  courses: Course[];
  subjects: Subject[];
  sections: Section[];
  onSubmit: (data: EnrollmentFormInput) => Promise<void>;
  onCancel: () => void;
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

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
  });

  const enrollmentType = form.watch("enrollmentType");
  const selectedBatchId = form.watch("batchId");
  const selectedCourseId = form.watch("courseId");

  // Filter subjects based on selected course
  const courseSubjects = selectedCourse
    ? subjects.filter(s => selectedCourse.subjects?.some(cs => cs.id === s.id))
    : subjects;

  const mandatorySubjects = courseSubjects.filter(s => s.type === "MANDATORY");
  const electiveSubjects = courseSubjects.filter(s => s.type === "ELECTIVE");
  const languageSubjects = courseSubjects.filter(s => s.type === "LANGUAGE");

  // Filter sections based on selected batch
  const batchSections = sections.filter(s => s.batchId === selectedBatchId);

  const handleSubmit = async (data: EnrollmentFormInput) => {
    try {
      setIsSubmitting(true);
      await onSubmit(data);
      toast.success("Student enrolled successfully");
    } catch (error) {
      toast.error("Failed to enroll student");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <Tabs defaultValue="student" className="space-y-4">
          <TabsList className="grid grid-cols-4 w-full max-w-2xl">
            <TabsTrigger value="student">
              <Users className="h-4 w-4 mr-2" />
              Student
            </TabsTrigger>
            <TabsTrigger value="academic">
              <BookOpen className="h-4 w-4 mr-2" />
              Academic
            </TabsTrigger>
            <TabsTrigger value="fees">
              <CreditCard className="h-4 w-4 mr-2" />
              Fees & Services
            </TabsTrigger>
            <TabsTrigger value="documents">
              <FileText className="h-4 w-4 mr-2" />
              Documents
            </TabsTrigger>
          </TabsList>

          {/* Student Information Tab */}
          <TabsContent value="student" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Student Information</CardTitle>
                <CardDescription>
                  Basic enrollment details for the student
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {student && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Enrolling: <strong>{student.givenName} {student.surname}</strong>
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
                        <FormLabel>Enrollment Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select enrollment type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="NEW">New Admission</SelectItem>
                            <SelectItem value="TRANSFER">Transfer</SelectItem>
                            <SelectItem value="READMISSION">Readmission</SelectItem>
                            <SelectItem value="PROMOTION">Promotion</SelectItem>
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
                        <FormLabel>Enrollment Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full justify-start text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {field.value ? format(field.value, "PPP") : "Pick a date"}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {(enrollmentType === "TRANSFER" || enrollmentType === "READMISSION") && (
                  <div className="space-y-4 pt-4 border-t">
                    <h4 className="text-sm font-medium">Previous Institution Details</h4>

                    <FormField
                      control={form.control}
                      name="previousSchoolId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Previous School</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter previous school name" {...field} />
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
                          <FormLabel>Reason for {enrollmentType === "TRANSFER" ? "Transfer" : "Readmission"}</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Provide detailed reason..."
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
                <CardTitle>Academic Details</CardTitle>
                <CardDescription>
                  Select batch, course, and subjects for enrollment
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="academicYearId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Academic Year</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select academic year" />
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
                        <FormLabel>Batch</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value);
                            const batch = batches.find(b => b.id === value);
                            setSelectedBatch(batch || null);
                          }}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select batch" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {batches.map((batch) => (
                              <SelectItem key={batch.id} value={batch.id}>
                                {batch.name} ({batch.currentStrength}/{batch.maxCapacity})
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
                        <FormLabel>Course (Optional)</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value);
                            const course = courses.find(c => c.id === value);
                            setSelectedCourse(course || null);
                          }}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select course" />
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
                          Select if student is enrolling in a specific course
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
                        <FormLabel>Section (Optional)</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select section" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {batchSections.map((section) => (
                              <SelectItem key={section.id} value={section.id}>
                                Section {section.name} ({section.currentStrength}/{section.capacity})
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
                <div className="space-y-4 pt-4 border-t">
                  <h4 className="text-sm font-medium">Subject Selection</h4>

                  {/* Mandatory Subjects */}
                  <FormField
                    control={form.control}
                    name="mandatorySubjects"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mandatory Subjects</FormLabel>
                        <FormDescription>
                          These subjects are required for the selected course
                        </FormDescription>
                        <div className="grid grid-cols-2 gap-3 mt-2">
                          {mandatorySubjects.map((subject) => (
                            <div key={subject.id} className="flex items-center space-x-2">
                              <Checkbox
                                checked={field.value?.includes(subject.id)}
                                onCheckedChange={(checked) => {
                                  const updated = checked
                                    ? [...(field.value || []), subject.id]
                                    : field.value?.filter(id => id !== subject.id) || [];
                                  field.onChange(updated);
                                }}
                              />
                              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                {subject.name} ({subject.code})
                                {subject.credits && (
                                  <Badge variant="outline" className="ml-2 text-xs">
                                    {subject.credits} credits
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
                          <FormLabel>Elective Subjects</FormLabel>
                          <FormDescription>
                            Choose optional subjects based on student preference
                          </FormDescription>
                          <div className="grid grid-cols-2 gap-3 mt-2">
                            {electiveSubjects.map((subject) => (
                              <div key={subject.id} className="flex items-center space-x-2">
                                <Checkbox
                                  checked={field.value?.includes(subject.id)}
                                  onCheckedChange={(checked) => {
                                    const updated = checked
                                      ? [...(field.value || []), subject.id]
                                      : field.value?.filter(id => id !== subject.id) || [];
                                    field.onChange(updated);
                                  }}
                                />
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                  {subject.name} ({subject.code})
                                  {subject.credits && (
                                    <Badge variant="outline" className="ml-2 text-xs">
                                      {subject.credits} credits
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
                          <FormLabel>Language Preference</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select language" />
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
                      <FormLabel>Expected Graduation Date (Optional)</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? format(field.value, "PPP") : "Pick a date"}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date()}
                            initialFocus
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
                <CardTitle>Fees & Additional Services</CardTitle>
                <CardDescription>
                  Configure fee structure and additional services
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="feeStructureId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fee Structure (Optional)</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select fee structure" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="standard">Standard Fee</SelectItem>
                            <SelectItem value="subsidized">Subsidized Fee</SelectItem>
                            <SelectItem value="premium">Premium Fee</SelectItem>
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
                        <FormLabel>Scholarship (Optional)</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select scholarship" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="merit">Merit Scholarship</SelectItem>
                            <SelectItem value="sports">Sports Scholarship</SelectItem>
                            <SelectItem value="need">Need-Based Scholarship</SelectItem>
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
                        <FormLabel>Discount Percentage (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0-100"
                            {...field}
                            onChange={(e) => field.onChange(e.target.valueAsNumber)}
                          />
                        </FormControl>
                        <FormDescription>
                          Additional discount on fees (if applicable)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <h4 className="text-sm font-medium">Additional Services</h4>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="transportRequired"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Transport Required</FormLabel>
                            <FormDescription>
                              School bus/van service needed
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="hostelRequired"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Hostel Required</FormLabel>
                            <FormDescription>
                              Accommodation needed
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="libraryAccess"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Library Access</FormLabel>
                            <FormDescription>
                              Access to school library
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="labAccess"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Lab Access</FormLabel>
                            <FormDescription>
                              Access to science/computer labs
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
                <CardTitle>Required Documents</CardTitle>
                <CardDescription>
                  Mark documents that have been submitted
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {enrollmentType === "TRANSFER" && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Transfer students must submit additional documents
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-3">
                  <FormField
                    control={form.control}
                    name="transferCertificate"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Transfer Certificate</FormLabel>
                          <FormDescription>
                            Original TC from previous school
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="previousMarksheets"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Previous Marksheets</FormLabel>
                          <FormDescription>
                            Last 2 years academic records
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="migrationCertificate"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Migration Certificate</FormLabel>
                          <FormDescription>
                            Required for inter-state transfers
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
                      <FormLabel>Additional Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Any additional information about the enrollment..."
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
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <CheckCircle className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? "Enrolling..." : "Enroll Student"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
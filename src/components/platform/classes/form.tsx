"use client";

import { useState, useEffect, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// UI Components
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

// Icons
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Save,
  BookOpen,
  Users,
  Calendar,
  Clock,
  MapPin,
  X,
} from "lucide-react";

// Utilities
import { cn } from "@/lib/utils";
import { classCreateSchema } from "./validation";
import { createClass, getClass, updateClass } from "./actions";
import type { Dictionary } from "@/components/internationalization/dictionaries";

// Shared Form Components
import { FormProgress } from "@/components/platform/shared/form-utils";

// ============================================================================
// Types
// ============================================================================

interface ClassFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId?: string | null;
  mode?: "create" | "edit" | "view";
  dictionary?: Dictionary["school"]["classes"];
}

// ============================================================================
// Main Class Form Component (All Steps in One File)
// ============================================================================

export function ClassForm({
  open,
  onOpenChange,
  classId,
  mode = "create",
  dictionary,
}: ClassFormProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const totalSteps = 3; // Basic Info, Schedule, Review

  // Initialize form
  const form = useForm<z.infer<typeof classCreateSchema>>({
    resolver: zodResolver(classCreateSchema) as any,
    defaultValues: {
      name: "",
      subjectId: "",
      teacherId: "",
      termId: "",
      startPeriodId: "",
      endPeriodId: "",
      classroomId: "",
      evaluationType: "NORMAL",
      courseCode: "",
      credits: undefined,
      minCapacity: undefined,
      maxCapacity: undefined,
      duration: undefined,
      prerequisiteId: "",
    },
  });

  const isView = mode === "view";

  // Load class data if editing or viewing
  useEffect(() => {
    const loadClass = async () => {
      if (!classId || mode === "create") return;
      setIsLoading(true);
      try {
        const res = await getClass({ id: classId });
        if (res.class) {
          const c = res.class as any;
          form.reset({
            name: c.name || "",
            subjectId: c.subjectId || "",
            teacherId: c.teacherId || "",
            termId: c.termId || "",
            startPeriodId: c.startPeriodId || "",
            endPeriodId: c.endPeriodId || "",
            classroomId: c.classroomId || "",
          });
        }
      } catch (error) {
        toast.error("Failed to load class");
      } finally {
        setIsLoading(false);
      }
    };

    loadClass();
  }, [classId, mode, form, dictionary]);

  // Handle form submission
  async function onSubmit(values: z.infer<typeof classCreateSchema>) {
    startTransition(async () => {
      try {
        const res =
          mode === "edit" && classId
            ? await updateClass({ id: classId, ...values })
            : await createClass(values);

        if (res?.success) {
          const successMsg =
            mode === "edit"
              ? "Class updated successfully"
              : "Class created successfully";
          toast.success(successMsg);
          onOpenChange(false);
          router.refresh();
        } else {
          throw new Error("Operation failed");
        }
      } catch (error) {
        const errorMsg =
          mode === "edit"
            ? "Failed to update class"
            : "Failed to create class";
        toast.error(errorMsg);
      }
    });
  }

  // Step navigation
  const handleNext = async () => {
    let fieldsToValidate: any[] = [];

    switch (currentStep) {
      case 1: // Basic Information
        fieldsToValidate = ["name", "subjectId", "teacherId"];
        break;
      case 2: // Schedule
        fieldsToValidate = ["termId", "classroomId"];
        break;
    }

    if (fieldsToValidate.length > 0) {
      const isValid = await form.trigger(fieldsToValidate as any);
      if (!isValid) return;
    }

    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      await form.handleSubmit(onSubmit)();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // ============================================================================
  // Step 1: Basic Information
  // ============================================================================
  const renderBasicInformation = () => (
    <div className="space-y-4">
      {isLoading ? (
        <>
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </>
      ) : (
        <>
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Class Name *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., Mathematics - Grade 10A"
                    disabled={isView}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="subjectId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={isView}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select subject" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="math">Mathematics</SelectItem>
                      <SelectItem value="science">Science</SelectItem>
                      <SelectItem value="english">English</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="teacherId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teacher *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={isView}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select teacher" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="teacher1">Mr. Smith</SelectItem>
                      <SelectItem value="teacher2">Ms. Johnson</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Separator />

          <h4 className="text-sm font-medium">Capacity & Details</h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="minCapacity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Minimum Capacity</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="10"
                      disabled={isView}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Minimum students required
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="maxCapacity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Maximum Capacity</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="30"
                      disabled={isView}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Maximum students allowed
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="credits"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Credit Hours</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="3"
                      disabled={isView}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="courseCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Course Code</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="MATH101"
                      disabled={isView}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </>
      )}
    </div>
  );

  // ============================================================================
  // Step 2: Schedule & Location
  // ============================================================================
  const renderSchedule = () => (
    <div className="space-y-4">
      {isLoading ? (
        <>
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </>
      ) : (
        <>
          <h4 className="text-sm font-medium">Schedule</h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="termId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Term *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={isView}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select term" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="term1">Fall 2024</SelectItem>
                      <SelectItem value="term2">Spring 2025</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duration (minutes)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="50"
                      disabled={isView}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="startPeriodId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Period *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={isView}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select start period" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="period1">Period 1</SelectItem>
                      <SelectItem value="period2">Period 2</SelectItem>
                      <SelectItem value="period3">Period 3</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="endPeriodId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End Period *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={isView}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select end period" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="period1">Period 1</SelectItem>
                      <SelectItem value="period2">Period 2</SelectItem>
                      <SelectItem value="period3">Period 3</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Separator />

          <h4 className="text-sm font-medium">Location</h4>

          <FormField
            control={form.control}
            name="classroomId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Classroom *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} disabled={isView}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select classroom" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="room101">Room 101</SelectItem>
                    <SelectItem value="room102">Room 102</SelectItem>
                    <SelectItem value="room103">Room 103</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="evaluationType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Evaluation Type *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} disabled={isView}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select evaluation type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="NORMAL">Normal</SelectItem>
                    <SelectItem value="GPA">GPA</SelectItem>
                    <SelectItem value="CWA">CWA</SelectItem>
                    <SelectItem value="CCE">CCE</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </>
      )}
    </div>
  );

  // ============================================================================
  // Step 3: Review & Submit
  // ============================================================================
  const renderReview = () => {
    const values = form.getValues();

    return (
      <div className="space-y-4">
        {isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : (
          <>
            <div className="rounded-lg border p-4">
              <h4 className="font-medium mb-3 flex items-center">
                <BookOpen className="mr-2 h-4 w-4" />
                Basic Information
              </h4>
              <dl className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <dt className="text-muted-foreground">Class Name</dt>
                  <dd className="font-medium">{values.name || "-"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Course Code</dt>
                  <dd className="font-medium">{values.courseCode || "-"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Subject</dt>
                  <dd className="font-medium">{values.subjectId || "-"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Teacher</dt>
                  <dd className="font-medium">{values.teacherId || "-"}</dd>
                </div>
              </dl>
            </div>

            <div className="rounded-lg border p-4">
              <h4 className="font-medium mb-3 flex items-center">
                <Clock className="mr-2 h-4 w-4" />
                Schedule
              </h4>
              <dl className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <dt className="text-muted-foreground">Term</dt>
                  <dd className="font-medium">{values.termId || "-"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Duration</dt>
                  <dd className="font-medium">{values.duration ? `${values.duration} min` : "-"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Classroom</dt>
                  <dd className="font-medium">{values.classroomId || "-"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Evaluation Type</dt>
                  <dd className="font-medium">{values.evaluationType || "-"}</dd>
                </div>
              </dl>
            </div>

            <div className="rounded-lg border p-4">
              <h4 className="font-medium mb-3 flex items-center">
                <Users className="mr-2 h-4 w-4" />
                Capacity & Credits
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Minimum Capacity</span>
                  <span className="font-medium">{values.minCapacity || "-"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Maximum Capacity</span>
                  <span className="font-medium">{values.maxCapacity || "-"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Credits</span>
                  <span className="font-medium">{values.credits || "-"}</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  // Render current step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderBasicInformation();
      case 2:
        return renderSchedule();
      case 3:
        return renderReview();
      default:
        return null;
    }
  };

  // Get step description
  const getStepDescription = () => {
    const descriptions = {
      1: "Enter class name, subject, and basic details",
      2: "Set up schedule, time, and location",
      3: "Review all information before submitting",
    };
    return descriptions[currentStep as keyof typeof descriptions] || "";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {mode === "view"
              ? "View Class"
              : mode === "edit"
              ? "Edit Class"
              : "Add New Class"}
          </DialogTitle>
          <DialogDescription>{getStepDescription()}</DialogDescription>
          {!isView && (
            <FormProgress currentStep={currentStep} totalSteps={totalSteps} className="mt-4" />
          )}
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-1">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="min-h-[350px]">{renderStepContent()}</div>
            </form>
          </Form>
        </div>

        <DialogFooter className="flex items-center justify-between border-t pt-4">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            {currentStep > 1 && !isView && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleBack}
                disabled={isPending}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Step {currentStep} of {totalSteps}
            </span>

            {!isView && (
              <>
                {currentStep < totalSteps ? (
                  <Button type="button" size="sm" onClick={handleNext} disabled={isPending}>
                    Next
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    onClick={form.handleSubmit(onSubmit)}
                    disabled={isPending}
                  >
                    {isPending ? (
                      <>
                        <Skeleton className="mr-2 h-4 w-4" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Class
                      </>
                    )}
                  </Button>
                )}
              </>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// Export Button Component for use in tables
// ============================================================================

export function AddClassButton({
  dictionary,
}: {
  dictionary?: Dictionary["school"]["classes"];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="h-8"
      >
        <Plus className="mr-2 h-4 w-4" />
        {dictionary?.addClass || "Add Class"}
      </Button>

      <ClassForm
        open={open}
        onOpenChange={setOpen}
        mode="create"
        dictionary={dictionary}
      />
    </>
  );
}
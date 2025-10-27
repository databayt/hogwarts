"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { createTemplate } from "./actions";
import { examTemplateSchema } from "./validation";
import { SuccessToast, ErrorToast } from "@/components/atom/toast";
import { useModal } from "@/components/atom/modal/context";
import type { ExamTemplateDTO } from "./types";
import { DistributionEditor } from "./distribution-editor";
import { calculateTotalQuestions } from "./utils";

interface ExamTemplateFormProps {
  initialData?: ExamTemplateDTO;
  subjectId?: string;
  isView?: boolean;
}

export function ExamTemplateForm({
  initialData,
  subjectId,
  isView = false,
}: ExamTemplateFormProps) {
  const { closeModal } = useModal();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    resolver: zodResolver(examTemplateSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      subjectId: initialData?.subjectId || subjectId || "",
      duration: initialData?.duration || 60,
      totalMarks: initialData?.totalMarks ? Number(initialData.totalMarks) : 100,
      distribution: (initialData?.distribution as any) || {},
      bloomDistribution: (initialData?.bloomDistribution as any) || undefined,
    },
  });

  const distribution = form.watch("distribution");
  const totalQuestions = calculateTotalQuestions(distribution);

  const onSubmit = async (values: any) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();

      // Append all fields
      Object.entries(values).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (typeof value === "object") {
            formData.append(key, JSON.stringify(value));
          } else {
            formData.append(key, value.toString());
          }
        }
      });

      if (initialData?.id) {
        formData.append("id", initialData.id);
      }

      const result = await createTemplate(formData);

      if (result.success) {
        SuccessToast(
          initialData?.id ? "Template updated!" : "Template created!"
        );
        closeModal();
        window.location.reload();
      } else {
        ErrorToast(result.error);
      }
    } catch (error) {
      ErrorToast(
        error instanceof Error ? error.message : "Failed to save template"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">
            {initialData?.id ? "Edit Template" : "Create Exam Template"}
          </h2>

          {/* Template Name */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Template Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., Midterm Template - Mathematics"
                    disabled={isView}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Description */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description (Optional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe this template..."
                    disabled={isView}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Subject */}
          <FormField
            control={form.control}
            name="subjectId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Subject</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isView}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {/* TODO: Fetch subjects from DB */}
                    <SelectItem value="subject-1">Mathematics</SelectItem>
                    <SelectItem value="subject-2">Science</SelectItem>
                    <SelectItem value="subject-3">English</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Duration & Total Marks */}
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duration (minutes)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="15"
                      max="480"
                      disabled={isView}
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="totalMarks"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total Marks</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      max="1000"
                      disabled={isView}
                      {...field}
                      onChange={(e) =>
                        field.onChange(parseFloat(e.target.value))
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Distribution Editor */}
          <FormField
            control={form.control}
            name="distribution"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Question Distribution</FormLabel>
                <FormControl>
                  <DistributionEditor
                    distribution={field.value}
                    onChange={field.onChange}
                    totalMarks={form.watch("totalMarks")}
                    disabled={isView}
                  />
                </FormControl>
                <FormDescription>
                  Total Questions: {totalQuestions}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Actions */}
        {!isView && (
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={closeModal}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {initialData?.id ? "Update" : "Create"}
            </Button>
          </div>
        )}
      </form>
    </Form>
  );
}

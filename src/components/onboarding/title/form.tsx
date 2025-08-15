"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { titleSchema, type TitleFormData } from "./validation";
import { updateSchoolTitle } from "./actions";
import { FORM_LIMITS } from "../constants.client";

interface TitleFormProps {
  schoolId: string;
  initialData?: Partial<TitleFormData>;
  onSuccess?: () => void;
}

export function TitleForm({ schoolId, initialData, onSuccess }: TitleFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>("");

  const form = useForm<TitleFormData>({
    resolver: zodResolver(titleSchema),
    defaultValues: {
      title: initialData?.title || "",
    },
  });

  const handleSubmit = (data: TitleFormData) => {
    startTransition(async () => {
      try {
        setError("");
        const result = await updateSchoolTitle(schoolId, data);
        
        if (result.success) {
          onSuccess?.();
        } else {
          setError(result.error || "Failed to update school name");
          if (result.errors) {
            Object.entries(result.errors).forEach(([field, message]) => {
              form.setError(field as keyof TitleFormData, { message });
            });
          }
        }
      } catch (err) {
        setError("An unexpected error occurred");
      }
    });
  };

  const titleValue = form.watch("title");
  const maxLength = FORM_LIMITS.TITLE_MAX_LENGTH;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {error && (
          <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
            {error}
          </div>
        )}
        
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="e.g., Al-Azhar International School"
                  className="w-full h-[80px] sm:h-[100px] p-4 sm:p-6 border border-input rounded-lg resize-none focus:outline-none focus:border-ring transition-colors text-sm sm:text-base"
                  maxLength={maxLength}
                  disabled={isPending}
                />
              </FormControl>
              <div className="flex justify-between items-center">
                <FormMessage />
                <div className="text-xs sm:text-sm text-muted-foreground">
                  {titleValue.length}/{maxLength}
                </div>
              </div>
            </FormItem>
          )}
        />

        <Button 
          type="submit" 
          disabled={isPending || !titleValue.trim()}
          className="w-full"
        >
          {isPending ? "Updating..." : "Update School Name"}
        </Button>
      </form>
    </Form>
  );
}
"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  GraduationCap, 
  BookOpen, 
  Library, 
  School, 
  Building2, 
  Landmark, 
  Wrench,
  Heart
} from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { descriptionSchema, type DescriptionFormData } from "./validation";
import { updateSchoolDescription } from "./actions";

interface DescriptionFormProps {
  schoolId: string;
  initialData?: Partial<DescriptionFormData>;
  onSuccess?: () => void;
  onTypeSelect?: (type: string) => void;
}

export function DescriptionForm({ schoolId, initialData, onSuccess, onTypeSelect }: DescriptionFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>("");

  const form = useForm<DescriptionFormData>({
    resolver: zodResolver(descriptionSchema),
    defaultValues: {
      schoolType: initialData?.schoolType || 'private',
    },
  });

  const handleSubmit = (data: DescriptionFormData) => {
    startTransition(async () => {
      try {
        setError("");
        const result = await updateSchoolDescription(schoolId, data);
        
        if (result.success) {
          onSuccess?.();
        } else {
          setError(result.error || "Failed to update school description");
          if (result.errors) {
            Object.entries(result.errors).forEach(([field, message]) => {
              form.setError(field as keyof DescriptionFormData, { message });
            });
          }
        }
      } catch (err) {
        setError("An unexpected error occurred");
      }
    });
  };

  const schoolTypes = [
    {
      id: 'private',
      title: 'Private',
      icon: Building2,
    },
    {
      id: 'public',
      title: 'Public',
      icon: School,
    },
    {
      id: 'international',
      title: 'International',
      icon: Landmark,
    },
    {
      id: 'technical',
      title: 'Technical',
      icon: Wrench,
    },
    {
      id: 'special',
      title: 'Special',
      icon: Heart,
    }
  ];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        {error && (
          <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
            {error}
          </div>
        )}
        
        {/* School Type Selection */}
        <FormField
          control={form.control}
          name="schoolType"
          render={({ field }) => (
            <FormItem>
              <div className="space-y-4">
                <FormControl>
                  <RadioGroup
                    onValueChange={(value) => {
                      field.onChange(value);
                      // Immediately notify parent component
                      onTypeSelect?.(value);
                      console.log("📝 School type selected:", value);
                      // Auto-submit the form when school type is selected
                      setTimeout(() => {
                        form.handleSubmit(handleSubmit)();
                      }, 100);
                    }}
                    value={field.value}
                    className="grid grid-cols-2 sm:grid-cols-3 gap-3"
                  >
                    {schoolTypes.map((type) => (
                      <div key={type.id}>
                        <RadioGroupItem value={type.id} id={type.id} className="sr-only" />
                        <label
                          htmlFor={type.id}
                          className={cn(
                            "flex flex-col items-center justify-center p-4 rounded-lg border transition-all text-center h-[120px] cursor-pointer hover:border-foreground/50",
                            field.value === type.id
                              ? "border-foreground bg-accent"
                              : "border-border"
                          )}
                        >
                          <type.icon size={24} className="mb-3" />
                          <div className="font-medium">{type.title}</div>
                        </label>
                      </div>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </div>
            </FormItem>
          )}
        />

        {isPending && (
          <div className="flex items-center justify-center mt-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Saving your selection...</span>
          </div>
        )}
      </form>
    </Form>
  );
}
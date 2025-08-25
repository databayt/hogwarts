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
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { descriptionSchema, type DescriptionFormData } from "./validation";
import { updateSchoolDescription } from "./actions";

interface DescriptionFormProps {
  schoolId: string;
  initialData?: Partial<DescriptionFormData>;
  onSuccess?: () => void;
}

export function DescriptionForm({ schoolId, initialData, onSuccess }: DescriptionFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>("");

  const form = useForm<DescriptionFormData>({
    resolver: zodResolver(descriptionSchema),
    defaultValues: {
      schoolLevel: initialData?.schoolLevel,
      schoolType: initialData?.schoolType,
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

  const levelOptions = [
    {
      id: 'primary',
      title: 'Primary School',
      description: 'Elementary education (typically ages 6-11)',
      icon: BookOpen,
    },
    {
      id: 'secondary',
      title: 'Secondary School', 
      description: 'Middle and high school education (typically ages 12-18)',
      icon: GraduationCap,
    },
    {
      id: 'both',
      title: 'Primary & Secondary',
      description: 'Complete K-12 education system',
      icon: Library,
    },
  ];

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
        
        {/* School Level Selection */}
        <FormField
          control={form.control}
          name="schoolLevel"
          render={({ field }) => (
            <FormItem>
              <div className="space-y-4">
                <h4 className="text-lg font-medium">What grade levels does your school teach?</h4>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    value={field.value}
                    className="space-y-3"
                  >
                    {levelOptions.map((level) => (
                      <div key={level.id} className="flex items-center space-x-3">
                        <RadioGroupItem value={level.id} id={level.id} />
                        <label
                          htmlFor={level.id}
                          className="flex-1 flex items-center gap-3 p-4 rounded-lg border cursor-pointer hover:bg-accent transition-colors"
                        >
                          <level.icon size={24} />
                          <div>
                            <div className="font-medium">{level.title}</div>
                            <div className="text-sm text-muted-foreground">{level.description}</div>
                          </div>
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

        {/* School Type Selection */}
        <FormField
          control={form.control}
          name="schoolType"
          render={({ field }) => (
            <FormItem>
              <div className="space-y-4">
                <h4 className="text-lg font-medium">What type of school are you setting up?</h4>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
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

        <Button 
          type="submit" 
          disabled={isPending || !form.formState.isValid}
          className="w-full"
        >
          {isPending ? "Updating..." : "Update School Description"}
        </Button>
      </form>
    </Form>
  );
}
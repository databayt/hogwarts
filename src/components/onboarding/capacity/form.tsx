"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { floorPlanSchema, type FloorPlanFormData } from "./validation";
import { updateSchoolCapacity } from "./actions";

interface CapacityFormProps {
  schoolId: string;
  initialData?: Partial<FloorPlanFormData>;
  onSuccess?: () => void;
}

export function CapacityForm({ schoolId, initialData, onSuccess }: CapacityFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>("");

  const form = useForm<FloorPlanFormData>({
    resolver: zodResolver(floorPlanSchema),
    defaultValues: {
      studentCount: initialData?.studentCount || 400,
      teachers: initialData?.teachers || 10,
      facilities: initialData?.facilities || 5,
    },
  });

  const handleSubmit = (data: FloorPlanFormData) => {
    startTransition(async () => {
      try {
        setError("");
        const result = await updateSchoolCapacity(schoolId, data);
        
        if (result.success) {
          onSuccess?.();
        } else {
          setError(result.error || "Failed to update capacity");
          if (result.errors) {
            Object.entries(result.errors).forEach(([field, message]) => {
              form.setError(field as keyof FloorPlanFormData, { message });
            });
          }
        }
      } catch (err) {
        setError("An unexpected error occurred");
      }
    });
  };

  const updateField = (field: keyof FloorPlanFormData, delta: number) => {
    const currentValue = form.getValues(field);
    const newValue = Math.max(0, currentValue + delta);
    form.setValue(field, newValue);
  };

  const formatNumber = (num: number): string => {
    return num.toString().padStart(4, '0');
  };

  const CounterRow = ({
    label,
    field,
    step = 1,
    minValue = 0,
  }: {
    label: string;
    field: keyof FloorPlanFormData;
    step?: number;
    minValue?: number;
  }) => {
    const value = form.watch(field);
    
    return (
      <div className="flex items-center justify-between py-4 sm:py-6 border-b border-border last:border-b-0">
        <div className="text-foreground text-sm sm:text-base font-medium">
          {label}
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => updateField(field, -step)}
            disabled={value <= minValue || isPending}
            className={cn(
              "w-10 h-10 sm:w-7 sm:h-7 rounded-full border flex items-center justify-center transition-colors min-h-[40px] sm:min-h-[28px]",
              value <= minValue && "cursor-not-allowed opacity-50"
            )}
          >
            <Minus size={16} strokeWidth={2} className="sm:w-3.5 sm:h-3.5" />
          </Button>
          <span className="w-16 text-center text-lg sm:text-base font-medium font-mono">
            {formatNumber(value)}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => updateField(field, step)}
            disabled={isPending}
            className="w-10 h-10 sm:w-7 sm:h-7 rounded-full border flex items-center justify-center transition-colors min-h-[40px] sm:min-h-[28px]"
          >
            <Plus size={16} strokeWidth={2} className="sm:w-3.5 sm:h-3.5" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {error && (
          <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
            {error}
          </div>
        )}
        
        <div className="bg-background">
          <CounterRow
            label="Students"
            field="studentCount"
            step={20}
            minValue={1}
          />
          <CounterRow
            label="Teachers"
            field="teachers"
            step={1}
            minValue={1}
          />
          <CounterRow
            label="Facilities"
            field="facilities"
            step={1}
            minValue={1}
          />
        </div>

        <Button 
          type="submit" 
          disabled={isPending}
          className="w-full"
        >
          {isPending ? "Updating..." : "Update Capacity"}
        </Button>
      </form>
    </Form>
  );
}
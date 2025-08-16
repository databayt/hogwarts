"use client";

import { type UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { assignmentCreateSchema } from "./validation";
import { FormControl, FormField, FormItem, FormMessage, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useState } from "react";

import { AssignmentFormStepProps } from "./types";

export function InformationStep({ form, isView }: AssignmentFormStepProps) {
  const [classes, setClasses] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    const loadClasses = async () => {
      try {
        // This would need to be implemented in separate actions
        // For now, we'll use placeholders
        setClasses([
          { id: "cls_001", name: "Transfiguration 101" },
          { id: "cls_002", name: "Potions 101" },
          { id: "cls_003", name: "Creatures 101" }
        ]);
      } catch (error) {
        console.error("Failed to load classes:", error);
      }
    };
    loadClasses();
  }, []);

  return (
    <div className="space-y-4 w-full">
      <FormField
        control={form.control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Assignment Title</FormLabel>
            <FormControl>
              <Input placeholder="Enter assignment title" disabled={isView} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl>
              <Textarea 
                placeholder="Enter assignment description..." 
                className="min-h-[100px]"
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
        name="classId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Class</FormLabel>
            <Select onValueChange={field.onChange} value={field.value} disabled={isView}>
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {classes.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

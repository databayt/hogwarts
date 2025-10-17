"use client";

import { type UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { lessonCreateSchema } from "./validation";
import { FormControl, FormField, FormItem, FormMessage, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useState } from "react";

import { LessonFormStepProps } from "./types";

export function BasicInformationStep({ form, isView }: LessonFormStepProps) {
  const [classes, setClasses] = useState<Array<{ id: string; name: string; teacher?: string; subject?: string }>>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        // This would need to be implemented in separate actions
        // For now, we'll use placeholders
        setClasses([
          { id: "cls_001", name: "Transfiguration 101", teacher: "Minerva McGonagall", subject: "Transfiguration" },
          { id: "cls_002", name: "Potions 101", teacher: "Severus Snape", subject: "Potions" },
          { id: "cls_003", name: "Creatures 101", teacher: "Rubeus Hagrid", subject: "Care of Magical Creatures" }
        ]);
      } catch (error) {
        console.error("Failed to load data:", error);
      }
    };
    loadData();
  }, []);

  return (
    <div className="space-y-4 w-full">
      <FormField
        control={form.control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Lesson Title</FormLabel>
            <FormControl>
              <Input placeholder="Enter lesson title" disabled={isView} {...field} />
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
                placeholder="Enter lesson description..." 
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
            <FormLabel>Class (Course Section)</FormLabel>
            <Select onValueChange={field.onChange} value={field.value} disabled={isView}>
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {classes.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{cls.name}</span>
                      {cls.teacher && cls.subject && (
                        <span className="text-xs text-muted-foreground">
                          {cls.subject} • {cls.teacher}
                        </span>
                      )}
                    </div>
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

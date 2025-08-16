"use client";

import { type UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { classCreateSchema } from "./validation";
import { FormControl, FormField, FormItem, FormMessage, FormLabel } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useState } from "react";

import { ClassFormStepProps } from "./types";

export function ScheduleStep({ form, isView }: ClassFormStepProps) {
  const [terms, setTerms] = useState<Array<{ id: string; termName: string }>>([]);
  const [periods, setPeriods] = useState<Array<{ id: string; periodName: string }>>([]);
  const [classrooms, setClassrooms] = useState<Array<{ id: string; roomName: string }>>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        // This would need to be implemented in separate actions
        // For now, we'll use placeholders
        setTerms([
          { id: "term_001", termName: "Fall 2024" },
          { id: "term_002", termName: "Spring 2025" },
          { id: "term_003", termName: "Summer 2025" }
        ]);
        setPeriods([
          { id: "per_001", periodName: "Period 1 (8:00-9:00)" },
          { id: "per_002", periodName: "Period 2 (9:00-10:00)" },
          { id: "per_003", periodName: "Period 3 (10:00-11:00)" },
          { id: "per_004", periodName: "Period 4 (11:00-12:00)" }
        ]);
        setClassrooms([
          { id: "cls_001", roomName: "Great Hall" },
          { id: "cls_002", roomName: "Dungeon" },
          { id: "cls_003", roomName: "Room 101" }
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
        name="termId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Term</FormLabel>
            <Select onValueChange={field.onChange} value={field.value} disabled={isView}>
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select term" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {terms.map((term) => (
                  <SelectItem key={term.id} value={term.id}>
                    {term.termName}
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
        name="startPeriodId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Start Period</FormLabel>
            <Select onValueChange={field.onChange} value={field.value} disabled={isView}>
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select start period" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {periods.map((period) => (
                  <SelectItem key={period.id} value={period.id}>
                    {period.periodName}
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
        name="endPeriodId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>End Period</FormLabel>
            <Select onValueChange={field.onChange} value={field.value} disabled={isView}>
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select end period" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {periods.map((period) => (
                  <SelectItem key={period.id} value={period.id}>
                    {period.periodName}
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
        name="classroomId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Classroom</FormLabel>
            <Select onValueChange={field.onChange} value={field.value} disabled={isView}>
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select classroom" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {classrooms.map((classroom) => (
                  <SelectItem key={classroom.id} value={classroom.id}>
                    {classroom.roomName}
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

"use client";

import { type UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { resultCreateSchema } from "./validation";
import { FormControl, FormField, FormItem, FormMessage, FormLabel } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useState } from "react";

import { ResultFormStepProps } from "./types";

export function StudentAssignmentStep({ form, isView, dictionary }: ResultFormStepProps) {
  const [students, setStudents] = useState<Array<{ id: string; givenName: string; surname: string }>>([]);
  const [assignments, setAssignments] = useState<Array<{ id: string; title: string; totalPoints: number }>>([]);
  const [classes, setClasses] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        // This would need to be implemented in separate actions
        // For now, we'll use placeholders
        setStudents([
          { id: "stu_001", givenName: "Harry", surname: "Potter" },
          { id: "stu_002", givenName: "Hermione", surname: "Granger" },
          { id: "stu_003", givenName: "Ron", surname: "Weasley" }
        ]);
        setAssignments([
          { id: "ass_001", title: "Transfiguration Quiz", totalPoints: 100 },
          { id: "ass_002", title: "Potions Essay", totalPoints: 50 },
          { id: "ass_003", title: "Creatures Test", totalPoints: 75 }
        ]);
        setClasses([
          { id: "cls_001", name: "Transfiguration 101" },
          { id: "cls_002", name: "Potions 101" },
          { id: "cls_003", name: "Creatures 101" }
        ]);
      } catch (error) {
        console.error("Failed to load data:", error);
      }
    };
    loadData();
  }, []);

  // Auto-populate maxScore when assignment changes
  const selectedAssignmentId = form.watch("assignmentId");
  const selectedAssignment = assignments.find(a => a.id === selectedAssignmentId);

  useEffect(() => {
    if (selectedAssignment && !isView) {
      form.setValue("maxScore", selectedAssignment.totalPoints);
    }
  }, [selectedAssignment, form, isView]);

  return (
    <div className="space-y-4 w-full">
      <FormField
        control={form.control}
        name="studentId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{dictionary.school.grades.student}</FormLabel>
            <Select onValueChange={field.onChange} value={field.value} disabled={isView}>
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={dictionary.school.grades.selectStudent} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {students.map((student) => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.givenName} {student.surname}
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
        name="assignmentId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{dictionary.school.grades.assignment}</FormLabel>
            <Select onValueChange={field.onChange} value={field.value} disabled={isView}>
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={dictionary.school.grades.selectAssignment} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {assignments.map((assignment) => (
                  <SelectItem key={assignment.id} value={assignment.id}>
                    {assignment.title} ({assignment.totalPoints} {dictionary.school.grades.points})
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
        name="classId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{dictionary.school.grades.class}</FormLabel>
            <Select onValueChange={field.onChange} value={field.value} disabled={isView}>
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={dictionary.school.grades.selectClass} />
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

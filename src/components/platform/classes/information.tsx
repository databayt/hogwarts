"use client";

import { type UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { classCreateSchema } from "./validation";
import { FormControl, FormField, FormItem, FormMessage, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useState } from "react";

import { ClassFormStepProps } from "./types";

export function InformationStep({ form, isView }: ClassFormStepProps) {
  const [subjects, setSubjects] = useState<Array<{ id: string; subjectName: string }>>([]);
  const [teachers, setTeachers] = useState<Array<{ id: string; givenName: string; surname: string }>>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        // This would need to be implemented in separate actions
        // For now, we'll use placeholders
        setSubjects([
          { id: "sub_001", subjectName: "Transfiguration" },
          { id: "sub_002", subjectName: "Potions" },
          { id: "sub_003", subjectName: "Creatures" }
        ]);
        setTeachers([
          { id: "tch_001", givenName: "Minerva", surname: "McGonagall" },
          { id: "tch_002", givenName: "Severus", surname: "Snape" },
          { id: "tch_003", givenName: "Rubeus", surname: "Hagrid" }
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
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Class Name</FormLabel>
            <FormControl>
              <Input placeholder="Enter class name" disabled={isView} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="subjectId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Subject</FormLabel>
            <Select onValueChange={field.onChange} value={field.value} disabled={isView}>
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {subjects.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {subject.subjectName}
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
        name="teacherId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Teacher</FormLabel>
            <Select onValueChange={field.onChange} value={field.value} disabled={isView}>
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select teacher" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {teachers.map((teacher) => (
                  <SelectItem key={teacher.id} value={teacher.id}>
                    {teacher.givenName} {teacher.surname}
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

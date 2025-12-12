"use client";

import { type UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { classCreateSchema } from "./validation";
import { FormControl, FormField, FormItem, FormMessage, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useState } from "react";
import { getSubjects } from "@/components/platform/subjects/actions";
import { getTeachers } from "@/components/platform/teachers/actions";

import { ClassFormStepProps } from "./types";

export function InformationStep({ form, isView }: ClassFormStepProps) {
  const [subjects, setSubjects] = useState<Array<{ id: string; subjectName: string }>>([]);
  const [teachers, setTeachers] = useState<Array<{ id: string; givenName: string; surname: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        // Load subjects from database
        const subjectsRes = await getSubjects({ perPage: 100 });
        if (subjectsRes.success && subjectsRes.data) {
          setSubjects(subjectsRes.data.rows.map((s: any) => ({
            id: s.id,
            subjectName: s.subjectName || s.name || 'Unknown'
          })));
        }

        // Load teachers from database
        const teachersRes = await getTeachers({ perPage: 100 });
        if (teachersRes.success && teachersRes.data) {
          setTeachers(teachersRes.data.rows.map((t: any) => ({
            id: t.id,
            givenName: t.givenName || '',
            surname: t.surname || ''
          })));
        }
      } catch (error) {
        console.error("Failed to load data:", error);
      } finally {
        setIsLoading(false);
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

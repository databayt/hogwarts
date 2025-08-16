"use client";

import { type UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { announcementCreateSchema } from "./validation";
import { FormControl, FormField, FormItem, FormMessage, FormLabel } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useEffect, useState } from "react";
import { getClassesForSelection } from "@/components/platform/attendance/actions";

import { AnnouncementFormStepProps } from "./types";
import { SCOPE_OPTIONS, ROLE_OPTIONS } from "./constants";

export function ScopeStep({ form, isView }: AnnouncementFormStepProps) {
  const [classes, setClasses] = useState<Array<{ id: string; name: string }>>([]);
  const scope = form.watch("scope");

  useEffect(() => {
    const loadClasses = async () => {
      try {
        const res = await getClassesForSelection();
        setClasses(res.classes || []);
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
        name="scope"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Scope</FormLabel>
            <Select onValueChange={field.onChange} value={field.value} disabled={isView}>
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select scope" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {SCOPE_OPTIONS.map((scope) => (
                  <SelectItem key={scope.value} value={scope.value}>
                    {scope.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {scope === "class" && (
        <FormField
          control={form.control}
          name="classId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Class</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || ""} disabled={isView}>
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
      )}

      {scope === "role" && (
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || ""} disabled={isView}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {ROLE_OPTIONS.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      <FormField
        control={form.control}
        name="published"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-base">Publish immediately</FormLabel>
              <div className="text-sm text-muted-foreground">
                Make this announcement visible to users right away
              </div>
            </div>
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
                disabled={isView}
              />
            </FormControl>
          </FormItem>
        )}
      />
    </div>
  );
}

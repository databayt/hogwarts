"use client";

import { type UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { announcementCreateSchema } from "./validation";
import { FormControl, FormField, FormItem, FormMessage, FormLabel } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useEffect, useState } from "react";
import { getClassesForSelection } from "@/components/platform/attendance/actions";
import type { Dictionary } from "@/components/internationalization/dictionaries";

import { AnnouncementFormStepProps } from "./types";

interface ScopeStepProps extends AnnouncementFormStepProps {
  dictionary: Dictionary['school']['announcements'];
}

export function ScopeStep({ form, isView, dictionary }: ScopeStepProps) {
  const [classes, setClasses] = useState<Array<{ id: string; name: string }>>([]);
  const scope = form.watch("scope");
  const t = dictionary;

  const scopeOptions = [
    { label: t.school, value: "school" },
    { label: t.class, value: "class" },
    { label: t.role, value: "role" }
  ];

  const roleOptions = [
    { label: t.roleAdmin, value: "ADMIN" },
    { label: t.roleTeacher, value: "TEACHER" },
    { label: t.roleStudent, value: "STUDENT" },
    { label: t.roleGuardian, value: "GUARDIAN" },
    { label: t.roleStaff, value: "STAFF" },
    { label: t.roleAccountant, value: "ACCOUNTANT" }
  ];

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
            <FormLabel>{t.scopeLabel}</FormLabel>
            <Select onValueChange={field.onChange} value={field.value} disabled={isView}>
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t.scopePlaceholder} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {scopeOptions.map((scope) => (
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
              <FormLabel>{t.classLabel}</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || ""} disabled={isView}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t.classPlaceholder} />
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
              <FormLabel>{t.roleLabel}</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || ""} disabled={isView}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t.rolePlaceholder} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {roleOptions.map((role) => (
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
              <FormLabel className="text-base">{t.publishImmediately}</FormLabel>
              <div className="text-sm text-muted-foreground">
                {t.publishImmediatelyDescription}
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

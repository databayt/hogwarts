"use client";

import { type UseFormReturn } from "react-hook-form";
import { FormControl, FormField, FormItem, FormMessage, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Dictionary } from "@/components/internationalization/dictionaries";

import { AnnouncementFormStepProps } from "./types";

interface InformationStepProps extends AnnouncementFormStepProps {
  dictionary: Dictionary['school']['announcements'];
}

export function InformationStep({ form, isView, dictionary }: InformationStepProps) {
  const t = dictionary;

  return (
    <div className="space-y-4 w-full">
      {/* English Title */}
      <FormField
        control={form.control}
        name="titleEn"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t.titleLabel} (English)</FormLabel>
            <FormControl>
              <Input
                placeholder="Enter title in English"
                disabled={isView}
                {...field}
                value={field.value ?? ""}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Arabic Title */}
      <FormField
        control={form.control}
        name="titleAr"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t.titleLabel} (العربية)</FormLabel>
            <FormControl>
              <Input
                placeholder="أدخل العنوان بالعربية"
                disabled={isView}
                dir="rtl"
                {...field}
                value={field.value ?? ""}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* English Body */}
      <FormField
        control={form.control}
        name="bodyEn"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t.contentLabel} (English)</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Enter content in English"
                className="min-h-[120px]"
                disabled={isView}
                {...field}
                value={field.value ?? ""}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Arabic Body */}
      <FormField
        control={form.control}
        name="bodyAr"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t.contentLabel} (العربية)</FormLabel>
            <FormControl>
              <Textarea
                placeholder="أدخل المحتوى بالعربية"
                className="min-h-[120px]"
                disabled={isView}
                dir="rtl"
                {...field}
                value={field.value ?? ""}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

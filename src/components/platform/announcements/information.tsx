"use client";

import { type UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { announcementCreateSchema } from "./validation";
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
      <FormField
        control={form.control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t.titleLabel}</FormLabel>
            <FormControl>
              <Input placeholder={t.titlePlaceholder} disabled={isView} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="body"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t.contentLabel}</FormLabel>
            <FormControl>
              <Textarea
                placeholder={t.contentPlaceholder}
                className="min-h-[120px]"
                disabled={isView}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

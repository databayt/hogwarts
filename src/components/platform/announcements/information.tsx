"use client";

import { type UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { announcementCreateSchema } from "./validation";
import { FormControl, FormField, FormItem, FormMessage, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Dictionary } from "@/components/internationalization/dictionaries";

import { AnnouncementFormStepProps } from "./types";

interface InformationStepProps extends AnnouncementFormStepProps {
  dictionary: Dictionary['school']['announcements'];
}

export function InformationStep({ form, isView, dictionary }: InformationStepProps) {
  const t = dictionary;

  return (
    <div className="space-y-4 w-full">
      {/* Language selector */}
      <FormField
        control={form.control}
        name="language"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t.language || "Language"}</FormLabel>
            <Select
              onValueChange={field.onChange}
              defaultValue={field.value}
              disabled={isView}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder={t.selectLanguage || "Select language"} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="ar">{t.arabic || "العربية"}</SelectItem>
                <SelectItem value="en">{t.english || "English"}</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

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

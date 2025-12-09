"use client";

import { type UseFormReturn } from "react-hook-form";
import { FormControl, FormField, FormItem, FormMessage, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Languages } from "lucide-react";
import type { Dictionary } from "@/components/internationalization/dictionaries";
import type { Locale } from "@/components/internationalization/config";
import type { AnnouncementFormValues } from "./validation";

interface InformationStepProps {
  form: UseFormReturn<AnnouncementFormValues>;
  isView: boolean;
  dictionary: Dictionary['school']['announcements'];
  lang: Locale;
}

export function InformationStep({ form, isView, dictionary, lang }: InformationStepProps) {
  const t = dictionary;
  const isRTL = lang === 'ar';

  // Determine which fields to show based on language
  const titleField = isRTL ? 'titleAr' : 'titleEn';
  const bodyField = isRTL ? 'bodyAr' : 'bodyEn';

  return (
    <div className="space-y-4 w-full">
      {/* Translation notice */}
      {!isView && (
        <Alert variant="default" className="bg-muted/50">
          <Languages className="h-4 w-4" />
          <AlertDescription className="text-sm">
            {isRTL
              ? 'اكتب بالعربية - سيتم ترجمة المحتوى للإنجليزية تلقائياً عند الحفظ'
              : 'Write in English - content will be auto-translated to Arabic on save'}
          </AlertDescription>
        </Alert>
      )}

      {/* Title field - single language */}
      <FormField
        control={form.control}
        name={titleField}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t.titleLabel}</FormLabel>
            <FormControl>
              <Input
                placeholder={isRTL ? "أدخل عنوان الإعلان" : "Enter announcement title"}
                disabled={isView}
                dir={isRTL ? "rtl" : "ltr"}
                {...field}
                value={field.value ?? ""}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Body field - single language */}
      <FormField
        control={form.control}
        name={bodyField}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t.contentLabel}</FormLabel>
            <FormControl>
              <Textarea
                placeholder={isRTL ? "أدخل محتوى الإعلان..." : "Enter announcement content..."}
                className="min-h-[160px]"
                disabled={isView}
                dir={isRTL ? "rtl" : "ltr"}
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

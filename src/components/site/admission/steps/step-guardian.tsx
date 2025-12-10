"use client";

import { useFormContext } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Dictionary } from "@/components/internationalization/dictionaries";
import type { Locale } from "@/components/internationalization/config";
import type { ApplicationFormData } from "../types";

interface Props {
  dictionary: Dictionary;
  lang: Locale;
}

export default function StepGuardian({ dictionary, lang }: Props) {
  const { control } = useFormContext<ApplicationFormData>();
  const isRTL = lang === "ar";

  return (
    <div className="space-y-6">
      {/* Father's Information */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">
            {isRTL ? "معلومات الأب" : "Father's Information"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={control}
              name="fatherName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {isRTL ? "اسم الأب" : "Father's Name"} <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={isRTL ? "أدخل اسم الأب" : "Enter father's name"} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="fatherOccupation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{isRTL ? "المهنة" : "Occupation"}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={isRTL ? "أدخل المهنة" : "Enter occupation"} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={control}
              name="fatherPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{isRTL ? "رقم الهاتف" : "Phone Number"}</FormLabel>
                  <FormControl>
                    <Input {...field} type="tel" placeholder="+249 123 456 789" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="fatherEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{isRTL ? "البريد الإلكتروني" : "Email"}</FormLabel>
                  <FormControl>
                    <Input {...field} type="email" placeholder="father@email.com" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </CardContent>
      </Card>

      {/* Mother's Information */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">
            {isRTL ? "معلومات الأم" : "Mother's Information"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={control}
              name="motherName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {isRTL ? "اسم الأم" : "Mother's Name"} <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={isRTL ? "أدخل اسم الأم" : "Enter mother's name"} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="motherOccupation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{isRTL ? "المهنة" : "Occupation"}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={isRTL ? "أدخل المهنة" : "Enter occupation"} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={control}
              name="motherPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{isRTL ? "رقم الهاتف" : "Phone Number"}</FormLabel>
                  <FormControl>
                    <Input {...field} type="tel" placeholder="+249 123 456 789" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="motherEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{isRTL ? "البريد الإلكتروني" : "Email"}</FormLabel>
                  <FormControl>
                    <Input {...field} type="email" placeholder="mother@email.com" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </CardContent>
      </Card>

      {/* Guardian Information (Optional) */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">
            {isRTL ? "معلومات ولي الأمر (اختياري)" : "Guardian Information (Optional)"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground mb-4">
            {isRTL
              ? "أكمل هذا القسم فقط إذا كان ولي الأمر مختلفًا عن الوالدين"
              : "Complete this section only if the guardian is different from parents"}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={control}
              name="guardianName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{isRTL ? "اسم ولي الأمر" : "Guardian Name"}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={isRTL ? "أدخل الاسم" : "Enter name"} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="guardianRelation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{isRTL ? "صلة القرابة" : "Relationship"}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={isRTL ? "مثل: عم، خال" : "e.g., Uncle, Aunt"} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={control}
              name="guardianPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{isRTL ? "رقم الهاتف" : "Phone Number"}</FormLabel>
                  <FormControl>
                    <Input {...field} type="tel" placeholder="+249 123 456 789" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="guardianEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{isRTL ? "البريد الإلكتروني" : "Email"}</FormLabel>
                  <FormControl>
                    <Input {...field} type="email" placeholder="guardian@email.com" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

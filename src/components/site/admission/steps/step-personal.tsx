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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Dictionary } from "@/components/internationalization/dictionaries";
import type { Locale } from "@/components/internationalization/config";
import type { ApplicationFormData } from "../types";

interface Props {
  dictionary: Dictionary;
  lang: Locale;
}

const NATIONALITIES = [
  { value: "Sudanese", labelEn: "Sudanese", labelAr: "سوداني" },
  { value: "Egyptian", labelEn: "Egyptian", labelAr: "مصري" },
  { value: "Saudi", labelEn: "Saudi", labelAr: "سعودي" },
  { value: "Emirati", labelEn: "Emirati", labelAr: "إماراتي" },
  { value: "Other", labelEn: "Other", labelAr: "أخرى" },
];

const GENDERS = [
  { value: "MALE", labelEn: "Male", labelAr: "ذكر" },
  { value: "FEMALE", labelEn: "Female", labelAr: "أنثى" },
];

export default function StepPersonal({ dictionary, lang }: Props) {
  const { control } = useFormContext<ApplicationFormData>();
  const isRTL = lang === "ar";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* First Name */}
        <FormField
          control={control}
          name="firstName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {isRTL ? "الاسم الأول" : "First Name"} <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder={isRTL ? "أدخل الاسم الأول" : "Enter first name"}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Middle Name */}
        <FormField
          control={control}
          name="middleName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{isRTL ? "الاسم الأوسط" : "Middle Name"}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder={isRTL ? "أدخل الاسم الأوسط" : "Enter middle name"}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Last Name */}
        <FormField
          control={control}
          name="lastName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {isRTL ? "اسم العائلة" : "Last Name"} <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder={isRTL ? "أدخل اسم العائلة" : "Enter last name"}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Date of Birth */}
        <FormField
          control={control}
          name="dateOfBirth"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {isRTL ? "تاريخ الميلاد" : "Date of Birth"} <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="date"
                  max={new Date().toISOString().split("T")[0]}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Gender */}
        <FormField
          control={control}
          name="gender"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {isRTL ? "الجنس" : "Gender"} <span className="text-destructive">*</span>
              </FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={isRTL ? "اختر الجنس" : "Select gender"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {GENDERS.map((gender) => (
                    <SelectItem key={gender.value} value={gender.value}>
                      {isRTL ? gender.labelAr : gender.labelEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Nationality */}
        <FormField
          control={control}
          name="nationality"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {isRTL ? "الجنسية" : "Nationality"} <span className="text-destructive">*</span>
              </FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={isRTL ? "اختر الجنسية" : "Select nationality"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {NATIONALITIES.map((nat) => (
                    <SelectItem key={nat.value} value={nat.value}>
                      {isRTL ? nat.labelAr : nat.labelEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Religion */}
        <FormField
          control={control}
          name="religion"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{isRTL ? "الديانة" : "Religion"}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder={isRTL ? "أدخل الديانة" : "Enter religion"}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Category (optional) */}
      <FormField
        control={control}
        name="category"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{isRTL ? "الفئة" : "Category"}</FormLabel>
            <FormControl>
              <Input
                {...field}
                placeholder={isRTL ? "مثل: عام، خاص" : "e.g., General, Special"}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

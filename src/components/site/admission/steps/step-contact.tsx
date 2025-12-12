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
import { Textarea } from "@/components/ui/textarea";
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

const COUNTRIES = [
  { value: "Sudan", labelEn: "Sudan", labelAr: "السودان" },
  { value: "Egypt", labelEn: "Egypt", labelAr: "مصر" },
  { value: "Saudi Arabia", labelEn: "Saudi Arabia", labelAr: "المملكة العربية السعودية" },
  { value: "UAE", labelEn: "UAE", labelAr: "الإمارات العربية المتحدة" },
  { value: "Other", labelEn: "Other", labelAr: "أخرى" },
];

export default function StepContact({ dictionary, lang }: Props) {
  const { control } = useFormContext<ApplicationFormData>();
  const isRTL = lang === "ar";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Email */}
        <FormField
          control={control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {isRTL ? "البريد الإلكتروني" : "Email"} <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="email"
                  placeholder={isRTL ? "example@email.com" : "example@email.com"}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Phone */}
        <FormField
          control={control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {isRTL ? "رقم الهاتف" : "Phone Number"} <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="tel"
                  placeholder={isRTL ? "+249 123 456 789" : "+249 123 456 789"}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Alternate Phone */}
      <FormField
        control={control}
        name="alternatePhone"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{isRTL ? "رقم هاتف بديل" : "Alternate Phone"}</FormLabel>
            <FormControl>
              <Input
                {...field}
                type="tel"
                placeholder={isRTL ? "+249 987 654 321" : "+249 987 654 321"}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Address */}
      <FormField
        control={control}
        name="address"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              {isRTL ? "العنوان" : "Address"} <span className="text-destructive">*</span>
            </FormLabel>
            <FormControl>
              <Textarea
                {...field}
                placeholder={isRTL ? "أدخل العنوان الكامل" : "Enter full address"}
                rows={2}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* City */}
        <FormField
          control={control}
          name="city"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {isRTL ? "المدينة" : "City"} <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder={isRTL ? "أدخل المدينة" : "Enter city"}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* State */}
        <FormField
          control={control}
          name="state"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {isRTL ? "الولاية" : "State/Province"} <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder={isRTL ? "أدخل الولاية" : "Enter state"}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Postal Code */}
        <FormField
          control={control}
          name="postalCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {isRTL ? "الرمز البريدي" : "Postal Code"} <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder={isRTL ? "12345" : "12345"}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Country */}
        <FormField
          control={control}
          name="country"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {isRTL ? "الدولة" : "Country"} <span className="text-destructive">*</span>
              </FormLabel>
              <Select onValueChange={field.onChange} value={field.value || "Sudan"}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={isRTL ? "اختر الدولة" : "Select country"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {COUNTRIES.map((country) => (
                    <SelectItem key={country.value} value={country.value}>
                      {isRTL ? country.labelAr : country.labelEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}

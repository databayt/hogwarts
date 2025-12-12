"use client";

import React, { forwardRef, useImperativeHandle, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLocale } from '@/components/internationalization/use-locale';
import { useApplication } from '../application-context';
import { guardianSchema, type GuardianSchemaType } from './validation';
import { saveGuardianStep } from './actions';
import { GUARDIAN_RELATION_OPTIONS } from './config';
import type { GuardianFormRef, GuardianFormProps } from './types';

export const GuardianForm = forwardRef<GuardianFormRef, GuardianFormProps>(
  ({ initialData, onSuccess, dictionary }, ref) => {
    const params = useParams();
    const subdomain = params.subdomain as string;
    const { locale: lang } = useLocale();
    const isRTL = lang === 'ar';
    const { session, updateStepData } = useApplication();

    const form = useForm<GuardianSchemaType>({
      resolver: zodResolver(guardianSchema),
      defaultValues: {
        fatherName: initialData?.fatherName || '',
        fatherOccupation: initialData?.fatherOccupation || '',
        fatherPhone: initialData?.fatherPhone || '',
        fatherEmail: initialData?.fatherEmail || '',
        motherName: initialData?.motherName || '',
        motherOccupation: initialData?.motherOccupation || '',
        motherPhone: initialData?.motherPhone || '',
        motherEmail: initialData?.motherEmail || '',
        guardianName: initialData?.guardianName || '',
        guardianRelation: initialData?.guardianRelation || '',
        guardianPhone: initialData?.guardianPhone || '',
        guardianEmail: initialData?.guardianEmail || ''
      }
    });

    const dict = ((dictionary as Record<string, Record<string, string>> | null)?.apply?.guardian ?? {}) as Record<string, string>;

    useEffect(() => {
      const subscription = form.watch((value) => {
        updateStepData('guardian', value as GuardianSchemaType);
      });
      return () => subscription.unsubscribe();
    }, [form, updateStepData]);

    const saveAndNext = async () => {
      const isValid = await form.trigger();
      if (!isValid) throw new Error('Form validation failed');

      const data = form.getValues();
      const result = await saveGuardianStep(data);

      if (!result.success) throw new Error(result.error || 'Failed to save');

      // Update context with validated data
      if (result.data) {
        updateStepData('guardian', result.data);
      }

      onSuccess?.();
    };

    useImperativeHandle(ref, () => ({ saveAndNext }));

    return (
      <Form {...form}>
        <form className="space-y-8">
          {/* Father's Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{dict.fatherInfo || (isRTL ? 'معلومات الأب' : "Father's Information")}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="fatherName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{dict.fatherName || (isRTL ? 'اسم الأب' : "Father's Name")} *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={dict.namePlaceholder || (isRTL ? 'أدخل الاسم' : 'Enter name')} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="fatherOccupation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{dict.occupation || (isRTL ? 'المهنة' : 'Occupation')}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={dict.occupationPlaceholder || (isRTL ? 'أدخل المهنة' : 'Enter occupation')} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="fatherPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{dict.phone || (isRTL ? 'رقم الهاتف' : 'Phone')}</FormLabel>
                    <FormControl>
                      <Input {...field} type="tel" placeholder="+249 XXX XXX XXXX" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="fatherEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{dict.email || (isRTL ? 'البريد الإلكتروني' : 'Email')}</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" placeholder="email@example.com" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Mother's Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{dict.motherInfo || (isRTL ? 'معلومات الأم' : "Mother's Information")}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="motherName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{dict.motherName || (isRTL ? 'اسم الأم' : "Mother's Name")} *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={dict.namePlaceholder || (isRTL ? 'أدخل الاسم' : 'Enter name')} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="motherOccupation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{dict.occupation || (isRTL ? 'المهنة' : 'Occupation')}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={dict.occupationPlaceholder || (isRTL ? 'أدخل المهنة' : 'Enter occupation')} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="motherPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{dict.phone || (isRTL ? 'رقم الهاتف' : 'Phone')}</FormLabel>
                    <FormControl>
                      <Input {...field} type="tel" placeholder="+249 XXX XXX XXXX" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="motherEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{dict.email || (isRTL ? 'البريد الإلكتروني' : 'Email')}</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" placeholder="email@example.com" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Other Guardian Information (Optional) */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{dict.guardianInfo || (isRTL ? 'ولي أمر آخر (اختياري)' : 'Other Guardian (Optional)')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="guardianName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{dict.guardianName || (isRTL ? 'اسم ولي الأمر' : "Guardian's Name")}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={dict.namePlaceholder || (isRTL ? 'أدخل الاسم' : 'Enter name')} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="guardianRelation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{dict.relation || (isRTL ? 'صلة القرابة' : 'Relation')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={dict.selectRelation || (isRTL ? 'اختر صلة القرابة' : 'Select relation')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {GUARDIAN_RELATION_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {isRTL ? option.labelAr : option.label}
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
                name="guardianPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{dict.phone || (isRTL ? 'رقم الهاتف' : 'Phone')}</FormLabel>
                    <FormControl>
                      <Input {...field} type="tel" placeholder="+249 XXX XXX XXXX" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="guardianEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{dict.email || (isRTL ? 'البريد الإلكتروني' : 'Email')}</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" placeholder="email@example.com" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </form>
      </Form>
    );
  }
);

GuardianForm.displayName = 'GuardianForm';

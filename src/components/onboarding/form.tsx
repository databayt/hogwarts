"use client";

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2 } from 'lucide-react';
import type { OnboardingSchoolData, OnboardingStep } from './type';
import { onboardingValidation, titleStepValidation, descriptionStepValidation, locationStepValidation, capacityStepValidation, priceStepValidation } from './validation';
import { SCHOOL_TYPES, SCHOOL_CATEGORIES, CURRENCIES, PAYMENT_SCHEDULES } from './constant';

interface OnboardingFormProps {
  step: OnboardingStep;
  data: Partial<OnboardingSchoolData>;
  onSubmit: (data: Partial<OnboardingSchoolData>) => Promise<void>;
  onBack?: () => void;
  isSubmitting?: boolean;
  showNavigation?: boolean;
}

export function OnboardingForm({ 
  step, 
  data, 
  onSubmit, 
  onBack, 
  isSubmitting = false,
  showNavigation = true 
}: OnboardingFormProps) {
  const getValidationSchema = () => {
    switch (step) {
      case 'title':
        return titleStepValidation;
      case 'description':
        return descriptionStepValidation;
      case 'location':
        return locationStepValidation;
      case 'capacity':
        return capacityStepValidation;
      case 'price':
        return priceStepValidation;
      default:
        return onboardingValidation.partial();
    }
  };

  const form = useForm({
    resolver: zodResolver(getValidationSchema()),
    defaultValues: data,
  });

  const handleSubmit = async (formData: any) => {
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 'title':
        return <TitleStepForm form={form} />;
      case 'description':
        return <DescriptionStepForm form={form} />;
      case 'location':
        return <LocationStepForm form={form} />;
      case 'capacity':
        return <CapacityStepForm form={form} />;
      case 'price':
        return <PriceStepForm form={form} />;
      default:
        return <div>Step content not implemented</div>;
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>
          {step === 'title' && 'School Name'}
          {step === 'description' && 'School Description'}
          {step === 'location' && 'School Location'}
          {step === 'capacity' && 'School Capacity'}
          {step === 'price' && 'Pricing Setup'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {renderStepContent()}
            
            {showNavigation && (
              <div className="flex justify-between pt-6">
                {onBack && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onBack}
                    disabled={isSubmitting}
                  >
                    Back
                  </Button>
                )}
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className={!onBack ? "w-full" : ""}
                >
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Continue
                </Button>
              </div>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

// Individual step form components
function TitleStepForm({ form }: { form: any }) {
  return (
    <FormField
      control={form.control}
      name="name"
      render={({ field }) => (
        <FormItem>
          <FormLabel>School Name *</FormLabel>
          <FormControl>
            <Input
              placeholder="Enter your school name"
              {...field}
              className="text-lg"
            />
          </FormControl>
          <FormDescription>
            This will be displayed as your school's main title
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function DescriptionStepForm({ form }: { form: any }) {
  return (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>School Description *</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Tell us about your school and what makes it special..."
                className="min-h-[120px]"
                {...field}
              />
            </FormControl>
            <FormDescription>
              Provide a brief overview of your school's mission and values
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="schoolLevel"
          render={({ field }) => (
            <FormItem>
              <FormLabel>School Level</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {SCHOOL_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div>
                        <div className="font-medium">{type.label}</div>
                        <div className="text-sm text-muted-foreground">{type.description}</div>
                      </div>
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
          name="schoolType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>School Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {SCHOOL_CATEGORIES.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      <div>
                        <div className="font-medium">{category.label}</div>
                        <div className="text-sm text-muted-foreground">{category.description}</div>
                      </div>
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

function LocationStepForm({ form }: { form: any }) {
  return (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="address"
        render={({ field }) => (
          <FormItem>
            <FormLabel>School Address *</FormLabel>
            <FormControl>
              <Input
                placeholder="Enter the full address of your school"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField
          control={form.control}
          name="city"
          render={({ field }) => (
            <FormItem>
              <FormLabel>City *</FormLabel>
              <FormControl>
                <Input placeholder="City" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="state"
          render={({ field }) => (
            <FormItem>
              <FormLabel>State/Province *</FormLabel>
              <FormControl>
                <Input placeholder="State" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="country"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Country</FormLabel>
              <FormControl>
                <Input placeholder="Country" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}

function CapacityStepForm({ form }: { form: any }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="maxStudents"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Maximum Students *</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="1"
                  max="10000"
                  placeholder="400"
                  {...field}
                  onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                />
              </FormControl>
              <FormDescription>
                Total enrollment capacity
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="maxTeachers"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Maximum Teachers *</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="1"
                  max="1000"
                  placeholder="25"
                  {...field}
                  onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                />
              </FormControl>
              <FormDescription>
                Total faculty capacity
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      
      <FormField
        control={form.control}
        name="maxClasses"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Maximum Classes</FormLabel>
            <FormControl>
              <Input
                type="number"
                min="1"
                max="500"
                placeholder="30"
                {...field}
                onChange={e => field.onChange(parseInt(e.target.value) || 0)}
              />
            </FormControl>
            <FormDescription>
              Total number of classes/sections
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

function PriceStepForm({ form }: { form: any }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="currency"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Currency *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {CURRENCIES.map((currency) => (
                    <SelectItem key={currency.value} value={currency.value}>
                      {currency.symbol} {currency.label}
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
          name="paymentSchedule"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Payment Schedule *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select schedule" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {PAYMENT_SCHEDULES.map((schedule) => (
                    <SelectItem key={schedule.value} value={schedule.value}>
                      <div>
                        <div className="font-medium">{schedule.label}</div>
                        <div className="text-sm text-muted-foreground">{schedule.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      
      <div className="space-y-4">
        <FormField
          control={form.control}
          name="tuitionFee"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tuition Fee *</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="15000"
                  {...field}
                  onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                />
              </FormControl>
              <FormDescription>
                Annual tuition fee amount
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="registrationFee"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Registration Fee</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="500"
                    {...field}
                    onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="applicationFee"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Application Fee</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="100"
                    {...field}
                    onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </div>
  );
}

export default OnboardingForm;
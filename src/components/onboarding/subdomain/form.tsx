"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { CheckCircle, AlertCircle, RefreshCw, Lightbulb } from 'lucide-react';
import { subdomainValidation } from './validation';
import { SUBDOMAIN_CONSTANTS, SUBDOMAIN_RULES, VALIDATION_MESSAGES } from "./config";
import { checkSubdomainAvailability, generateSubdomainSuggestions } from './action';
import { SubdomainCard } from './card';
import type { SubdomainFormData } from './types';

interface SubdomainFormProps {
  schoolId: string;
  schoolName?: string;
  initialData?: SubdomainFormData;
  onSubmit: (data: SubdomainFormData) => Promise<void>;
  onBack?: () => void;
  isSubmitting?: boolean;
}

export function SubdomainForm({
  schoolId,
  schoolName,
  initialData = { domain: '' },
  onSubmit,
  onBack,
  isSubmitting = false,
}: SubdomainFormProps) {
  const [isChecking, setIsChecking] = useState(false);
  const [availabilityStatus, setAvailabilityStatus] = useState<{
    available: boolean;
    message: string;
  } | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const form = useForm<SubdomainFormData>({
    resolver: zodResolver(subdomainValidation),
    defaultValues: initialData,
  });

  const currentDomain = form.watch('domain');

  // Debounced availability check
  const checkAvailability = useCallback(async (domain: string) => {
    if (!domain || domain.length < SUBDOMAIN_CONSTANTS.MIN_LENGTH) {
      setAvailabilityStatus(null);
      return;
    }

    setIsChecking(true);
    try {
      const response = await checkSubdomainAvailability(domain);
      if (response.success) {
        setAvailabilityStatus({
          available: response.data.available,
          message: response.data.message,
        });
      }
    } catch (error) {
      console.error('Failed to check availability:', error);
    } finally {
      setIsChecking(false);
    }
  }, []);

  // Load suggestions
  const loadSuggestions = useCallback(async () => {
    if (!schoolName) return;

    try {
      const response = await generateSubdomainSuggestions(schoolName);
      if (response.success) {
        setSuggestions(response.data.suggestions);
      }
    } catch (error) {
      console.error('Failed to load suggestions:', error);
    }
  }, [schoolName]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentDomain) {
        checkAvailability(currentDomain);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [currentDomain, checkAvailability]);

  useEffect(() => {
    loadSuggestions();
  }, [loadSuggestions]);

  const handleSuggestionClick = (suggestion: string) => {
    form.setValue('domain', suggestion);
  };

  const isFormValid = form.formState.isValid && availabilityStatus?.available;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Preview */}
          <SubdomainCard
            domain={currentDomain}
            isAvailable={availabilityStatus?.available}
            isChecking={isChecking}
          />

          {/* Domain Input */}
          <Card>
            <CardHeader>
              <CardTitle>Choose Your Subdomain</CardTitle>
              <CardDescription>
                This will be part of your school's web address
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="domain"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subdomain *</FormLabel>
                    <FormControl>
                      <div className="flex items-center">
                        <Input
                          placeholder="your-school-name"
                          {...field}
                          className="rounded-r-none"
                          onChange={(e) => {
                            const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                            field.onChange(value);
                          }}
                        />
                        <div className="px-3 py-2 bg-muted border border-l-0 rounded-r-md text-sm text-muted-foreground font-mono">
                          {SUBDOMAIN_CONSTANTS.DOMAIN_SUFFIX}
                        </div>
                      </div>
                    </FormControl>
                    <FormDescription>
                      3-30 characters, letters, numbers, and hyphens only
                    </FormDescription>
                    <FormMessage />

                    {/* Availability Status */}
                    {currentDomain && (
                      <div className="mt-2">
                        {isChecking ? (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            {VALIDATION_MESSAGES.CHECKING}
                          </div>
                        ) : availabilityStatus ? (
                          <div className={`flex items-center gap-2 text-sm ${
                            availabilityStatus.available ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {availabilityStatus.available ? (
                              <CheckCircle className="h-4 w-4" />
                            ) : (
                              <AlertCircle className="h-4 w-4" />
                            )}
                            {availabilityStatus.message}
                          </div>
                        ) : null}
                      </div>
                    )}
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  Suggestions
                </CardTitle>
                <CardDescription>
                  Based on your school name
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((suggestion) => (
                    <Button
                      key={suggestion}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="text-xs"
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Rules */}
          <Card>
            <CardHeader>
              <CardTitle>Subdomain Rules</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {SUBDOMAIN_RULES.map((rule, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                    {rule}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between">
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
              disabled={isSubmitting || !isFormValid}
              className={!onBack ? "w-full" : ""}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white me-2" />
                  Saving...
                </>
              ) : (
                'Continue'
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

export default SubdomainForm;
"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useHostValidation } from '@/components/onboarding/host-validation-context';
import { useListing } from '@/components/onboarding/use-listing';
import { useTitle } from './use-title';
import { TitleForm, type TitleFormRef } from './form';
import { TitleCard } from './card';
import { FORM_LIMITS } from '@/components/onboarding/constants.client';
import { generateSubdomain } from '@/lib/subdomain';
import { Badge } from '@/components/ui/badge';
import { Globe } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function TitleContent() {
  const params = useParams();
  const schoolId = params.id as string;
  const { enableNext, disableNext, setCustomNavigation } = useHostValidation();
  const titleFormRef = useRef<TitleFormRef>(null);
  const { listing } = useListing();
  const { data: titleData, loading } = useTitle(schoolId);
  const [generatedSubdomain, setGeneratedSubdomain] = useState<string>('');
  const [currentFormTitle, setCurrentFormTitle] = useState<string>('');

  const currentTitle = currentFormTitle || titleData?.title || listing?.name || '';

  const handleTitleChange = useCallback((title: string) => {
    setCurrentFormTitle(title);
  }, []);

  const onNext = useCallback(async () => {
    if (titleFormRef.current) {
      await titleFormRef.current.saveAndNext();
    }
  }, []);

  // Enable/disable next button based on title and set custom navigation
  useEffect(() => {
    const trimmedLength = currentTitle.trim().length;
    if (trimmedLength >= FORM_LIMITS.TITLE_MIN_LENGTH && trimmedLength <= FORM_LIMITS.TITLE_MAX_LENGTH) {
      enableNext();
      setCustomNavigation({
        onNext
      });
    } else {
      disableNext();
      setCustomNavigation(null);
    }
  }, [currentTitle, enableNext, disableNext, setCustomNavigation, onNext]);

  // Generate subdomain preview
  useEffect(() => {
    if (currentTitle.trim().length >= FORM_LIMITS.TITLE_MIN_LENGTH) {
      const subdomain = generateSubdomain(currentTitle);
      setGeneratedSubdomain(subdomain);
    } else {
      setGeneratedSubdomain('');
    }
  }, [currentTitle]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-20 items-start">
          {/* Left side - Text content skeleton */}
          <div className="space-y-6">
            <div className="space-y-4">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-96" />
            </div>
            
            {/* Form skeleton */}
            <div className="space-y-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-4 w-48" />
            </div>
            
            {/* Subdomain preview skeleton */}
            <div className="space-y-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-8 w-48" />
            </div>
          </div>
          
          {/* Right side - Card skeleton */}
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-20 items-start">
          {/* Left side - Text content and preview */}
          <div className="space-y-3 sm:space-y-4">
            <h3>
              What's your school's
              <br />
              name?
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground">
              This will be your school's official name in the system. You can change it later if needed.
            </p>
            
            {/* Subdomain preview */}
            {generatedSubdomain && (
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Globe className="w-4 h-4" />
                  <span>Your school will be available at:</span>
                </div>
                <div className="mt-2">
                  <Badge variant="secondary" className="font-mono text-sm">
                    {generatedSubdomain}.databayt.org
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  You can customize this subdomain in the next step
                </p>
              </div>
            )}

            {/* Title preview card */}
            {currentTitle && (
              <div className="mt-6">
                <TitleCard title={currentTitle} />
              </div>
            )}
          </div>

          {/* Right side - Form */}
          <div>
            <TitleForm
              ref={titleFormRef}
              schoolId={schoolId}
              initialData={{ title: currentTitle }}
              onTitleChange={handleTitleChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
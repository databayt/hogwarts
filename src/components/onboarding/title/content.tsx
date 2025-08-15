"use client";

import React, { useState, useEffect } from 'react';
import { useHostValidation } from '@/components/onboarding/host-validation-context';
import { useListing } from '@/components/onboarding/use-listing';
import { FORM_LIMITS } from '@/components/onboarding/constants.client';

export default function TitleContent() {
  const { enableNext, disableNext } = useHostValidation();
  const { listing, updateListingData } = useListing();
  const [schoolName, setSchoolName] = useState<string>('');

  const maxLength = FORM_LIMITS.TITLE_MAX_LENGTH;

  // Load existing title from listing
  useEffect(() => {
    if (listing?.title) {
      setSchoolName(listing.title);
    }
  }, [listing]);

  // Enable/disable next button based on title length
  useEffect(() => {
    const trimmedLength = schoolName.trim().length;
    if (trimmedLength >= FORM_LIMITS.TITLE_MIN_LENGTH && trimmedLength <= FORM_LIMITS.TITLE_MAX_LENGTH) {
      enableNext();
    } else {
      disableNext();
    }
  }, [schoolName, enableNext, disableNext]);

  const handleSchoolNameChange = async (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newName = event.target.value;
    if (newName.length <= maxLength) {
      setSchoolName(newName);
      
      // Update backend data with debouncing
      try {
        await updateListingData({
          title: newName
        });
      } catch (error) {
        console.error('Error updating school name:', error);
      }
    }
  };

  return (
    <div className="">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-20 items-start">
          {/* Left side - Text content */}
          <div className="space-y-3 sm:space-y-4">
            <h3>
              What's your school's
              <br />
              name?
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground">
              This will be your school's official name in the system. You can change it later if needed.
            </p>
          </div>

          {/* Right side - Input box */}
          <div>
            <textarea
              value={schoolName}
              onChange={handleSchoolNameChange}
              placeholder="e.g., Al-Azhar International School"
              className="w-full h-[80px] sm:h-[100px] p-4 sm:p-6 border border-input rounded-lg resize-none focus:outline-none focus:border-ring transition-colors text-sm sm:text-base"
              maxLength={maxLength}
            />
            <div className="mt-2 text-xs sm:text-sm text-muted-foreground">
              {schoolName.length}/{maxLength}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
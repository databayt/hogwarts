"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

interface AboutSchoolFormProps {
  onContinue?: () => void;
  isLoading?: boolean;
}

export function AboutSchoolForm({ 
  onContinue,
  isLoading = false
}: AboutSchoolFormProps) {
  return (
    <div className="flex justify-center pt-4">
      <Button 
        onClick={onContinue}
        disabled={isLoading}
        size="lg"
        className="min-w-[200px]"
      >
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
            Starting...
          </>
        ) : (
          <>
            Start Setup
            <ArrowRight className="ml-2 h-4 w-4" />
          </>
        )}
      </Button>
    </div>
  );
}

export default AboutSchoolForm;
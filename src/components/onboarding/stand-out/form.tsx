"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

interface StandOutFormProps {
  onContinue?: () => void;
  isLoading?: boolean;
}

export function StandOutForm({ 
  onContinue,
  isLoading = false
}: StandOutFormProps) {
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
            Continuing...
          </>
        ) : (
          <>
            Continue to School Setup
            <ArrowRight className="ml-2 h-4 w-4" />
          </>
        )}
      </Button>
    </div>
  );
}

export default StandOutForm;
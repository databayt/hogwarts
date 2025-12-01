"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';

interface FinishSetupFormProps {
  onContinue?: () => void;
  isLoading?: boolean;
}

export function FinishSetupForm({ 
  onContinue,
  isLoading = false
}: FinishSetupFormProps) {
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
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white me-2" />
            Finishing...
          </>
        ) : (
          <>
            Complete Setup
            <CheckCircle className="ms-2 h-4 w-4" />
          </>
        )}
      </Button>
    </div>
  );
}

export default FinishSetupForm;
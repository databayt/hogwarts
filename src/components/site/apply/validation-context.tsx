"use client";

import React, { createContext, useContext, useState, ReactNode, useMemo, useCallback } from 'react';

interface ApplyValidationContextType {
  isNextDisabled: boolean;
  setIsNextDisabled: (disabled: boolean) => void;
  enableNext: () => void;
  disableNext: () => void;
  customNavigation?: {
    onBack?: () => void;
    onNext?: () => void;
    nextDisabled?: boolean;
  };
  setCustomNavigation: (navigation?: {
    onBack?: () => void;
    onNext?: () => void;
    nextDisabled?: boolean;
  }) => void;
}

const ApplyValidationContext = createContext<ApplyValidationContextType | undefined>(undefined);

export const useApplyValidation = () => {
  const context = useContext(ApplyValidationContext);
  if (!context) {
    throw new Error('useApplyValidation must be used within an ApplyValidationProvider');
  }
  return context;
};

interface ApplyValidationProviderProps {
  children: ReactNode;
}

export const ApplyValidationProvider: React.FC<ApplyValidationProviderProps> = ({ children }) => {
  // Default to disabled state so pages must explicitly enable the next button
  const [isNextDisabled, setIsNextDisabled] = useState(true);
  const [customNavigation, setCustomNavigation] = useState<{
    onBack?: () => void;
    onNext?: () => void;
    nextDisabled?: boolean;
  } | undefined>(undefined);

  const enableNext = useCallback(() => {
    setIsNextDisabled(false);
  }, []);

  const disableNext = useCallback(() => {
    setIsNextDisabled(true);
  }, []);

  const value: ApplyValidationContextType = useMemo(() => ({
    isNextDisabled,
    setIsNextDisabled,
    enableNext,
    disableNext,
    customNavigation,
    setCustomNavigation
  }), [isNextDisabled, enableNext, disableNext, customNavigation, setCustomNavigation]);

  return (
    <ApplyValidationContext.Provider value={value}>
      {children}
    </ApplyValidationContext.Provider>
  );
};

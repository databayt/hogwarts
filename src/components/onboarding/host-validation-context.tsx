"use client";

import React, { createContext, useContext, useState, ReactNode, useMemo, useCallback } from 'react';

interface HostValidationContextType {
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

const HostValidationContext = createContext<HostValidationContextType | undefined>(undefined);

export const useHostValidation = () => {
  const context = useContext(HostValidationContext);
  if (!context) {
    throw new Error('useHostValidation must be used within a HostValidationProvider');
  }
  return context;
};

interface HostValidationProviderProps {
  children: ReactNode;
}

export const HostValidationProvider: React.FC<HostValidationProviderProps> = ({ children }) => {
  // Default to disabled state so pages must explicitly enable the next button
  const [isNextDisabled, setIsNextDisabled] = useState(true);
  const [customNavigation, setCustomNavigation] = useState<{
    onBack?: () => void;
    onNext?: () => void;
    nextDisabled?: boolean;
  } | undefined>(undefined);
  
  console.log("🔄 [HOST VALIDATION PROVIDER] Current state:", {
    isNextDisabled,
    hasCustomNavigation: !!customNavigation
  });

  const enableNext = useCallback(() => {
    console.log("✅ [HOST VALIDATION] enableNext called");
    setIsNextDisabled(false);
  }, []);
  
  const disableNext = useCallback(() => {
    console.log("⛔ [HOST VALIDATION] disableNext called");
    setIsNextDisabled(true);
  }, []);

  const value: HostValidationContextType = useMemo(() => ({
    isNextDisabled,
    setIsNextDisabled,
    enableNext,
    disableNext,
    customNavigation,
    setCustomNavigation
  }), [isNextDisabled, enableNext, disableNext, customNavigation, setCustomNavigation]);

  return (
    <HostValidationContext.Provider value={value}>
      {children}
    </HostValidationContext.Provider>
  );
}; 
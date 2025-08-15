"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

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
  const [isNextDisabled, setIsNextDisabled] = useState(false);
  const [customNavigation, setCustomNavigation] = useState<{
    onBack?: () => void;
    onNext?: () => void;
    nextDisabled?: boolean;
  } | undefined>(undefined);

  const enableNext = () => setIsNextDisabled(false);
  const disableNext = () => setIsNextDisabled(true);

  const value: HostValidationContextType = {
    isNextDisabled,
    setIsNextDisabled,
    enableNext,
    disableNext,
    customNavigation,
    setCustomNavigation
  };

  return (
    <HostValidationContext.Provider value={value}>
      {children}
    </HostValidationContext.Provider>
  );
}; 
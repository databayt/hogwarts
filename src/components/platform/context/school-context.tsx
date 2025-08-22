"use client";

import React, { createContext, useContext, ReactNode } from "react";
import type { School } from "@/components/site/types";

interface SchoolContextValue {
  school: School;
}

const SchoolContext = createContext<SchoolContextValue | undefined>(undefined);

interface SchoolProviderProps {
  children: ReactNode;
  school: School;
}

export function SchoolProvider({ children, school }: SchoolProviderProps) {
  const value: SchoolContextValue = {
    school,
  };

  return (
    <SchoolContext.Provider value={value}>
      {children}
    </SchoolContext.Provider>
  );
}

export function useSchool() {
  const context = useContext(SchoolContext);
  if (context === undefined) {
    throw new Error("useSchool must be used within a SchoolProvider");
  }
  return context;
}

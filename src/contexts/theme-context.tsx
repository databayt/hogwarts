"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface ThemeContextValue {
  currentTheme: string;
  setCurrentTheme: (theme: string) => void;
  previewDarkMode: boolean;
  setPreviewDarkMode: (darkMode: boolean) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [currentTheme, setCurrentTheme] = useState("default");
  const [previewDarkMode, setPreviewDarkMode] = useState(false);

  return (
    <ThemeContext.Provider
      value={{
        currentTheme,
        setCurrentTheme,
        previewDarkMode,
        setPreviewDarkMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    // Return default values if not within provider
    return {
      currentTheme: "default",
      setCurrentTheme: () => {},
      previewDarkMode: false,
      setPreviewDarkMode: () => {},
    };
  }
  return context;
}

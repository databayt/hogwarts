/**
 * Theme Editor Types
 *
 * Type definitions for the visual theme editor state management.
 */

// Flat theme style properties (matching tweakcn pattern)
export interface ThemeStyleProps {
  // Core colors
  background: string
  foreground: string

  // Card colors
  card: string
  "card-foreground": string

  // Popover colors
  popover: string
  "popover-foreground": string

  // Primary colors
  primary: string
  "primary-foreground": string

  // Secondary colors
  secondary: string
  "secondary-foreground": string

  // Muted colors
  muted: string
  "muted-foreground": string

  // Accent colors
  accent: string
  "accent-foreground": string

  // Destructive colors
  destructive: string
  "destructive-foreground": string

  // UI elements
  border: string
  input: string
  ring: string

  // Chart colors
  "chart-1": string
  "chart-2": string
  "chart-3": string
  "chart-4": string
  "chart-5": string

  // Sidebar colors
  sidebar: string
  "sidebar-foreground": string
  "sidebar-primary": string
  "sidebar-primary-foreground": string
  "sidebar-accent": string
  "sidebar-accent-foreground": string
  "sidebar-border": string
  "sidebar-ring": string

  // Fonts
  "font-sans": string
  "font-serif": string
  "font-mono": string

  // Shadow properties
  "shadow-color": string
  "shadow-opacity": string
  "shadow-blur": string
  "shadow-spread": string
  "shadow-offset-x": string
  "shadow-offset-y": string

  // Other
  radius: string
  "letter-spacing": string
  spacing?: string
}

// Theme styles structure
export interface ThemeStyles {
  light: Partial<ThemeStyleProps>
  dark: Partial<ThemeStyleProps>
}

// HSL adjustment settings
export interface HslAdjustments {
  hueShift: number
  saturationScale: number
  lightnessScale: number
}

// Complete theme editor state
export interface ThemeEditorState {
  styles: ThemeStyles
  currentMode: "light" | "dark"
  preset?: string
  hslAdjustments: HslAdjustments
}

// Theme preset structure
export interface ThemePreset {
  source?: "SAVED" | "BUILT_IN"
  createdAt?: string
  label?: string
  styles: ThemeStyles
}

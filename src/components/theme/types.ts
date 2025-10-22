/**
 * Theme System Types
 *
 * Defines TypeScript interfaces for the per-user theme customization system.
 * All color values use OKLCH format for perceptual uniformity.
 */

// OKLCH color format: oklch(lightness chroma hue / alpha)
export type OklchColor = string

export interface ThemeColors {
  // Core colors
  background: OklchColor
  foreground: OklchColor

  // Card colors
  card: OklchColor
  cardForeground: OklchColor

  // Popover colors
  popover: OklchColor
  popoverForeground: OklchColor

  // Primary colors
  primary: OklchColor
  primaryForeground: OklchColor

  // Secondary colors
  secondary: OklchColor
  secondaryForeground: OklchColor

  // Muted colors
  muted: OklchColor
  mutedForeground: OklchColor

  // Accent colors
  accent: OklchColor
  accentForeground: OklchColor

  // Destructive colors
  destructive: OklchColor
  destructiveForeground?: OklchColor

  // Border and input
  border: OklchColor
  input: OklchColor
  ring: OklchColor

  // Chart colors
  chart1: OklchColor
  chart2: OklchColor
  chart3: OklchColor
  chart4: OklchColor
  chart5: OklchColor

  // Sidebar colors
  sidebar: OklchColor
  sidebarForeground: OklchColor
  sidebarPrimary: OklchColor
  sidebarPrimaryForeground: OklchColor
  sidebarAccent: OklchColor
  sidebarAccentForeground: OklchColor
  sidebarBorder: OklchColor
  sidebarRing: OklchColor
}

export interface ThemeRadius {
  sm: string  // e.g., "calc(var(--radius) - 4px)"
  md: string  // e.g., "calc(var(--radius) - 2px)"
  lg: string  // e.g., "var(--radius)"
  xl: string  // e.g., "calc(var(--radius) + 4px)"
  base: string // The base radius value (e.g., "0.625rem")
}

export interface ThemeFonts {
  sans: string  // e.g., "var(--font-geist-sans)"
  mono: string  // e.g., "var(--font-geist-mono)"
}

// Complete theme configuration
export interface ThemeConfig {
  // Theme metadata
  name: string
  description?: string

  // Light mode colors
  light: ThemeColors

  // Dark mode colors
  dark: ThemeColors

  // Border radius configuration
  radius: ThemeRadius

  // Font configuration
  fonts?: ThemeFonts

  // Custom CSS (optional)
  customCss?: string
}

// Preset theme structure
export interface ThemePreset {
  id: string
  name: string
  description: string
  thumbnail?: string  // Preview image URL
  config: ThemeConfig
  tags?: string[]     // e.g., ["dark", "minimal", "colorful"]
}

// User theme database model type
export interface UserThemeData {
  id: string
  userId: string
  name: string
  isActive: boolean
  isPreset: boolean
  themeConfig: ThemeConfig
  createdAt: Date
  updatedAt: Date
}

// Theme builder state
export interface ThemeBuilderState {
  activeTab: 'colors' | 'typography' | 'spacing' | 'advanced'
  mode: 'light' | 'dark'
  previewMode: 'component' | 'page'
}

// CSS variable mapping
export type CSSVariableMap = Record<string, string>

// Theme export format
export interface ThemeExport {
  version: '1.0'
  name: string
  description?: string
  author?: string
  createdAt: string
  config: ThemeConfig
}

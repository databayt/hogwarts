/**
 * Theme Configuration and Defaults
 *
 * Default theme configuration matching the current globals.css values.
 * All colors use OKLCH format for perceptual uniformity.
 */

import type { ThemeConfig, ThemeColors, ThemeRadius, ThemeFonts } from './types'

// Default light mode colors (from globals.css :root)
export const defaultLightColors: ThemeColors = {
  background: 'oklch(1 0 0)',
  foreground: 'oklch(0.145 0 0)',
  card: 'oklch(1 0 0)',
  cardForeground: 'oklch(0.145 0 0)',
  popover: 'oklch(1 0 0)',
  popoverForeground: 'oklch(0.145 0 0)',
  primary: 'oklch(0.205 0 0)',
  primaryForeground: 'oklch(0.985 0 0)',
  secondary: 'oklch(0.97 0 0)',
  secondaryForeground: 'oklch(0.205 0 0)',
  muted: 'oklch(0.97 0 0)',
  mutedForeground: 'oklch(0.556 0 0)',
  accent: 'oklch(0.97 0 0)',
  accentForeground: 'oklch(0.205 0 0)',
  destructive: 'oklch(0.577 0.245 27.325)',
  border: 'oklch(0.922 0 0)',
  input: 'oklch(0.922 0 0)',
  ring: 'oklch(0.708 0 0)',
  chart1: 'oklch(0.646 0.222 41.116)',
  chart2: 'oklch(0.6 0.118 184.704)',
  chart3: 'oklch(0.398 0.07 227.392)',
  chart4: 'oklch(0.828 0.189 84.429)',
  chart5: 'oklch(0.769 0.188 70.08)',
  sidebar: 'oklch(0.985 0 0)',
  sidebarForeground: 'oklch(0.145 0 0)',
  sidebarPrimary: 'oklch(0.205 0 0)',
  sidebarPrimaryForeground: 'oklch(0.985 0 0)',
  sidebarAccent: 'oklch(0.97 0 0)',
  sidebarAccentForeground: 'oklch(0.205 0 0)',
  sidebarBorder: 'oklch(0.922 0 0)',
  sidebarRing: 'oklch(0.708 0 0)',
}

// Default dark mode colors (from globals.css .dark)
export const defaultDarkColors: ThemeColors = {
  background: 'oklch(0.145 0 0)',
  foreground: 'oklch(0.985 0 0)',
  card: 'oklch(0.205 0 0)',
  cardForeground: 'oklch(0.985 0 0)',
  popover: 'oklch(0.205 0 0)',
  popoverForeground: 'oklch(0.985 0 0)',
  primary: 'oklch(0.922 0 0)',
  primaryForeground: 'oklch(0.205 0 0)',
  secondary: 'oklch(0.269 0 0)',
  secondaryForeground: 'oklch(0.985 0 0)',
  muted: 'oklch(0.269 0 0)',
  mutedForeground: 'oklch(0.708 0 0)',
  accent: 'oklch(0.269 0 0)',
  accentForeground: 'oklch(0.985 0 0)',
  destructive: 'oklch(0.704 0.191 22.216)',
  border: 'oklch(1 0 0 / 10%)',
  input: 'oklch(1 0 0 / 15%)',
  ring: 'oklch(0.556 0 0)',
  chart1: 'oklch(0.488 0.243 264.376)',
  chart2: 'oklch(0.696 0.17 162.48)',
  chart3: 'oklch(0.769 0.188 70.08)',
  chart4: 'oklch(0.627 0.265 303.9)',
  chart5: 'oklch(0.645 0.246 16.439)',
  sidebar: 'oklch(0.205 0 0)',
  sidebarForeground: 'oklch(0.985 0 0)',
  sidebarPrimary: 'oklch(0.488 0.243 264.376)',
  sidebarPrimaryForeground: 'oklch(0.985 0 0)',
  sidebarAccent: 'oklch(0.269 0 0)',
  sidebarAccentForeground: 'oklch(0.985 0 0)',
  sidebarBorder: 'oklch(1 0 0 / 10%)',
  sidebarRing: 'oklch(0.556 0 0)',
}

// Default radius configuration
export const defaultRadius: ThemeRadius = {
  base: '0.625rem',
  sm: 'calc(var(--radius) - 4px)',
  md: 'calc(var(--radius) - 2px)',
  lg: 'var(--radius)',
  xl: 'calc(var(--radius) + 4px)',
}

// Default fonts
export const defaultFonts: ThemeFonts = {
  sans: 'var(--font-geist-sans)',
  mono: 'var(--font-geist-mono)',
}

// Default complete theme configuration
export const defaultThemeConfig: ThemeConfig = {
  name: 'Default',
  description: 'The default Hogwarts platform theme',
  light: defaultLightColors,
  dark: defaultDarkColors,
  radius: defaultRadius,
  fonts: defaultFonts,
}

// Border radius options for customization
export const radiusOptions = [
  { label: 'None', value: '0' },
  { label: 'Small', value: '0.3rem' },
  { label: 'Medium', value: '0.5rem' },
  { label: 'Default', value: '0.625rem' },
  { label: 'Large', value: '0.75rem' },
  { label: 'Extra Large', value: '1rem' },
  { label: 'Full', value: '9999px' },
] as const

// Shadow options (future enhancement)
export const shadowOptions = [
  { label: 'None', value: 'none' },
  { label: 'Small', value: 'sm' },
  { label: 'Medium', value: 'md' },
  { label: 'Large', value: 'lg' },
  { label: 'Extra Large', value: 'xl' },
] as const

// Color palette categories for the builder
export const colorCategories = [
  {
    id: 'core',
    label: 'Core Colors',
    description: 'Primary background and text colors',
    colors: ['background', 'foreground'] as const,
  },
  {
    id: 'primary',
    label: 'Primary Colors',
    description: 'Main brand colors for buttons and accents',
    colors: ['primary', 'primaryForeground'] as const,
  },
  {
    id: 'secondary',
    label: 'Secondary Colors',
    description: 'Alternative button and accent colors',
    colors: ['secondary', 'secondaryForeground'] as const,
  },
  {
    id: 'muted',
    label: 'Muted Colors',
    description: 'Subtle backgrounds and secondary text',
    colors: ['muted', 'mutedForeground'] as const,
  },
  {
    id: 'accent',
    label: 'Accent Colors',
    description: 'Highlight colors for special elements',
    colors: ['accent', 'accentForeground'] as const,
  },
  {
    id: 'destructive',
    label: 'Destructive Colors',
    description: 'Error and warning colors',
    colors: ['destructive'] as const,
  },
  {
    id: 'ui',
    label: 'UI Elements',
    description: 'Borders, inputs, and focus rings',
    colors: ['border', 'input', 'ring'] as const,
  },
  {
    id: 'charts',
    label: 'Chart Colors',
    description: 'Data visualization colors',
    colors: ['chart1', 'chart2', 'chart3', 'chart4', 'chart5'] as const,
  },
  {
    id: 'sidebar',
    label: 'Sidebar Colors',
    description: 'Navigation sidebar colors',
    colors: [
      'sidebar',
      'sidebarForeground',
      'sidebarPrimary',
      'sidebarPrimaryForeground',
      'sidebarAccent',
      'sidebarAccentForeground',
      'sidebarBorder',
      'sidebarRing',
    ] as const,
  },
] as const

// Helper to get CSS variable name from theme color key
export function getCSSVariableName(key: string): string {
  // Convert camelCase to kebab-case
  const kebabCase = key.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()

  // Special cases
  const mapping: Record<string, string> = {
    'card-foreground': 'card-foreground',
    'popover-foreground': 'popover-foreground',
    'primary-foreground': 'primary-foreground',
    'secondary-foreground': 'secondary-foreground',
    'muted-foreground': 'muted-foreground',
    'accent-foreground': 'accent-foreground',
    'destructive-foreground': 'destructive-foreground',
    'sidebar-foreground': 'sidebar-foreground',
    'sidebar-primary': 'sidebar-primary',
    'sidebar-primary-foreground': 'sidebar-primary-foreground',
    'sidebar-accent': 'sidebar-accent',
    'sidebar-accent-foreground': 'sidebar-accent-foreground',
    'sidebar-border': 'sidebar-border',
    'sidebar-ring': 'sidebar-ring',
  }

  return mapping[kebabCase] || kebabCase
}

// Helper to format OKLCH color for display
export function formatOklchForDisplay(oklch: string): string {
  // Extract values from oklch(L C H / A) format
  const match = oklch.match(/oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d%]+))?\)/)
  if (!match) return oklch

  const [, l, c, h, a] = match
  if (a) {
    return `oklch(${l} ${c} ${h} / ${a})`
  }
  return `oklch(${l} ${c} ${h})`
}

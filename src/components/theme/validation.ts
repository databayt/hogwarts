/**
 * Theme Validation Schemas
 *
 * Zod schemas for validating theme configurations.
 */

import { z } from 'zod'

// OKLCH color validation regex
// Format: oklch(L C H) or oklch(L C H / A)
const oklchRegex = /^oklch\(\s*[\d.]+\s+[\d.]+\s+[\d.]+(?:\s*\/\s*[\d%]+)?\s*\)$/

// Zod schema for OKLCH color
export const oklchColorSchema = z
  .string()
  .regex(oklchRegex, 'Must be a valid OKLCH color (e.g., oklch(0.5 0.2 180))')

// Theme colors schema
export const themeColorsSchema = z.object({
  background: oklchColorSchema,
  foreground: oklchColorSchema,
  card: oklchColorSchema,
  cardForeground: oklchColorSchema,
  popover: oklchColorSchema,
  popoverForeground: oklchColorSchema,
  primary: oklchColorSchema,
  primaryForeground: oklchColorSchema,
  secondary: oklchColorSchema,
  secondaryForeground: oklchColorSchema,
  muted: oklchColorSchema,
  mutedForeground: oklchColorSchema,
  accent: oklchColorSchema,
  accentForeground: oklchColorSchema,
  destructive: oklchColorSchema,
  destructiveForeground: oklchColorSchema.optional(),
  border: oklchColorSchema,
  input: oklchColorSchema,
  ring: oklchColorSchema,
  chart1: oklchColorSchema,
  chart2: oklchColorSchema,
  chart3: oklchColorSchema,
  chart4: oklchColorSchema,
  chart5: oklchColorSchema,
  sidebar: oklchColorSchema,
  sidebarForeground: oklchColorSchema,
  sidebarPrimary: oklchColorSchema,
  sidebarPrimaryForeground: oklchColorSchema,
  sidebarAccent: oklchColorSchema,
  sidebarAccentForeground: oklchColorSchema,
  sidebarBorder: oklchColorSchema,
  sidebarRing: oklchColorSchema,
})

// Theme radius schema
export const themeRadiusSchema = z.object({
  base: z.string().min(1, 'Base radius is required'),
  sm: z.string().min(1, 'Small radius is required'),
  md: z.string().min(1, 'Medium radius is required'),
  lg: z.string().min(1, 'Large radius is required'),
  xl: z.string().min(1, 'Extra large radius is required'),
})

// Theme fonts schema
export const themeFontsSchema = z.object({
  sans: z.string().min(1, 'Sans font is required'),
  mono: z.string().min(1, 'Mono font is required'),
})

// Complete theme config schema
export const themeConfigSchema = z.object({
  name: z.string().min(1, 'Theme name is required').max(50, 'Theme name too long'),
  description: z.string().max(200, 'Description too long').optional(),
  light: themeColorsSchema,
  dark: themeColorsSchema,
  radius: themeRadiusSchema,
  fonts: themeFontsSchema.optional(),
  customCss: z.string().max(10000, 'Custom CSS too large').optional(),
})

// User theme data schema (for database)
export const userThemeSchema = z.object({
  id: z.string().optional(),
  userId: z.string(),
  name: z.string().min(1, 'Theme name is required').max(50, 'Theme name too long'),
  isActive: z.boolean().default(false),
  isPreset: z.boolean().default(false),
  themeConfig: themeConfigSchema,
})

// Theme export schema
export const themeExportSchema = z.object({
  version: z.literal('1.0'),
  name: z.string().min(1, 'Theme name is required'),
  description: z.string().optional(),
  author: z.string().optional(),
  createdAt: z.string(),
  config: themeConfigSchema,
})

// Form schemas for user actions
export const saveThemeSchema = z.object({
  name: z.string().min(1, 'Theme name is required').max(50, 'Theme name too long'),
  themeConfig: themeConfigSchema,
})

export const activateThemeSchema = z.object({
  themeId: z.string().min(1, 'Theme ID is required'),
})

export const deleteThemeSchema = z.object({
  themeId: z.string().min(1, 'Theme ID is required'),
})

export const applyPresetSchema = z.object({
  presetId: z.string().min(1, 'Preset ID is required'),
})

// Type inference from schemas
export type ThemeConfigInput = z.infer<typeof themeConfigSchema>
export type UserThemeInput = z.infer<typeof userThemeSchema>
export type ThemeExportInput = z.infer<typeof themeExportSchema>
export type SaveThemeInput = z.infer<typeof saveThemeSchema>
export type ActivateThemeInput = z.infer<typeof activateThemeSchema>
export type DeleteThemeInput = z.infer<typeof deleteThemeSchema>
export type ApplyPresetInput = z.infer<typeof applyPresetSchema>

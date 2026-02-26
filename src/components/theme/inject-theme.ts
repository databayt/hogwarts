// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Theme CSS Variable Injection Utility
 *
 * Handles runtime injection of theme CSS variables into the DOM.
 * Uses flat structure following tweakcn pattern.
 */

import type { ThemeStyleProps } from "@/types/theme-editor"

import {
  DEFAULT_FONT_MONO,
  DEFAULT_FONT_SANS,
  DEFAULT_FONT_SERIF,
  getCSSVariableName,
} from "./config"

// Font properties that should defer to CSS rules (e.g. :root[dir="rtl"]) when at default values
const FONT_DEFAULTS: Record<string, string> = {
  "font-sans": DEFAULT_FONT_SANS,
  "font-serif": DEFAULT_FONT_SERIF,
  "font-mono": DEFAULT_FONT_MONO,
}

/**
 * Inject CSS variables into a DOM element
 */
export function injectCSSVariables(
  element: HTMLElement,
  variables: Record<string, string>
): void {
  Object.entries(variables).forEach(([property, value]) => {
    element.style.setProperty(property, value)
  })
}

/**
 * Remove CSS variables from a DOM element
 */
export function removeCSSVariables(
  element: HTMLElement,
  variableNames: string[]
): void {
  variableNames.forEach((property) => {
    element.style.removeProperty(property)
  })
}

/**
 * Apply theme styles to document root (flat structure)
 */
export function applyThemeToDocument(
  styles: Partial<ThemeStyleProps>,
  mode: "light" | "dark"
): void {
  const root = document.documentElement

  // Convert flat styles to CSS variables
  const variables: Record<string, string> = {}
  Object.entries(styles).forEach(([key, value]) => {
    if (value) {
      // Skip font properties at default values — let CSS rules handle
      // direction-based defaults (e.g. :root[dir="rtl"] sets Rubik)
      if (FONT_DEFAULTS[key] && value === FONT_DEFAULTS[key]) {
        root.style.removeProperty(`--${getCSSVariableName(key)}`)
        return
      }
      const varName = getCSSVariableName(key)
      variables[`--${varName}`] = value
    }
  })

  // Inject all variables
  injectCSSVariables(root, variables)
}

/**
 * Get current theme mode from document
 */
export function getCurrentThemeMode(): "light" | "dark" {
  return document.documentElement.classList.contains("dark") ? "dark" : "light"
}

/**
 * Store theme styles in localStorage for persistence
 */
export function storeThemeInLocalStorage(
  styles: Partial<ThemeStyleProps>
): void {
  try {
    localStorage.setItem("user-theme-styles", JSON.stringify(styles))
  } catch (error) {
    console.error("Failed to store theme in localStorage:", error)
  }
}

/**
 * Retrieve theme styles from localStorage
 */
export function getThemeFromLocalStorage(): Partial<ThemeStyleProps> | null {
  try {
    const stored = localStorage.getItem("user-theme-styles")
    if (!stored) return null
    return JSON.parse(stored) as Partial<ThemeStyleProps>
  } catch (error) {
    console.error("Failed to retrieve theme from localStorage:", error)
    return null
  }
}

/**
 * Clear theme from localStorage
 */
export function clearThemeFromLocalStorage(): void {
  try {
    localStorage.removeItem("user-theme-styles")
  } catch (error) {
    console.error("Failed to clear theme from localStorage:", error)
  }
}

/**
 * Generate CSS variable preview for theme styles
 */
export function generateThemePreviewCSS(
  styles: Partial<ThemeStyleProps>
): string {
  const cssLines = Object.entries(styles).map(([key, value]) => {
    const varName = getCSSVariableName(key)
    return `  --${varName}: ${value};`
  })

  return `:root {\n${cssLines.join("\n")}\n}`
}

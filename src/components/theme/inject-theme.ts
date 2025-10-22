/**
 * Theme CSS Variable Injection Utility
 *
 * Handles runtime injection of theme CSS variables into the DOM.
 */

import type { ThemeConfig, ThemeColors, CSSVariableMap } from './types'
import { getCSSVariableName } from './config'

/**
 * Convert theme colors to CSS variable map
 */
function colorsToCSSVariables(colors: ThemeColors, mode: 'light' | 'dark'): CSSVariableMap {
  const variables: CSSVariableMap = {}

  // Map each color to its CSS variable
  Object.entries(colors).forEach(([key, value]) => {
    const varName = getCSSVariableName(key)
    variables[`--${varName}`] = value
  })

  return variables
}

/**
 * Inject CSS variables into a DOM element
 */
export function injectCSSVariables(element: HTMLElement, variables: CSSVariableMap): void {
  Object.entries(variables).forEach(([property, value]) => {
    element.style.setProperty(property, value)
  })
}

/**
 * Remove CSS variables from a DOM element
 */
export function removeCSSVariables(element: HTMLElement, variableNames: string[]): void {
  variableNames.forEach((property) => {
    element.style.removeProperty(property)
  })
}

/**
 * Apply theme config to document root
 */
export function applyThemeToDocument(themeConfig: ThemeConfig, mode: 'light' | 'dark'): void {
  const root = document.documentElement

  // Select the appropriate color set based on mode
  const colors = mode === 'dark' ? themeConfig.dark : themeConfig.light

  // Convert to CSS variables
  const colorVariables = colorsToCSSVariables(colors, mode)

  // Apply radius variables
  const radiusVariables: CSSVariableMap = {
    '--radius': themeConfig.radius.base,
  }

  // Apply font variables if provided
  const fontVariables: CSSVariableMap = {}
  if (themeConfig.fonts) {
    fontVariables['--font-sans'] = themeConfig.fonts.sans
    fontVariables['--font-mono'] = themeConfig.fonts.mono
  }

  // Inject all variables
  injectCSSVariables(root, {
    ...colorVariables,
    ...radiusVariables,
    ...fontVariables,
  })

  // Apply custom CSS if provided
  if (themeConfig.customCss) {
    applyCustomCSS(themeConfig.customCss)
  }
}

/**
 * Apply custom CSS to the document
 */
function applyCustomCSS(css: string): void {
  // Remove existing custom theme CSS
  const existingStyle = document.getElementById('custom-theme-css')
  if (existingStyle) {
    existingStyle.remove()
  }

  // Create and inject new style element
  const style = document.createElement('style')
  style.id = 'custom-theme-css'
  style.textContent = css
  document.head.appendChild(style)
}

/**
 * Remove custom CSS from the document
 */
export function removeCustomCSS(): void {
  const existingStyle = document.getElementById('custom-theme-css')
  if (existingStyle) {
    existingStyle.remove()
  }
}

/**
 * Get current theme mode from document
 */
export function getCurrentThemeMode(): 'light' | 'dark' {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

/**
 * Store theme in localStorage for persistence
 */
export function storeThemeInLocalStorage(themeConfig: ThemeConfig): void {
  try {
    localStorage.setItem('user-theme-config', JSON.stringify(themeConfig))
  } catch (error) {
    console.error('Failed to store theme in localStorage:', error)
  }
}

/**
 * Retrieve theme from localStorage
 */
export function getThemeFromLocalStorage(): ThemeConfig | null {
  try {
    const stored = localStorage.getItem('user-theme-config')
    if (!stored) return null
    return JSON.parse(stored) as ThemeConfig
  } catch (error) {
    console.error('Failed to retrieve theme from localStorage:', error)
    return null
  }
}

/**
 * Clear theme from localStorage
 */
export function clearThemeFromLocalStorage(): void {
  try {
    localStorage.removeItem('user-theme-config')
  } catch (error) {
    console.error('Failed to clear theme from localStorage:', error)
  }
}

/**
 * Export theme as JSON file
 */
export function exportThemeAsJSON(themeConfig: ThemeConfig, filename?: string): void {
  const themeExport = {
    version: '1.0' as const,
    name: themeConfig.name,
    description: themeConfig.description,
    author: 'User',
    createdAt: new Date().toISOString(),
    config: themeConfig,
  }

  const blob = new Blob([JSON.stringify(themeExport, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename || `${themeConfig.name.toLowerCase().replace(/\s+/g, '-')}-theme.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Import theme from JSON file
 */
export async function importThemeFromJSON(file: File): Promise<ThemeConfig> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string)

        // Validate basic structure
        if (!json.config || !json.version) {
          throw new Error('Invalid theme file format')
        }

        resolve(json.config as ThemeConfig)
      } catch (error) {
        reject(error)
      }
    }

    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }

    reader.readAsText(file)
  })
}

/**
 * Generate CSS variable preview for a theme
 * Useful for displaying theme previews
 */
export function generateThemePreviewCSS(themeConfig: ThemeConfig, mode: 'light' | 'dark'): string {
  const colors = mode === 'dark' ? themeConfig.dark : themeConfig.light
  const variables = colorsToCSSVariables(colors, mode)

  const cssLines = Object.entries(variables).map(([property, value]) => `  ${property}: ${value};`)

  return `:root {\n${cssLines.join('\n')}\n  --radius: ${themeConfig.radius.base};\n}`
}

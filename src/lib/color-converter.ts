/**
 * Color Conversion Utilities
 *
 * Based on tweakcn's color-converter.ts
 * Uses culori for robust color format conversion
 */

import * as culori from "culori"
import type { Hsl } from "culori"

export type ColorFormat = "hsl" | "rgb" | "oklch" | "hex"

/**
 * Format a number, removing unnecessary decimals
 */
export const formatNumber = (num?: number): string => {
  if (!num) return "0"
  return num % 1 === 0 ? num.toString() : num.toFixed(4)
}

/**
 * Format HSL object to string
 */
export const formatHsl = (hsl: Hsl): string => {
  return `hsl(${formatNumber(hsl.h)} ${formatNumber((hsl.s ?? 0) * 100)}% ${formatNumber((hsl.l ?? 0) * 100)}%)`
}

/**
 * Convert color value to specified format
 *
 * @param colorValue - Input color (any valid CSS color format)
 * @param format - Target format (hsl, rgb, oklch, hex)
 * @param tailwindVersion - Tailwind CSS version (3 or 4)
 * @returns Formatted color string
 */
export const colorFormatter = (
  colorValue: string,
  format: ColorFormat = "hsl",
  tailwindVersion: "3" | "4" = "4"
): string => {
  try {
    const color = culori.parse(colorValue)
    if (!color) throw new Error("Invalid color input")

    switch (format) {
      case "hsl": {
        const hsl = culori.converter("hsl")(color)
        if (tailwindVersion === "4") {
          return formatHsl(hsl)
        }
        // Tailwind v3 format (space-separated without hsl())
        return `${formatNumber(hsl.h)} ${formatNumber((hsl.s ?? 0) * 100)}% ${formatNumber((hsl.l ?? 0) * 100)}%`
      }
      case "rgb":
        return culori.formatRgb(color) // e.g., "rgb(64, 128, 192)"
      case "oklch": {
        const oklch = culori.converter("oklch")(color)
        return `oklch(${formatNumber(oklch.l)} ${formatNumber(oklch.c ?? 0)} ${formatNumber(oklch.h ?? 0)})`
      }
      case "hex":
        return culori.formatHex(color) // e.g., "#4080c0"
      default:
        return colorValue
    }
  } catch (error) {
    console.error(`Failed to convert color: ${colorValue}`, error)
    return colorValue
  }
}

/**
 * Convert any color to HSL format
 */
export const convertToHSL = (colorValue: string): string =>
  colorFormatter(colorValue, "hsl", "4")

/**
 * Convert any color to HEX format
 */
export const convertToHex = (colorValue: string): string =>
  colorFormatter(colorValue, "hex")

/**
 * Convert any color to OKLCH format
 */
export const convertToOKLCH = (colorValue: string): string =>
  colorFormatter(colorValue, "oklch")

/**
 * Add alpha channel to color
 *
 * @param colorValue - Input color
 * @param alpha - Alpha value (0-1)
 * @returns Color with alpha channel
 */
export const addAlphaChannel = (colorValue: string, alpha: number): string => {
  try {
    const color = culori.parse(colorValue)
    if (!color) return colorValue

    const hsl = culori.converter("hsl")(color)
    return `hsl(${formatNumber(hsl.h)} ${formatNumber((hsl.s ?? 0) * 100)}% ${formatNumber((hsl.l ?? 0) * 100)}% / ${alpha})`
  } catch (error) {
    console.error(`Failed to add alpha channel: ${colorValue}`, error)
    return colorValue
  }
}

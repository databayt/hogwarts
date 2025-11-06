/**
 * Theme Utilities
 *
 * Advanced utilities for theme manipulation, color conversion,
 * contrast checking, and palette generation.
 *
 * Based on tweakcn patterns and WCAG 2.1 guidelines.
 */

/**
 * OKLCH Color Parsing and Conversion
 */

export interface OKLCHColor {
  l: number // Lightness (0-1)
  c: number // Chroma (0-0.4 typically)
  h: number // Hue (0-360)
  alpha?: number // Alpha (0-1)
}

/**
 * Parse OKLCH string to object
 */
export function parseOKLCH(oklchString: string): OKLCHColor | null {
  const match = oklchString.match(
    /oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.%]+))?\s*\)/
  )

  if (!match) return null

  const [, l, c, h, a] = match
  return {
    l: parseFloat(l),
    c: parseFloat(c),
    h: parseFloat(h),
    alpha: a ? (a.endsWith('%') ? parseFloat(a) / 100 : parseFloat(a)) : 1
  }
}

/**
 * Convert OKLCH object to string
 */
export function oklchToString(color: OKLCHColor): string {
  const { l, c, h, alpha = 1 } = color
  if (alpha < 1) {
    return `oklch(${l.toFixed(3)} ${c.toFixed(3)} ${h.toFixed(3)} / ${alpha.toFixed(2)})`
  }
  return `oklch(${l.toFixed(3)} ${c.toFixed(3)} ${h.toFixed(3)})`
}

/**
 * OKLCH to sRGB conversion (for contrast calculations)
 */
export function oklchToRGB(color: OKLCHColor): { r: number; g: number; b: number } {
  const { l, c, h } = color

  // Convert OKLCH to OKLab
  const hRad = (h * Math.PI) / 180
  const a = c * Math.cos(hRad)
  const b = c * Math.sin(hRad)

  // OKLab to linear sRGB
  const l_ = l + 0.3963377774 * a + 0.2158037573 * b
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b
  const s_ = l - 0.0894841775 * a - 1.2914855480 * b

  const l3 = l_ * l_ * l_
  const m3 = m_ * m_ * m_
  const s3 = s_ * s_ * s_

  let r = +4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3
  let g = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3
  let b_ = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.7076147010 * s3

  // Clamp to 0-1 range
  r = Math.max(0, Math.min(1, r))
  g = Math.max(0, Math.min(1, g))
  b_ = Math.max(0, Math.min(1, b_))

  // Apply gamma correction (sRGB)
  const gamma = (val: number) => val <= 0.0031308
    ? 12.92 * val
    : 1.055 * Math.pow(val, 1 / 2.4) - 0.055

  return {
    r: Math.round(gamma(r) * 255),
    g: Math.round(gamma(g) * 255),
    b: Math.round(gamma(b_) * 255)
  }
}

/**
 * Calculate relative luminance (WCAG 2.1)
 */
export function getRelativeLuminance(rgb: { r: number; g: number; b: number }): number {
  const { r, g, b } = rgb

  const rsRGB = r / 255
  const gsRGB = g / 255
  const bsRGB = b / 255

  const rLinear = rsRGB <= 0.04045 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4)
  const gLinear = gsRGB <= 0.04045 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4)
  const bLinear = bsRGB <= 0.04045 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4)

  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear
}

/**
 * Calculate contrast ratio (WCAG 2.1)
 */
export function getContrastRatio(color1: string, color2: string): number {
  const oklch1 = parseOKLCH(color1)
  const oklch2 = parseOKLCH(color2)

  if (!oklch1 || !oklch2) return 1

  const rgb1 = oklchToRGB(oklch1)
  const rgb2 = oklchToRGB(oklch2)

  const l1 = getRelativeLuminance(rgb1)
  const l2 = getRelativeLuminance(rgb2)

  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)

  return (lighter + 0.05) / (darker + 0.05)
}

/**
 * WCAG Compliance Levels
 */
export type WCAGLevel = 'AAA' | 'AA' | 'A' | 'FAIL'

export interface ContrastResult {
  ratio: number
  level: WCAGLevel
  passes: {
    normalAAA: boolean // 7:1
    normalAA: boolean // 4.5:1
    largeAAA: boolean // 4.5:1
    largeAA: boolean // 3:1
  }
}

/**
 * Check WCAG 2.1 contrast compliance
 */
export function checkContrast(foreground: string, background: string): ContrastResult {
  const ratio = getContrastRatio(foreground, background)

  const passes = {
    normalAAA: ratio >= 7,
    normalAA: ratio >= 4.5,
    largeAAA: ratio >= 4.5,
    largeAA: ratio >= 3
  }

  let level: WCAGLevel = 'FAIL'
  if (passes.normalAAA) level = 'AAA'
  else if (passes.normalAA) level = 'AA'
  else if (passes.largeAA) level = 'A'

  return { ratio, level, passes }
}

/**
 * Color Palette Generation
 */

export interface ColorScale {
  50: string
  100: string
  200: string
  300: string
  400: string
  500: string // Base color
  600: string
  700: string
  800: string
  900: string
  950: string
}

/**
 * Generate color scale from base OKLCH color
 */
export function generateColorScale(baseColor: string): ColorScale {
  const oklch = parseOKLCH(baseColor)
  if (!oklch) {
    throw new Error(`Invalid OKLCH color: ${baseColor}`)
  }

  const { c, h } = oklch

  // Lightness scale (perceptually uniform)
  const lightnessSteps = {
    50: 0.97,
    100: 0.94,
    200: 0.88,
    300: 0.78,
    400: 0.68,
    500: 0.58, // Base
    600: 0.50,
    700: 0.42,
    800: 0.34,
    900: 0.26,
    950: 0.18
  }

  const scale: Partial<ColorScale> = {}

  for (const [key, lightness] of Object.entries(lightnessSteps)) {
    scale[key as unknown as keyof ColorScale] = oklchToString({
      l: lightness,
      c: c * (lightness > 0.7 ? 0.8 : 1), // Reduce chroma in light colors
      h
    })
  }

  return scale as ColorScale
}

/**
 * Generate complementary color (180° hue shift)
 */
export function getComplementaryColor(baseColor: string): string {
  const oklch = parseOKLCH(baseColor)
  if (!oklch) return baseColor

  return oklchToString({
    ...oklch,
    h: (oklch.h + 180) % 360
  })
}

/**
 * Generate analogous colors (±30° hue shift)
 */
export function getAnalogousColors(baseColor: string): [string, string, string] {
  const oklch = parseOKLCH(baseColor)
  if (!oklch) return [baseColor, baseColor, baseColor]

  const analogous1 = oklchToString({
    ...oklch,
    h: (oklch.h - 30 + 360) % 360
  })

  const analogous2 = oklchToString({
    ...oklch,
    h: (oklch.h + 30) % 360
  })

  return [analogous1, baseColor, analogous2]
}

/**
 * Generate triadic colors (120° hue shifts)
 */
export function getTriadicColors(baseColor: string): [string, string, string] {
  const oklch = parseOKLCH(baseColor)
  if (!oklch) return [baseColor, baseColor, baseColor]

  const triadic1 = oklchToString({
    ...oklch,
    h: (oklch.h + 120) % 360
  })

  const triadic2 = oklchToString({
    ...oklch,
    h: (oklch.h + 240) % 360
  })

  return [baseColor, triadic1, triadic2]
}

/**
 * Adjust color lightness
 */
export function adjustLightness(color: string, amount: number): string {
  const oklch = parseOKLCH(color)
  if (!oklch) return color

  return oklchToString({
    ...oklch,
    l: Math.max(0, Math.min(1, oklch.l + amount))
  })
}

/**
 * Adjust color chroma (saturation)
 */
export function adjustChroma(color: string, scale: number): string {
  const oklch = parseOKLCH(color)
  if (!oklch) return color

  return oklchToString({
    ...oklch,
    c: Math.max(0, oklch.c * scale)
  })
}

/**
 * Rotate hue
 */
export function rotateHue(color: string, degrees: number): string {
  const oklch = parseOKLCH(color)
  if (!oklch) return color

  return oklchToString({
    ...oklch,
    h: (oklch.h + degrees + 360) % 360
  })
}

/**
 * Generate semantic theme colors from a base primary color
 */
export interface SemanticColors {
  primary: string
  secondary: string
  accent: string
  destructive: string
  muted: string
  success: string
  warning: string
  info: string
}

export function generateSemanticPalette(primaryColor: string): SemanticColors {
  const oklch = parseOKLCH(primaryColor)
  if (!oklch) {
    throw new Error(`Invalid OKLCH color: ${primaryColor}`)
  }

  return {
    primary: primaryColor,
    secondary: oklchToString({ l: 0.97, c: 0.005, h: oklch.h }),
    accent: oklchToString({ l: 0.92, c: oklch.c * 0.3, h: (oklch.h + 30) % 360 }),
    destructive: oklchToString({ l: 0.577, c: 0.245, h: 27.325 }), // Red
    muted: oklchToString({ l: 0.97, c: 0, h: 0 }), // Neutral gray
    success: oklchToString({ l: 0.65, c: 0.18, h: 145 }), // Green
    warning: oklchToString({ l: 0.75, c: 0.15, h: 85 }), // Yellow/Orange
    info: oklchToString({ l: 0.60, c: 0.19, h: 260 }) // Blue
  }
}

/**
 * Ensure minimum contrast by adjusting lightness
 */
export function ensureContrast(
  foreground: string,
  background: string,
  targetRatio: number = 4.5
): string {
  const fg = parseOKLCH(foreground)
  const bg = parseOKLCH(background)

  if (!fg || !bg) return foreground

  let ratio = getContrastRatio(foreground, background)
  let iterations = 0
  const maxIterations = 20

  // Adjust lightness until we meet target ratio
  while (ratio < targetRatio && iterations < maxIterations) {
    if (fg.l > bg.l) {
      // Foreground is lighter, make it even lighter
      fg.l = Math.min(1, fg.l + 0.05)
    } else {
      // Foreground is darker, make it even darker
      fg.l = Math.max(0, fg.l - 0.05)
    }

    const adjusted = oklchToString(fg)
    ratio = getContrastRatio(adjusted, background)
    iterations++
  }

  return oklchToString(fg)
}

/**
 * Check if color is light or dark (for choosing foreground)
 */
export function isLightColor(color: string): boolean {
  const oklch = parseOKLCH(color)
  if (!oklch) return true

  return oklch.l > 0.5
}

/**
 * Get contrasting foreground color (black or white)
 */
export function getContrastingForeground(background: string): string {
  return isLightColor(background)
    ? 'oklch(0.145 0 0)' // Dark foreground
    : 'oklch(0.985 0 0)' // Light foreground
}

/**
 * Interpolate between two colors
 */
export function interpolateColors(color1: string, color2: string, t: number): string {
  const oklch1 = parseOKLCH(color1)
  const oklch2 = parseOKLCH(color2)

  if (!oklch1 || !oklch2) return color1

  return oklchToString({
    l: oklch1.l + (oklch2.l - oklch1.l) * t,
    c: oklch1.c + (oklch2.c - oklch1.c) * t,
    h: oklch1.h + (oklch2.h - oklch1.h) * t
  })
}

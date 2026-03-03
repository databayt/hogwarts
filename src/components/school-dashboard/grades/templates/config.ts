// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Locale } from "@/components/internationalization/config"

import type { CertPaperTheme } from "./types"

export const THEME_ELEGANT: CertPaperTheme = {
  colors: {
    primary: "#1a1a2e",
    accent: "#C9A962",
    gold: "#C9A962",
    text: "#1a1a2e",
    textLight: "#6b7280",
    background: "#FFFEF5",
    border: "#C9A962",
  },
  typography: {
    fontFamily: "Rubik",
    titleSize: 28,
    subtitleSize: 18,
    bodySize: 12,
    smallSize: 9,
  },
  spacing: { page: 40, section: 16, element: 8 },
  locale: "ar",
  isRTL: true,
}

export const THEME_MODERN: CertPaperTheme = {
  colors: {
    primary: "#1e3a5f",
    accent: "#2563eb",
    gold: "#C9A962",
    text: "#111827",
    textLight: "#6b7280",
    background: "#ffffff",
    border: "#2563eb",
  },
  typography: {
    fontFamily: "Inter",
    titleSize: 26,
    subtitleSize: 16,
    bodySize: 11,
    smallSize: 9,
  },
  spacing: { page: 40, section: 14, element: 8 },
  locale: "en",
  isRTL: false,
}

export const THEME_CLASSIC: CertPaperTheme = {
  colors: {
    primary: "#2d2d2d",
    accent: "#8B7355",
    gold: "#8B7355",
    text: "#2d2d2d",
    textLight: "#6b7280",
    background: "#FDF8F0",
    border: "#8B7355",
  },
  typography: {
    fontFamily: "Rubik",
    titleSize: 30,
    subtitleSize: 18,
    bodySize: 12,
    smallSize: 9,
  },
  spacing: { page: 45, section: 18, element: 10 },
  locale: "ar",
  isRTL: true,
}

export function getCertThemePreset(style: string): CertPaperTheme {
  switch (style) {
    case "modern":
      return THEME_MODERN
    case "classic":
      return THEME_CLASSIC
    case "elegant":
    default:
      return THEME_ELEGANT
  }
}

export function withCertLocale(
  theme: CertPaperTheme,
  locale: Locale
): CertPaperTheme {
  return {
    ...theme,
    locale,
    isRTL: locale === "ar",
    typography: {
      ...theme.typography,
      fontFamily: locale === "ar" ? "Rubik" : "Inter",
    },
  }
}

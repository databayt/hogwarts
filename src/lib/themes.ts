// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Theme styles for BillingSDK components
 * This provides CSS custom properties for theming
 */

export function getThemeStyles(
  theme: string,
  isDark: boolean
): React.CSSProperties {
  // Return empty styles - the components will use the default Tailwind/shadcn theming
  // This is a compatibility layer for BillingSDK components
  return {}
}

export const themes = {
  default: {
    light: {},
    dark: {},
  },
}

export type ThemeName = keyof typeof themes

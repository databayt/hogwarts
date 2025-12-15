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

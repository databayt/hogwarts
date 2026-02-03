# Theme System Documentation

## Overview

The Hogwarts theme system is a comprehensive, production-ready theming solution built on **shadcn/ui** principles and inspired by **tweakcn** patterns. It provides complete control over the visual appearance of the platform through semantic CSS tokens and OKLCH color space manipulation.

## Architecture

### Core Principles

1. **Semantic Token System**: Every component uses semantic tokens (`bg-background`, `text-foreground`) instead of hardcoded colors
2. **OKLCH Color Space**: Perceptually uniform colors for consistent visual results
3. **CSS Variable Foundation**: Tailwind v4 `@theme inline` directive for instant updates
4. **Zero Runtime CSS**: Theme changes update CSS variables only (sub-100ms switching)
5. **Accessibility First**: Built-in WCAG 2.1 contrast checking and enforcement

### File Structure

```
src/components/theme/
├── README.md                    # This file
├── ISSUE.md                     # Known issues & troubleshooting
├── actions.ts                   # Server actions for theme CRUD
├── config.ts                    # Default theme configuration
├── content.tsx                  # Main theme UI (DEPRECATED - use settings integration)
├── dynamic-font-loader.tsx      # Google Fonts dynamic loader
├── import-export.tsx            # Theme import/export UI
├── inject-theme.ts              # CSS variable injection utilities
├── preset-button.tsx            # Individual preset button component
├── preset-gallery.tsx           # Grid of preset themes
├── presets.ts                   # 160+ built-in theme presets
├── theme-preset-helper.ts       # Preset retrieval utilities
├── theme-provider.tsx           # Root theme provider (app-level)
├── use-theme.ts                 # React hooks for theme operations
└── validation.ts                # Zod schemas for theme data

src/lib/
└── theme-utils.ts               # Advanced color utilities (570 lines)

src/store/
├── theme-editor-store.ts        # Zustand store (undo/redo)
└── theme-preset-store.ts        # Preset cache store

src/types/
└── theme-editor.ts              # TypeScript type definitions

src/app/globals.css
└── CSS variables & @theme inline configuration
```

## Usage

### For End Users

Access theme settings via: **Settings → Appearance**

Features:

- Browse 160+ preset themes
- Apply themes with one click
- Import/export custom themes
- Light/dark mode support

### For Developers

#### 1. Use Semantic Tokens in Components

```tsx
// ❌ NEVER DO THIS (hardcoded colors)
<div className="bg-white dark:bg-gray-900 border-gray-200">
  <h1 className="text-black dark:text-white">Title</h1>
</div>

// ✅ ALWAYS DO THIS (semantic tokens)
<div className="bg-background border-border">
  <h1 className="text-foreground">Title</h1>
</div>
```

#### 2. Available Semantic Tokens

| Token                | Usage                 | Example                   |
| -------------------- | --------------------- | ------------------------- |
| `background`         | Page/card backgrounds | `bg-background`           |
| `foreground`         | Primary text          | `text-foreground`         |
| `muted`              | Muted backgrounds     | `bg-muted`                |
| `muted-foreground`   | Secondary text        | `text-muted-foreground`   |
| `primary`            | Primary actions       | `bg-primary`              |
| `primary-foreground` | Text on primary       | `text-primary-foreground` |
| `secondary`          | Secondary actions     | `bg-secondary`            |
| `accent`             | Accent backgrounds    | `bg-accent`               |
| `destructive`        | Errors/warnings       | `bg-destructive`          |
| `border`             | Border colors         | `border-border`           |
| `input`              | Input borders         | `border-input`            |
| `ring`               | Focus rings           | `ring-ring`               |
| `card`               | Card backgrounds      | `bg-card`                 |
| `popover`            | Popover backgrounds   | `bg-popover`              |

**Sidebar Tokens:**

- `sidebar`, `sidebar-foreground`, `sidebar-primary`, `sidebar-accent`, etc.

**Chart Tokens:**

- `chart-1`, `chart-2`, `chart-3`, `chart-4`, `chart-5`

#### 3. Using Theme Hooks

```tsx
"use client"

import { useThemeOperations, useUserTheme } from "@/components/theme/use-theme"

function MyComponent() {
  const { themeState, applyThemePreset } = useUserTheme()
  const { saveTheme, deleteTheme } = useThemeOperations()

  return (
    <button onClick={() => applyThemePreset("zinc")}>Apply Zinc Theme</button>
  )
}
```

#### 4. Using Theme Utilities

```tsx
import {
  checkContrast,
  ensureContrast,
  generateColorScale,
  generateSemanticPalette,
  parseOKLCH,
} from "@/lib/theme-utils"

// Parse OKLCH color
const color = parseOKLCH("oklch(0.5 0.2 200)")
// { l: 0.5, c: 0.2, h: 200 }

// Check WCAG contrast
const result = checkContrast(
  "oklch(0.2 0 0)", // Dark foreground
  "oklch(1 0 0)" // Light background
)
// { ratio: 15.2, level: 'AAA', passes: { normalAAA: true, ... } }

// Generate color scale
const scale = generateColorScale("oklch(0.58 0.2 200)")
// { 50: 'oklch(...)', 100: 'oklch(...)', ..., 950: 'oklch(...)' }

// Generate semantic palette from primary color
const palette = generateSemanticPalette("oklch(0.5 0.2 264)")
// { primary, secondary, accent, destructive, muted, success, warning, info }

// Ensure WCAG AA contrast (4.5:1)
const adjusted = ensureContrast(
  "oklch(0.6 0.1 200)", // Foreground
  "oklch(0.7 0 0)", // Background
  4.5 // Target ratio
)
// Returns adjusted foreground color with sufficient contrast
```

## API Reference

### Hooks

#### `useUserTheme()`

Access theme editor state.

```tsx
const {
  themeState, // Current theme configuration
  setThemeState, // Update theme state
  applyThemePreset, // Apply preset by name
} = useUserTheme()
```

#### `useThemeOperations()`

Perform theme CRUD operations.

```tsx
const {
  applyTheme, // (state: ThemeEditorState) => void
  saveTheme, // (name: string) => Promise<void>
  activateTheme, // (themeId: string) => Promise<void>
  deleteTheme, // (themeId: string) => Promise<void>
  isPending, // boolean - operation in progress
} = useThemeOperations()
```

#### `useThemeImportExport()`

Import/export theme JSON files.

```tsx
const {
  exportTheme, // (themeName: string) => Promise<void>
  importTheme, // (file: File) => Promise<ThemeEditorState | null>
  isExporting, // boolean
  isImporting, // boolean
} = useThemeImportExport()
```

#### `usePresetThemes()`

Fetch available preset themes.

```tsx
const {
  presets, // ThemePreset[]
  isLoading, // boolean
  fetchPresets, // () => Promise<void>
} = usePresetThemes()
```

### Server Actions

All actions follow Next.js server action patterns with FormData.

#### `saveUserTheme(formData: FormData)`

Save user theme to database.

```tsx
const formData = new FormData()
formData.append("name", "My Theme")
formData.append("themeConfig", JSON.stringify(themeState))

const result = await saveUserTheme(formData)
// { success: true, theme: {...} } | { error: string }
```

#### `activateUserTheme(formData: FormData)`

Set theme as active for current user.

```tsx
const formData = new FormData()
formData.append("themeId", "theme-uuid")

await activateUserTheme(formData)
```

#### `deleteUserTheme(formData: FormData)`

Delete user theme from database.

```tsx
const formData = new FormData()
formData.append("themeId", "theme-uuid")

await deleteUserTheme(formData)
```

## Color System

### OKLCH Color Space

OKLCH (Lightness, Chroma, Hue) provides:

- **Perceptual uniformity**: Equal changes = equal visual differences
- **Predictable lightness**: Adjust `l` without hue shifts
- **Wide gamut**: Access more vivid colors than sRGB
- **Better accessibility**: More accurate contrast calculations

Format: `oklch(L C H / A)`

- **L**: Lightness (0-1, where 0=black, 1=white)
- **C**: Chroma/saturation (0-0.4 typically)
- **H**: Hue (0-360 degrees)
- **A**: Alpha/opacity (0-1, optional)

Examples:

```css
oklch(0.5 0.2 200)        /* Mid-blue */
oklch(0.8 0.1 120)        /* Light green */
oklch(0.3 0.15 30 / 0.8)  /* Dark orange, 80% opacity */
```

### Color Utility Functions

#### `parseOKLCH(oklchString: string): OKLCHColor | null`

Parse OKLCH string to object.

#### `oklchToString(color: OKLCHColor): string`

Convert OKLCH object to CSS string.

#### `oklchToRGB(color: OKLCHColor): { r, g, b }`

Convert OKLCH to sRGB (0-255 range).

#### `getRelativeLuminance(rgb: { r, g, b }): number`

Calculate WCAG 2.1 relative luminance.

#### `getContrastRatio(color1: string, color2: string): number`

Calculate WCAG 2.1 contrast ratio between two OKLCH colors.

#### `checkContrast(foreground: string, background: string): ContrastResult`

Check WCAG compliance.

Returns:

```tsx
{
  ratio: number,          // Contrast ratio (1-21)
  level: 'AAA' | 'AA' | 'A' | 'FAIL',
  passes: {
    normalAAA: boolean,   // 7:1 for normal text
    normalAA: boolean,    // 4.5:1 for normal text
    largeAAA: boolean,    // 4.5:1 for large text
    largeAA: boolean      // 3:1 for large text
  }
}
```

#### `generateColorScale(baseColor: string): ColorScale`

Generate 11-step color scale (50-950).

#### `generateSemanticPalette(primaryColor: string): SemanticColors`

Generate complete semantic palette from single primary color.

#### `ensureContrast(foreground: string, background: string, targetRatio?: number): string`

Automatically adjust foreground lightness to meet contrast requirements.

#### `isLightColor(color: string): boolean`

Check if color is light (lightness > 0.5).

#### `getContrastingForeground(background: string): string`

Get appropriate foreground (black or white) for background.

## Theme State Structure

```typescript
interface ThemeEditorState {
  styles: {
    light: Partial<ThemeStyleProps>
    dark: Partial<ThemeStyleProps>
  }
  currentMode: 'light' | 'dark'
  preset?: string                    // Preset name if applied
  hslAdjustments: {
    hueShift: number                 // -180 to 180
    saturationScale: number          // 0 to 2
    lightnessScale: number           // 0 to 2
  }
}

interface ThemeStyleProps {
  // Core colors
  background: string
  foreground: string

  // Component colors
  card: string
  'card-foreground': string
  popover: string
  'popover-foreground': string
  primary: string
  'primary-foreground': string
  secondary: string
  'secondary-foreground': string
  muted: string
  'muted-foreground': string
  accent: string
  'accent-foreground': string
  destructive: string
  'destructive-foreground': string

  // UI elements
  border: string
  input: string
  ring: string

  // Charts
  'chart-1' through 'chart-5': string

  // Sidebar
  sidebar: string
  'sidebar-foreground': string
  'sidebar-primary': string
  'sidebar-primary-foreground': string
  'sidebar-accent': string
  'sidebar-accent-foreground': string
  'sidebar-border': string
  'sidebar-ring': string

  // Typography
  'font-sans': string
  'font-serif': string
  'font-mono': string

  // Other
  radius: string
  'letter-spacing': string
}
```

## Best Practices

### 1. Always Use Semantic Tokens

```tsx
// ✅ Good
<Button className="bg-primary text-primary-foreground">
  Submit
</Button>

// ❌ Bad
<Button className="bg-blue-500 text-white">
  Submit
</Button>
```

### 2. Check Contrast for Custom Colors

```tsx
import { checkContrast } from "@/lib/theme-utils"

// Always validate custom color combinations
const result = checkContrast(foregroundColor, backgroundColor)
if (result.level === "FAIL") {
  console.warn("Insufficient contrast!")
}
```

### 3. Use Preset Themes as Starting Points

```tsx
// Start with a preset, then customize
const baseTheme = getPresetThemeStyles("zinc")
const customTheme = {
  ...baseTheme,
  light: {
    ...baseTheme.light,
    primary: "oklch(0.5 0.25 280)", // Custom primary color
  },
}
```

### 4. Persist Theme Preferences

Themes are automatically persisted:

- **Zustand persist middleware**: localStorage
- **Database**: User preferences table
- **Session**: Current active theme

### 5. Test in Both Light and Dark Modes

```tsx
// Always define both light and dark variants
const myTheme = {
  light: { primary: "oklch(0.5 0.2 264)" },
  dark: { primary: "oklch(0.7 0.15 264)" }, // Lighter for dark mode
}
```

## Performance

### Theme Switching Performance

- **Target**: < 100ms theme switch
- **Actual**: ~50ms (CSS variable updates only)
- **No page reload required**
- **No JavaScript recalculation**

### Optimization Strategies

1. **Lazy Loading**: Theme editor components load on-demand
2. **Zustand Persist**: Cached in localStorage
3. **CSS Variables**: Instant browser repaints
4. **Preset Caching**: Store presets in memory

### Bundle Impact

- **Core theme system**: ~15KB gzipped
- **Preset library**: ~45KB (lazy loaded)
- **Theme utilities**: ~8KB gzipped
- **Total initial load**: ~15KB (presets load on settings page)

## Integration Points

### 1. App-Level Setup

```tsx
// src/app/layout.tsx
import { ThemeProvider } from "@/components/theme/theme-provider"

export default function RootLayout({ children }) {
  return (
    <html suppressHydrationMismatch>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
```

### 2. Settings Integration

Theme settings are integrated into the main Settings page at:
`/settings` → Appearance tab

Component: `src/components/platform/settings/appearance-settings.tsx`

### 3. Middleware Integration

No middleware changes needed. Theme state is client-side only (localStorage + Zustand).

### 4. Database Schema

```prisma
model UserTheme {
  id          String   @id @default(cuid())
  name        String
  userId      String
  schoolId    String
  themeConfig Json     // ThemeEditorState
  isPreset    Boolean  @default(false)
  isActive    Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  school School @relation(fields: [schoolId], references: [id], onDelete: Cascade)

  @@unique([userId, schoolId, name])
  @@index([userId, schoolId])
}
```

## Extending the Theme System

### Adding New Semantic Tokens

1. **Update `src/app/globals.css`**:

```css
:root {
  --my-new-token: oklch(0.5 0.2 200);
}

.dark {
  --my-new-token: oklch(0.7 0.15 200);
}
```

2. **Update `@theme inline` mapping**:

```css
@theme inline {
  --color-my-new-token: var(--my-new-token);
}
```

3. **Update TypeScript types** in `src/types/theme-editor.ts`:

```typescript
interface ThemeStyleProps {
  // ... existing tokens
  "my-new-token": string
}
```

4. **Add to default configs** in `src/components/theme/config.ts`:

```typescript
export const defaultLightThemeStyles = {
  // ... existing
  "my-new-token": "oklch(0.5 0.2 200)",
}
```

### Adding New Presets

Edit `src/components/theme/presets.ts`:

```typescript
export const themePresets = {
  // ... existing presets

  "my-preset": {
    label: "My Preset",
    styles: {
      light: {
        background: "oklch(1 0 0)",
        foreground: "oklch(0.2 0 0)",
        primary: "oklch(0.5 0.25 280)",
        // ... all required tokens
      },
      dark: {
        background: "oklch(0.15 0 0)",
        foreground: "oklch(0.95 0 0)",
        primary: "oklch(0.7 0.2 280)",
        // ... all required tokens
      },
    },
  },
}
```

## Testing

### Unit Tests

```bash
# Run theme utility tests
pnpm test src/lib/theme-utils.test.ts

# Run component tests
pnpm test src/components/theme/**/*.test.tsx
```

### Integration Tests

```bash
# E2E theme switching tests
pnpm test:e2e tests/e2e/theme-switching.spec.ts
```

### Manual Testing Checklist

- [ ] Switch between preset themes
- [ ] Verify light/dark mode transitions
- [ ] Check contrast on all text elements
- [ ] Test import/export functionality
- [ ] Verify persistence across page reloads
- [ ] Test in both English and Arabic
- [ ] Check accessibility with screen reader
- [ ] Verify mobile responsiveness

## Troubleshooting

See [ISSUE.md](./ISSUE.md) for common issues and solutions.

Quick fixes:

- **Theme not applying**: Clear localStorage and reload
- **Contrast issues**: Use `ensureContrast()` utility
- **Preset not found**: Check preset name spelling
- **FOUC (Flash of Unstyled Content)**: Ensure ThemeProvider is in root layout

## Related Documentation

- [User Documentation](../../app/[lang]/docs/theme/page.mdx)
- [Known Issues](./ISSUE.md)
- [Marking System README](../school-dashboard/exams/mark/README.md)
- [Typography System](../../../styles/typography.css)
- [CLAUDE.md](../../../CLAUDE.md) - Project guidelines

## Contributing

When contributing to the theme system:

1. **Follow semantic token patterns** - No hardcoded colors
2. **Use OKLCH color space** - Consistent with existing system
3. **Add TypeScript types** - No `any` types
4. **Write tests** - Unit tests for utilities, integration tests for components
5. **Update documentation** - Keep README.md and ISSUE.md current
6. **Check accessibility** - Ensure WCAG AA minimum
7. **Test both modes** - Light and dark theme variants

## License

MIT License - See project root LICENSE file.

---

**Last Updated**: 2025-10-27
**Version**: 2.0
**Maintainer**: Development Team

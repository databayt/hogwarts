# Typography Migration Plan: Accurate tweakcn Mirroring

**Date**: October 23, 2025
**Goal**: Update all 24 preset themes to accurately mirror tweakcn's typography and all fields

---

## Preset Inventory

### tweakcn Presets (24 total)
1. modern-minimal
2. violet-bloom
3. **t3-chat** ← Missing from our implementation
4. mocha-mousse
5. amethyst-haze
6. **doom-64** ← Missing from our implementation
7. kodama-grove
8. cosmic-night
9. quantum-rose
10. bold-tech
11. elegant-luxury
12. amber-minimal
13. neo-brutalism
14. solar-dusk
15. pastel-dreams
16. clean-slate
17. ocean-breeze
18. retro-arcade
19. midnight-bloom
20. northern-lights
21. vintage-paper
22. sunset-horizon
23. starry-night
24. soft-pop

### Our Presets (24 total)
- **Default** ← Our custom theme (not in tweakcn)
- Modern Minimal ✅
- Violet Bloom ✅
- Mocha Mousse ✅
- Amethyst Haze ✅
- Kodama Grove ✅
- Cosmic Night ✅
- Neo Brutalism ✅
- Ocean Breeze ✅
- Sunset Horizon ✅
- Pastel Dreams ✅
- Retro Arcade ✅
- Midnight Bloom ✅
- Northern Lights ✅
- Vintage Paper ✅
- Starry Night ✅
- Soft Pop ✅
- Clean Slate ✅
- Quantum Rose ✅
- Bold Tech ✅
- Elegant Luxury ✅
- Amber Minimal ✅
- Solar Dusk ✅

---

## Complete Font Mapping Table

| # | Preset Name | font-sans | font-serif | font-mono |
|---|-------------|-----------|------------|-----------|
| 1 | **Default (Ours)** | `var(--font-geist-sans)` | `var(--font-geist-mono)` | `var(--font-geist-mono)` |
| 2 | **Modern Minimal** | `Inter, sans-serif` | `Source Serif 4, serif` | `JetBrains Mono, monospace` |
| 3 | **Violet Bloom** | `Plus Jakarta Sans, sans-serif` | `Lora, serif` | `IBM Plex Mono, monospace` |
| 4 | **T3 Chat** ⚠️ NEW | No fonts defined (uses defaults) | No fonts defined | No fonts defined |
| 5 | **Mocha Mousse** | `Open Sans, sans-serif` | `Georgia, serif` | `Menlo, monospace` |
| 6 | **Amethyst Haze** | `DM Sans, sans-serif` | `Georgia, serif` | `Menlo, monospace` |
| 7 | **Doom 64** ⚠️ NEW | `"Oxanium", sans-serif` | `ui-serif, Georgia, ...` | `"Source Code Pro", monospace` |
| 8 | **Kodama Grove** | `Poppins, sans-serif` | `Lora, serif` | `Fira Code, monospace` |
| 9 | **Cosmic Night** | `Geist, sans-serif` | `"Lora", Georgia, serif` | `"Fira Code", "Courier New", monospace` |
| 10 | **Quantum Rose** | `Architects Daughter, sans-serif` | `"Times New Roman", Times, serif` | `"Courier New", Courier, monospace` |
| 11 | **Bold Tech** | `Montserrat, sans-serif` | `Georgia, serif` | `Fira Code, monospace` |
| 12 | **Elegant Luxury** | `Inter, sans-serif` | `Georgia, serif` | `Fira Code, monospace` |
| 13 | **Amber Minimal** | `Inter, sans-serif` | `Source Serif 4, serif` | `JetBrains Mono, monospace` |
| 14 | **Neo Brutalism** | `Courier New, monospace` | `Courier New, monospace` | `Courier New, monospace` |
| 15 | **Solar Dusk** | `Source Code Pro, monospace` | `Source Code Pro, monospace` | `Source Code Pro, monospace` |
| 16 | **Pastel Dreams** | `Merriweather, serif` | `Source Serif 4, serif` | `JetBrains Mono, monospace` |
| 17 | **Clean Slate** | `Inter, sans-serif` | `Georgia, serif` | `JetBrains Mono, monospace` |
| 18 | **Ocean Breeze** | `Poppins, sans-serif` | `Lora, serif` | `Fira Code, monospace` |
| 19 | **Retro Arcade** | `Architects Daughter, sans-serif` | `Georgia, serif` | `"Fira Code", "Courier New", monospace` |
| 20 | **Midnight Bloom** | `Geist, sans-serif` | `"Lora", Georgia, serif` | `"Fira Code", "Courier New", monospace` |
| 21 | **Northern Lights** | `Montserrat, sans-serif` | `Georgia, serif` | `Fira Code, monospace` |
| 22 | **Vintage Paper** | `Merriweather, serif` | `Source Serif 4, serif` | `JetBrains Mono, monospace` |
| 23 | **Sunset Horizon** | `Inter, sans-serif` | `Source Serif 4, serif` | `JetBrains Mono, monospace` |
| 24 | **Starry Night** | `Inter, sans-serif` | `Source Serif 4, serif` | `JetBrains Mono, monospace` |
| 25 | **Soft Pop** | `Plus Jakarta Sans, sans-serif` | `Lora, serif` | `IBM Plex Mono, monospace` |

---

## Key Observations

### Font Usage Patterns

**Most Common Fonts**:
- **Sans-serif**: Inter (6), Montserrat (3), Poppins (2), Geist (2), Plus Jakarta Sans (2)
- **Serif**: Georgia (7), Source Serif 4 (5), Lora (4)
- **Monospace**: Fira Code (7), JetBrains Mono (6), Menlo (2)

**Unique Combinations**:
- **Neo Brutalism** & **Solar Dusk**: Use monospace for ALL font types
- **Pastel Dreams** & **Vintage Paper**: Use serif (Merriweather) for font-sans
- **Doom 64**: Uses Oxanium (gaming font) for sans
- **Quantum Rose** & **Retro Arcade**: Use Architects Daughter (handwriting)
- **T3 Chat**: No custom fonts (uses system defaults)

---

## Additional Fields to Mirror

### Shadow Properties
Some presets include custom shadow configurations:

```typescript
// Violet Bloom example
"shadow-color": "hsl(0 0% 0%)",
"shadow-opacity": "0.16",
"shadow-blur": "3px",
"shadow-spread": "0px",
"shadow-offset-x": "0px",
"shadow-offset-y": "2px",
```

**Presets with custom shadows**:
- Violet Bloom
- Doom 64
- Kodama Grove (likely, need to verify)

### Letter Spacing
Some presets include custom letter-spacing:

```typescript
// Violet Bloom example
"letter-spacing": "-0.025em"  // Tighter spacing

// Doom 64 example
"letter-spacing": "0em"  // Normal spacing
```

### Spacing
Some presets customize spacing (padding/margin):

```typescript
// Violet Bloom example
spacing: "0.27rem"

// Most presets
spacing: "0.25rem"
```

### Radius
Each preset has unique border radius:

```typescript
// Violet Bloom
radius: "1.4rem"  // Very rounded

// Doom 64
radius: "0px"  // Sharp corners

// Most presets
radius: "0.5rem" or "0.625rem"
```

---

## Current State Analysis

### What We Have Wrong

**ALL 23 non-Default presets** currently use:
```typescript
'font-sans': DEFAULT_FONT_SANS,  // var(--font-geist-sans)
'font-serif': DEFAULT_FONT_SERIF,  // var(--font-geist-mono) ← WRONG!
'font-mono': DEFAULT_FONT_MONO,   // var(--font-geist-mono)
```

**Problems**:
1. ❌ All presets have same fonts (no variety)
2. ❌ font-serif uses mono font (copy-paste error)
3. ❌ Missing preset-specific typography
4. ⚠️ Shadow properties might be missing/incorrect
5. ⚠️ Letter-spacing might not match
6. ⚠️ Spacing might not match

---

## Implementation Plan

### Phase 1: Add Missing Presets (30 min)
1. Add **T3 Chat** preset
   - Copy complete definition from tweakcn
   - Note: No custom fonts, uses defaults
2. Add **Doom 64** preset
   - Copy complete definition from tweakcn
   - Fonts: Oxanium, ui-serif, Source Code Pro
   - Custom shadows, 0px radius

### Phase 2: Update Typography for All Presets (2 hours)

For **each of the 23 existing presets**:

1. Open tweakcn's theme-presets.ts
2. Find matching preset by name
3. Copy font-sans, font-serif, font-mono from light mode
4. Copy to BOTH light AND dark modes (if defined in dark)
5. Verify shadow-*, letter-spacing, spacing, radius match

**Systematic Updates**:
```typescript
// BEFORE (all presets)
'font-sans': DEFAULT_FONT_SANS,
'font-serif': DEFAULT_FONT_SERIF,
'font-mono': DEFAULT_FONT_MONO,

// AFTER (Modern Minimal example)
'font-sans': 'Inter, sans-serif',
'font-serif': 'Source Serif 4, serif',
'font-mono': 'JetBrains Mono, monospace',

// AFTER (Violet Bloom example)
'font-sans': 'Plus Jakarta Sans, sans-serif',
'font-serif': 'Lora, serif',
'font-mono': 'IBM Plex Mono, monospace',
// ... and so on for all 23 presets
```

### Phase 3: Create Font Utilities (45 min)

Create `src/lib/fonts/` directory with three files:

**1. index.ts** (Core utilities)
- `extractFontFamily(cssValue: string): string | null`
- `loadGoogleFont(family: string, weights: string[]): void`
- `isFontLoaded(family: string, weight: string): boolean`
- `buildFontFamily(font: string, category: string): string`

**2. google-fonts.ts** (Google Fonts API)
- `loadGoogleFont(family, weights)` - Inject `<link>` tag
- `buildFontCssUrl(family, weights)` - Build Google Fonts URL

**3. theme-fonts.ts** (Theme-specific helpers)
- Font catalog (17 curated fonts)
- `getAppliedThemeFont()` helper
- Font categorization (sans, serif, mono)

### Phase 4: Dynamic Font Loading (30 min)

Create `src/components/theme/dynamic-font-loader.tsx`:
```typescript
export function DynamicFontLoader() {
  const { themeState } = useEditorStore()

  useEffect(() => {
    const fonts = [
      themeState.styles.light["font-sans"],
      themeState.styles.light["font-serif"],
      themeState.styles.light["font-mono"],
    ]

    fonts.forEach(fontValue => {
      const family = extractFontFamily(fontValue)
      if (family) {
        loadGoogleFont(family, ["400", "500", "600", "700"])
      }
    })
  }, [themeState])

  return null
}
```

Add to `theme-provider.tsx`:
```typescript
export function UserThemeProvider({ children, initialTheme }: Props) {
  // ... existing code ...

  return (
    <>
      <DynamicFontLoader />
      {children}
    </>
  )
}
```

### Phase 5: Verification (30 min)

**Test Each Preset**:
1. Load preset in browser
2. Inspect font-family CSS variables
3. Check Network tab for Google Fonts requests
4. Verify fonts render correctly
5. Check shadow/spacing/radius values

**Automated Checks**:
```bash
# Verify no DEFAULT_FONT_* in presets (except Default preset)
grep "DEFAULT_FONT" src/components/theme/presets.ts

# Should only find 3 occurrences (Default preset's 3 fonts)
# Everything else should be custom fonts
```

---

## Expected File Changes

### Files to Modify
1. `src/components/theme/presets.ts` - Update all 23 presets + add 2 new
2. `src/components/theme/theme-provider.tsx` - Add DynamicFontLoader
3. `src/lib/fonts/index.ts` - CREATE NEW
4. `src/lib/fonts/google-fonts.ts` - CREATE NEW
5. `src/lib/fonts/theme-fonts.ts` - CREATE NEW
6. `src/components/theme/dynamic-font-loader.tsx` - CREATE NEW

### Line Count Estimate
- **Modifications**: ~1,500 lines (presets.ts)
- **New code**: ~450 lines (font utilities + loader)
- **Total**: ~1,950 lines changed

---

## Testing Checklist

- [ ] All 25 presets load without errors
- [ ] Each preset shows unique fonts (inspect DevTools)
- [ ] Google Fonts load on demand (Network tab)
- [ ] No duplicate font loads
- [ ] Fonts persist after page reload
- [ ] Shadow properties applied correctly
- [ ] Letter-spacing matches tweakcn
- [ ] Spacing matches tweakcn
- [ ] Radius matches tweakcn
- [ ] Works in light and dark modes
- [ ] No console errors
- [ ] Preset buttons show correct fonts

---

## Timeline

| Phase | Task | Effort |
|-------|------|--------|
| 1 | Add T3 Chat + Doom 64 | 30 min |
| 2 | Update typography (23 presets) | 2 hours |
| 3 | Create font utilities | 45 min |
| 4 | Dynamic font loading | 30 min |
| 5 | Testing & verification | 30 min |
| **TOTAL** | **Complete Migration** | **4-4.5 hours** |

---

## Success Criteria

✅ All 25 presets defined (23 existing + Default + T3 Chat + Doom 64)
✅ Each preset has unique, accurate fonts from tweakcn
✅ Google Fonts load dynamically when preset applied
✅ All shadow/spacing/radius properties match tweakcn
✅ No DEFAULT_FONT_* usage (except Default preset)
✅ Typography visible and correct in UI
✅ Complete field-by-field parity with tweakcn

---

## Risk Mitigation

**Risk**: Fonts not loading
- **Mitigation**: Add error handling in font loader, fallback to system fonts

**Risk**: Performance issues from many font loads
- **Mitigation**: Only load fonts for active preset, cache loaded fonts

**Risk**: Incorrect font names
- **Mitigation**: Copy exact strings from tweakcn, test each preset

**Risk**: Breaking existing functionality
- **Mitigation**: Keep Default preset unchanged, test incrementally

---

## Next Steps

**Recommended Approach**:
1. ✅ Review this plan
2. ✅ Approve implementation
3. 🔨 Create font utilities first (foundation)
4. 🔨 Add DynamicFontLoader component
5. 🔨 Update presets.ts systematically (one at a time)
6. 🔨 Add T3 Chat and Doom 64 presets
7. ✅ Test each preset after update
8. ✅ Verify complete parity
9. 🚀 Deploy to production

**Estimated Total Time**: 4-4.5 hours for complete, accurate migration.

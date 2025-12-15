# /icon-generate - Generate New Icon

You are tasked with generating a new icon for the Hogwarts icon system using AI-assisted design.

## Icon System Specifications

**Design System**: Anthropic Design Guidelines
**Categories**: Hands, People, Objects, Abstract, Letters, Scenes
**Naming Convention**: `{Category}-{Description}.svg`
**Output Directory**: `public/icons/`

## Design Requirements (CRITICAL)

1. **ViewBox**: `0 0 1000 1000` (standard) or `0 0 1680 1260` (wide format)
2. **Colors** (ONLY these two):
   - Light fill: `#FAF9F5`
   - Dark fill: `#141413`
3. **Structure**:
   - Root `<svg>` element with `fill="none"`
   - All `<path>` elements must have explicit `fill` attribute
   - No gradients, no patterns, no inline styles
4. **Style**: Minimalist, geometric, Anthropic brand aesthetic

## Generation Workflow

### 1. Gather Requirements

Ask the user:

- **Icon concept**: What should the icon represent?
- **Category**: Hands/People/Objects/Abstract/Letters/Scenes
- **Style preference**: Simple/Complex, Geometric/Organic
- **Size format**: Standard (1000x1000) or Wide (1680x1260)

### 2. Design Strategy

Choose appropriate generation method:

**Option A: Browser-based SVG Editor**

- Use browser MCP to open SVG editor (e.g., SVGator, Figma web)
- Guide user through creation process
- Export SVG with correct specifications

**Option B: Code-based Generation**

- Generate SVG paths programmatically
- Use geometric primitives (circles, rectangles, paths)
- Calculate coordinates for 1000x1000 canvas
- Assemble valid SVG structure

**Option C: Template-based**

- Start from similar existing icon
- Modify paths and shapes
- Adjust to match new concept
- Ensure compliance with design system

### 3. Generate SVG Code

Create valid SVG following this template:

```svg
<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 1000 1000" height="1000" width="1000">
<path fill="#FAF9F5" d="M..."></path>
<path fill="#141413" d="M..."></path>
</svg>
```

**Path Guidelines**:

- Use `M` (moveto), `L` (lineto), `C` (cubic bezier), `Z` (closepath)
- Keep paths clean and minimal
- Light color (#FAF9F5) for backgrounds/fills
- Dark color (#141413) for foreground/details

### 4. Validate Generated Icon

Run validation checks:

- ✅ ViewBox is `0 0 1000 1000` or `0 0 1680 1260`
- ✅ Only colors used are `#FAF9F5` and `#141413`
- ✅ Root svg has `fill="none"`
- ✅ All paths have explicit fill
- ✅ No external dependencies (fonts, images)
- ✅ Valid XML structure

### 5. Generate Semantic Name

Follow pattern: `{Category}-{Description}.svg`

Examples:

- `Hands-Gesture-06.svg`
- `Abstract-Waves-01.svg`
- `Letter-A-Modern-01.svg`

Check existing icons to avoid conflicts, use incremental numbering.

### 6. Save and Register

1. Save SVG to `public/icons/{SemanticName}.svg`
2. Add entry to `src/components/icons/registry.ts`:

```typescript
"{iconName}": {
  name: "{iconName}",
  category: "{category}",
  path: "/icons/{SemanticName}.svg",
  keywords: ["{keyword1}", "{keyword2}"],
  viewBox: "{viewBox}",
  verified: true
}
```

3. Document in `public/icons/icon-renaming-mapping.md` if needed

### 7. Preview and Iterate

- Show user the generated SVG path
- Offer to make adjustments
- Regenerate if needed

## Example Generation Session

```
User: Generate a hand waving icon
Assistant: I'll generate a hand waving icon for you.

Category: Hands
Style: Simple geometric shapes
Format: Standard 1000x1000

Let me create the SVG paths...

[Generates SVG with calculated paths for a waving hand]

Here's the generated icon saved as "Hands-Wave-01.svg":
- Compliant with Anthropic design system
- Uses only #FAF9F5 and #141413
- ViewBox: 0 0 1000 1000

Would you like me to:
1. Adjust the wave angle
2. Make it more/less detailed
3. Generate alternative version
4. Proceed to save and register
```

## Generation Tips

1. **Keep it simple**: Fewer paths = better performance
2. **Use symmetry**: Easier to calculate, looks cleaner
3. **Test readability**: Icon should be clear at small sizes
4. **Follow category style**: Match existing icons in same category
5. **Iterate**: Generate, review, refine

## Common Path Calculations

For 1000x1000 canvas:

- **Center**: (500, 500)
- **Quadrants**: (250, 250), (750, 250), (250, 750), (750, 750)
- **Margins**: Use 100px padding (100, 100) to (900, 900)
- **Circle**: radius = 400, center at (500, 500)

## Error Handling

If generation fails:

1. Validate path syntax
2. Check color values
3. Ensure viewBox is correct
4. Verify no invalid SVG attributes
5. Offer to regenerate or use template

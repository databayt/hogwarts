# /icon-add - Add New Icon to System

You are tasked with adding a new icon to the Hogwarts icon system.

## Icon System Overview

**Design System**: Anthropic Design Guidelines
**Categories**: Hands, People, Objects, Abstract, Letters, Scenes
**Naming Convention**: `{Category}-{Description}.svg`
**Output Directory**: `public/icons/`
**Registry Path**: `src/components/icons/registry.ts`

## Design Requirements

All icons must comply with:

1. **ViewBox**: `0 0 1000 1000` (standard) or `0 0 1680 1260` (wide format)
2. **Colors**:
   - Light fill: `#FAF9F5`
   - Dark fill: `#141413`
3. **Format**:
   - SVG with `fill="none"` on root element
   - All paths must have explicit `fill` attributes
   - No inline styles

## Task Workflow

### 1. Gather Requirements

Ask the user:

- Icon purpose/description
- Which category (Hands/People/Objects/Abstract/Letters/Scenes)
- Icon source (file path, URL, or AI generation)
- Preferred name (optional, you'll suggest semantic name)

### 2. Validate Icon Source

If **file path provided**:

- Use Read tool to validate SVG structure
- Check compliance with design system
- Flag any violations

If **URL provided**:

- Use WebFetch tool to retrieve icon
- Validate downloaded SVG
- Check compliance

If **AI generation requested**:

- Use browser MCP or suggest using design tools
- Guide user through generation process
- Ensure output matches design system

### 3. Process Icon

- **Validate viewBox**: Ensure `0 0 1000 1000` or `0 0 1680 1260`
- **Validate colors**: Check only `#FAF9F5` and `#141413` are used
- **Validate structure**: Confirm root has `fill="none"`, paths have fill
- **Optimize**: Remove unnecessary attributes, comments, metadata
- **Generate semantic name**: Follow `{Category}-{Description}.svg` pattern

### 4. Save Icon

Use Write tool to save to `public/icons/{SemanticName}.svg`

### 5. Update Registry

Add icon to `src/components/icons/registry.ts`:

```typescript
export const iconRegistry: IconRegistry = {
  // ... existing icons
  "{iconName}": {
    name: "{iconName}",
    category: "{category}",
    path: "/icons/{SemanticName}.svg",
    keywords: ["{keyword1}", "{keyword2}", "{keyword3}"],
    viewBox: "{viewBox}",
    verified: true,
  },
}
```

### 6. Update Documentation

Add entry to icon mapping document if needed.

## Example Usage

```
User: I want to add a new hand gesture icon
Assistant: I'll help you add a hand gesture icon. Do you have:
1. A file path to an existing SVG?
2. A URL to download from?
3. Would you like me to help generate one?

User: Here's the file path: /path/to/icon.svg
Assistant: [Uses Read tool to validate]
Assistant: I've validated the icon. It needs these adjustments:
- Change viewBox from "0 0 500 500" to "0 0 1000 1000"
- Replace color #000000 with #141413
- Add fill="none" to root svg element

I'll make these adjustments and save as "Hands-Gesture-06.svg"
[Performs adjustments, saves file, updates registry]
```

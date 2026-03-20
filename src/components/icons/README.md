## Icons — Centralized Icon System

### Overview

Comprehensive icon management system for the Hogwarts platform with categorized SVG icons, a registry with metadata, validation utilities, and theme integration via `currentColor`. All icons follow the Anthropic artifact design system with a 1000x1000 viewBox and dual-color palette.

### File Structure

```
src/components/icons/
├── index.tsx                       # Main Icons namespace export
├── registry.ts                     # Icon registry with metadata and tags
├── types.ts                        # TypeScript type definitions
├── utils.ts                        # Search, validation, statistics helpers
├── constants.ts                    # Design rules and configuration
├── components/
│   └── icon-wrapper.tsx            # Wrapper with theme support
├── categories/
│   ├── system.tsx                  # UI icons (navigation, controls)
│   ├── integrations.tsx            # Third-party logos
│   ├── apps.tsx                    # Application icons
│   ├── content.tsx                 # Content-related icons
│   ├── development.tsx             # Development tools
│   ├── productivity.tsx            # Productivity icons
│   ├── programming.tsx             # Programming language icons
│   ├── ratings.tsx                 # Rating/review icons
│   └── shapes.tsx                  # Shape primitives
├── anthropic.tsx                   # Anthropic design system icons
└── anthropic-showcase.tsx          # Anthropic showcase component
```

### Status

**Completion:** 90% | **Blockers:** None

Some categories referenced in README (academic, finance, communication, library, branding, illustrations, marketing) are planned but not yet created as separate files.

### Integration Points

- **Component Usage**: `import { Icons } from "@/components/icons"` then `<Icons.github />`
- **Registry Search**: `searchIcons(iconRegistry, { query, category })`
- **Style Guide**: ViewBox `0 0 1000 1000`, colors `#FAF9F5` / `#141413`, `currentColor` for theming
- **Public SVGs**: `public/icons/` and `public/anthropic/` for image-based usage

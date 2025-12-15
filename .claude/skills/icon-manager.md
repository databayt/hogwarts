# icon-manager - Comprehensive Icon System Management

**Description**: Complete icon management skill for the Hogwarts platform
**Version**: 1.0.0
**Categories**: Design System, Asset Management, SVG Processing

## Overview

This skill provides comprehensive icon system management capabilities including:

- Icon validation and compliance checking
- Batch icon processing and optimization
- Registry synchronization
- Design system enforcement
- Icon analysis and reporting

## Icon System Specifications

### Design System: Anthropic Guidelines

**ViewBox Formats**:

- Standard: `0 0 1000 1000`
- Wide: `0 0 1680 1260` or `0 0 1681 1261`

**Color Palette** (STRICT):

- Light: `#FAF9F5` (backgrounds, fills)
- Dark: `#141413` (foreground, details)

**Structure Requirements**:

- Root `<svg>` element with `fill="none"`
- All `<path>` elements must have explicit `fill` attribute
- No gradients, patterns, inline styles, or external references
- Valid XML structure

**Categories**:

1. **Hands**: Hand gestures, positions, interactions
2. **People**: Human figures, avatars
3. **Objects**: Physical items, shapes, documents
4. **Abstract**: Abstract forms, patterns, geometric
5. **Letters**: Typography, characters
6. **Scenes**: Complex illustrations with multiple elements

**Naming Convention**: `{Category}-{Description}.svg`

**File Structure**:

```
public/icons/              # Icon storage
  ├── .backup/            # Backup of renamed files
  ├── *.svg               # Icon files
  ├── icon-renaming-mapping.md
  └── rename-log.txt

src/components/icons/      # Icon system code
  ├── types.ts
  ├── registry.ts
  ├── icon-wrapper.tsx
  ├── utils.ts
  ├── constants.ts
  └── README.md

src/app/[lang]/docs/icons/
  └── page.mdx             # Documentation
```

## Core Capabilities

### 1. Icon Validation

**Function**: Validate icons against design system
**Triggers**:

- Manual: `/icon-validate [scope]`
- Auto: Pre-commit hook, on icon addition

**Validation Checks**:

```typescript
interface ValidationResult {
  file: string
  valid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
  metadata: {
    viewBox: string
    colors: string[]
    pathCount: number
    fileSize: number
  }
}

type ValidationError =
  | { type: "viewBox"; expected: string; found: string }
  | { type: "color"; invalid: string[]; allowed: string[] }
  | { type: "structure"; issue: string }
  | { type: "naming"; pattern: string; actual: string }
```

**Validation Workflow**:

1. Read SVG file(s) with Glob + Read tools
2. Parse XML structure
3. Check viewBox dimensions
4. Extract and validate colors
5. Verify structure (root fill, path fills)
6. Check naming convention
7. Verify registry entry exists
8. Generate validation report

**Auto-Fix Capability**:

- ViewBox scaling (proportional resize)
- Color replacement (#000000 → #141413, etc.)
- Structure fixes (add fill="none" to root)
- Naming normalization

### 2. Icon Analysis

**Function**: Analyze icon collection for insights
**Output**: Comprehensive reports

**Analysis Types**:

**A. Category Distribution**

```markdown
## Category Distribution

- Hands: 15 icons (29%)
- Scenes: 12 icons (24%)
- Letters: 8 icons (16%)
- People: 6 icons (12%)
- Abstract: 5 icons (10%)
- Objects: 2 icons (4%)
```

**B. Complexity Analysis**

```markdown
## Complexity Metrics

- Simple (1-3 paths): 12 icons
- Medium (4-8 paths): 28 icons
- Complex (9+ paths): 11 icons

Average paths per icon: 6.2
```

**C. Size Analysis**

```markdown
## File Size Distribution

- < 1KB: 5 icons
- 1-5KB: 38 icons
- 5-10KB: 8 icons
- > 10KB: 0 icons

Total: 156 KB
Average: 3.1 KB
```

**D. Compliance Report**

```markdown
## Design System Compliance

- Fully compliant: 48 icons (94%)
- Minor issues: 2 icons (4%)
- Major issues: 1 icon (2%)

Common issues:

1. Missing keywords (2 icons)
2. Color violation (1 icon)
```

### 3. Registry Management

**Function**: Synchronize icon files with registry
**Registry Path**: `src/components/icons/registry.ts`

**Registry Schema**:

```typescript
export interface IconRegistryEntry {
  name: string
  category: IconCategory
  path: string
  keywords: string[]
  viewBox: string
  verified: boolean
  dateAdded?: string
  author?: string
}

export const iconRegistry: Record<string, IconRegistryEntry> = {
  "hands-gesture-01": {
    name: "hands-gesture-01",
    category: "Hands",
    path: "/icons/Hands-Gesture-01.svg",
    keywords: ["hand", "gesture", "point", "interaction"],
    viewBox: "0 0 1000 1000",
    verified: true,
    dateAdded: "2025-11-06",
  },
}
```

**Sync Operations**:

**A. Add Missing Entries**

- Scan `public/icons/*.svg`
- Find files not in registry
- Generate registry entries (with AI-suggested keywords)
- Add to registry

**B. Remove Orphaned Entries**

- Find registry entries without corresponding files
- Flag for review
- Remove after confirmation

**C. Update Metadata**

- Re-scan existing icons
- Update viewBox, path, verified status
- Refresh keywords based on visual analysis

**D. Verify Integrity**

- Check all paths are valid
- Ensure no duplicate entries
- Validate category assignments
- Confirm all fields populated

### 4. Batch Operations

**Function**: Process multiple icons efficiently

**Supported Operations**:

**A. Batch Validation**

```bash
# Validate all icons
/icon-validate

# Validate category
/icon-validate category:Hands

# Validate recent additions (last 7 days)
/icon-validate recent:7d
```

**B. Batch Optimization**

- Remove unnecessary attributes
- Optimize path data
- Compress whitespace
- Sort attributes

**C. Batch Renaming**

- Rename based on pattern
- Update registry automatically
- Create backups
- Generate migration log

**D. Batch Export**

- Export to different formats (PNG, WebP)
- Generate icon sprite sheets
- Create icon font
- Build optimization bundles

### 5. Icon Import

**Function**: Import icons from external sources

**Supported Sources**:

- **File upload**: Local SVG files
- **URL**: Direct SVG URLs
- **Figma**: Via Figma MCP
- **Icon libraries**: Font Awesome, Heroicons, etc.

**Import Workflow**:

1. Retrieve icon (file/URL/API)
2. Validate SVG structure
3. Transform to Anthropic design system:
   - Resize to 1000x1000 viewBox
   - Replace colors with #FAF9F5/#141413
   - Add fill="none" to root
   - Ensure all paths have fill
4. Suggest semantic name
5. Assign category
6. Generate keywords
7. Save to `public/icons/`
8. Update registry

**Transformation Examples**:

```svg
<!-- Input: Generic icon -->
<svg viewBox="0 0 24 24" fill="currentColor">
  <path d="M12 2L2 7v10l10 5 10-5V7z"/>
</svg>

<!-- Output: Anthropic-compliant -->
<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 1000 1000" height="1000" width="1000">
  <path fill="#FAF9F5" d="M500 83.3L83.3 291.7v416.6l416.7 208.4 416.7-208.4V291.7z"></path>
</svg>
```

### 6. Icon Search

**Function**: Search icons by name, category, keywords

**Search Interface**:

```typescript
interface IconSearchQuery {
  query?: string // Text search
  category?: IconCategory // Filter by category
  keywords?: string[] // Match keywords
  verified?: boolean // Only verified icons
  minPaths?: number // Complexity filter
  maxPaths?: number
}

interface IconSearchResult {
  icon: IconRegistryEntry
  score: number // Relevance score 0-1
  matchedFields: string[] // Which fields matched
}
```

**Search Features**:

- Fuzzy text matching
- Category filtering
- Keyword matching
- Complexity filtering
- Relevance scoring

### 7. Icon Documentation

**Function**: Generate and maintain icon documentation

**Auto-Generated Docs**:

**A. Icon Catalog** (`docs/icons/catalog.md`)

```markdown
# Icon Catalog

## Hands (15 icons)

### Hands-Gesture-01

**Path**: `/icons/Hands-Gesture-01.svg`
**Keywords**: hand, gesture, point, interaction
**ViewBox**: 0 0 1000 1000
**File Size**: 2.4 KB
**Date Added**: 2025-11-06

[Preview Image]
```

**B. Category Index** (`docs/icons/categories/hands.md`)

- All icons in category
- Usage examples
- Design guidelines
- Common patterns

**C. API Reference** (`docs/icons/api.md`)

- Icon registry TypeScript API
- IconWrapper component props
- Utility functions
- Type definitions

### 8. Quality Metrics

**Function**: Track icon system quality over time

**Metrics Tracked**:

```typescript
interface IconQualityMetrics {
  timestamp: string
  totalIcons: number
  compliance: {
    fullyCompliant: number
    minorIssues: number
    majorIssues: number
    complianceRate: number // percentage
  }
  coverage: {
    categoryCoverage: Record<IconCategory, number>
    totalCategories: number
    averagePerCategory: number
  }
  performance: {
    averageFileSize: number
    totalSize: number
    averagePaths: number
  }
  registry: {
    totalEntries: number
    verified: number
    withKeywords: number
    orphanedEntries: number
    missingEntries: number
  }
}
```

**Metrics Dashboard**:

```markdown
## Icon System Health Dashboard

**Last Updated**: 2025-11-06 10:30:00

### Overall Health: 96% ✅

#### Compliance

- Fully compliant: 48/51 (94%)
- Minor issues: 2/51 (4%)
- Major issues: 1/51 (2%)

#### Coverage

- Total categories: 6
- Most populated: Hands (15 icons)
- Least populated: Objects (2 icons)

#### Performance

- Average file size: 3.1 KB
- Total size: 156 KB
- Average paths: 6.2

#### Registry

- Total entries: 50/51 (98%)
- Verified: 48/50 (96%)
- With keywords: 48/50 (96%)
- Orphaned: 0
- Missing: 1
```

## Usage Examples

### Example 1: Add New Icon

```
User: I have a new icon for a pointing hand gesture
Skill: I'll help you add the pointing hand icon.

1. Where is the icon?
   - File path
   - URL
   - Generate with AI

User: Here's the file path: ./hand-point.svg

Skill: [Reads file, validates]
Found issues:
- ViewBox "0 0 500 500" needs to be "0 0 1000 1000"
- Color "#000" should be "#141413"

Auto-fixing... ✅

Saving as "Hands-Point-01.svg"
Adding to registry with keywords: [hand, point, gesture, direction]

Complete! Icon ready to use.
```

### Example 2: Validate System

```
User: Check if all icons are compliant

Skill: Running full system validation...

Scanning 51 icons... ████████████████████ 100%

Results:
✅ 48 icons fully compliant (94%)
⚠️ 2 icons with warnings (4%)
❌ 1 icon with errors (2%)

Details:
- Hands-Gesture-03.svg: Missing keywords
- Abstract-Curves-01.svg: Missing keywords
- Scene-Complex-02.svg: Invalid color #000000

Would you like me to auto-fix the fixable issues?
```

### Example 3: Generate Report

```
User: Give me an icon system health report

Skill: Generating comprehensive health report...

# Icon System Health Report
Date: 2025-11-06

## Summary
- Total icons: 51
- Compliance: 96%
- Registry sync: 98%
- Average size: 3.1 KB

[Full detailed report with charts and metrics]
```

## Integration Points

### Slash Commands

- `/icon-add` → Add new icon workflow
- `/icon-generate` → Generate icon with AI
- `/icon-validate` → Run validation

### MCP Tools

- `svg-tools` → SVG optimization (SVGO)
- `figma` → Import from Figma
- `browser` → Web-based SVG editors

### Git Hooks

- **pre-commit**: Validate changed icons
- **post-add**: Auto-update registry

### Build Pipeline

- Validate icons during build
- Fail build on major violations
- Generate icon sprite sheets

## Best Practices

1. **Always validate** before committing icons
2. **Use semantic names** following the convention
3. **Add keywords** for better searchability
4. **Keep backups** before batch operations
5. **Run metrics** monthly to track quality
6. **Update registry** immediately after adding icons
7. **Document changes** in icon-renaming-mapping.md

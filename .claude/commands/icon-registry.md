# /icon-registry - Update Icon Registry with Metadata

You are tasked with managing the icon registry - the central source of metadata for all icons in the system.

## Registry Location

**File**: `src/components/icons/registry.ts`

## Registry Entry Schema

```typescript
interface IconMetadata {
  id: string // kebab-case unique identifier
  name: string // Display name
  component: IconComponent // React component reference
  category: IconCategory // Primary category
  secondaryCategories?: IconCategory[]
  tags: string[] // Search keywords
  description?: string // Usage description
  viewBox: string // SVG viewBox
  customizable: boolean // Can use className for colors
  filePath?: string // For file-based icons
  schoolId?: string // Multi-tenant specific
  createdAt?: Date
  updatedAt?: Date
  author?: string
}
```

## Modes

| Mode     | Command                     | Description                        |
| -------- | --------------------------- | ---------------------------------- |
| Sync     | `/icon-registry sync`       | Sync registry with Icons namespace |
| Add      | `/icon-registry add <name>` | Add single icon to registry        |
| Validate | `/icon-registry validate`   | Check registry completeness        |
| Export   | `/icon-registry export`     | Export registry as JSON            |

## Workflow: Sync

### Step 1: Get Icons from Namespace

Read `src/components/icons/index.tsx` to get all exported icons:

```typescript
export const Icons = {
  logo: SystemIcons.LogoIcon,
  github: IntegrationIcons.GitHubIcon,
  // ... etc
}
```

### Step 2: Get Current Registry

Read `src/components/icons/registry.ts`:

```typescript
export const iconRegistry: IconRegistry = [
  {
    id: "network-nodes",
    name: "Network Nodes",
    // ...
  },
  // ... etc
]
```

### Step 3: Find Gaps

Compare Icons namespace with registry:

- Icons in namespace but not in registry → Need to add
- Icons in registry but not in namespace → May need to remove or update

### Step 4: Generate Missing Entries

For each missing icon, generate entry:

```typescript
{
  id: "{iconId}",           // Convert camelCase to kebab-case
  name: "{Icon Name}",      // Convert to Title Case
  component: Icons.{iconKey}, // Reference from Icons namespace
  category: IconCategory.{CATEGORY},
  tags: ["{tag1}", "{tag2}"], // Infer from name and usage
  description: "{Description}",
  viewBox: "0 0 24 24",     // Or extract from SVG
  customizable: true,
}
```

### Step 5: Update Registry File

Append new entries to registry.ts.

## Category Mapping

Map icon names to categories:

| Pattern                             | Category      |
| ----------------------------------- | ------------- |
| logo, brand, anthropic\*            | BRANDING      |
| github, google, nextjs, react, etc. | INTEGRATIONS  |
| alert*, error*, warning\*           | SYSTEM        |
| calendar, clock, time\*             | SYSTEM        |
| file*, doc*, pdf                    | CONTENT       |
| hands*, category*                   | ILLUSTRATIONS |
| student*, teacher*, class\*         | ACADEMIC      |
| fee*, payment*, invoice\*           | FINANCE       |
| message*, mail*, chat\*             | COMMUNICATION |
| book*, library*                     | LIBRARY       |

## Tag Generation

Generate tags from:

1. Icon name words (split camelCase/kebab-case)
2. Category keywords
3. Common aliases
4. Use case context

Example:

```typescript
// Icon: alertCircle
tags: ["alert", "circle", "warning", "error", "notification", "danger"]

// Icon: chevronDown
tags: ["chevron", "down", "arrow", "dropdown", "expand", "navigation"]
```

## Workflow: Add Single Icon

### Step 1: Validate Icon Exists

```typescript
// Check Icons namespace
if (!Icons[iconName]) {
  throw new Error(`Icon "${iconName}" not found in Icons namespace`)
}
```

### Step 2: Generate Metadata

Prompt for or infer:

- Category
- Tags
- Description

### Step 3: Add to Registry

```typescript
iconRegistry.push({
  id: kebabCase(iconName),
  name: titleCase(iconName),
  component: Icons[iconName],
  category: IconCategory.SYSTEM,
  tags: ["generated", "tags"],
  description: "User-provided or generated description",
  viewBox: "0 0 24 24",
  customizable: true,
  createdAt: new Date(),
})
```

## Workflow: Validate

### Checks

1. **Uniqueness**: No duplicate IDs
2. **Completeness**: All Icons namespace entries have registry entries
3. **References**: All component references are valid
4. **Schema**: All required fields present
5. **Categories**: Valid IconCategory enum values

### Output

```markdown
## Registry Validation Report

**Date**: {date}

### Summary

- Total icons in namespace: 86
- Total icons in registry: 4
- Missing from registry: 82
- Invalid entries: 0

### Missing Icons

| Icon Key | Suggested Category |
| -------- | ------------------ |
| github   | INTEGRATIONS       |
| google   | INTEGRATIONS       |
| nextjs   | INTEGRATIONS       |
| ...      | ...                |

### Invalid Entries

None found.

### Recommendations

1. Run `/icon-registry sync` to add 82 missing icons
2. Review auto-generated categories
3. Add custom descriptions for key icons
```

## Registry Export

Export registry as JSON for external tools:

```json
{
  "version": "1.0.0",
  "generated": "2025-01-26T00:00:00Z",
  "count": 240,
  "icons": [
    {
      "id": "github",
      "name": "GitHub",
      "category": "integrations",
      "tags": ["github", "git", "version-control", "code"],
      "description": "GitHub logo for integration links",
      "viewBox": "0 0 24 24",
      "customizable": true
    }
  ]
}
```

## Bulk Registration Template

For adding many icons at once:

```typescript
// New icons to register
const newIcons: Partial<IconMetadata>[] = [
  {
    id: "github",
    category: IconCategory.INTEGRATIONS,
    tags: ["github", "git"],
  },
  {
    id: "google",
    category: IconCategory.INTEGRATIONS,
    tags: ["google", "auth"],
  },
  // ... more
]

// Generate full entries
newIcons.forEach((partial) => {
  const id = partial.id!
  const key = camelCase(id)

  iconRegistry.push({
    id,
    name: titleCase(id),
    component: Icons[key],
    category: partial.category!,
    tags: partial.tags || [id],
    description: partial.description || `${titleCase(id)} icon`,
    viewBox: "0 0 24 24",
    customizable: true,
    createdAt: new Date(),
  })
})
```

## Integration with Other Commands

- `/icon-add` - Calls `/icon-registry add` after adding icon
- `/icon-fetch` - Calls `/icon-registry sync` after fetching
- `/icon-migrate` - May add new icons, should sync registry
- `/icon-audit` - Reports registry gaps

## Example Usage

```
User: /icon-registry sync
```

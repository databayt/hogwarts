# /icon-fetch - Fetch Icons from External Sources

You are tasked with fetching icons from external design systems and integrating them into the Hogwarts unified icon system.

## Supported Sources

| Source      | Command                 | Description                           |
| ----------- | ----------------------- | ------------------------------------- |
| `anthropic` | `/icon-fetch anthropic` | Sync/complete Anthropic design assets |
| `education` | `/icon-fetch education` | ClickView Education-style icons       |
| `school`    | `/icon-fetch school`    | Zenda-style school operations icons   |
| `all`       | `/icon-fetch all`       | Fetch from all sources                |

## Source: Anthropic

**Location**: `/public/anthropic/`
**Existing Files**: 139 (112 SVG, 27 other)

### Task

1. Verify existing files in `/public/anthropic/`
2. Check for missing icons referenced in registry
3. Ensure all icons are properly exported in `anthropic.tsx`
4. Update `ANTHROPIC_ILLUSTRATIONS` if new files added

### Workflow

```bash
# 1. List existing files
ls public/anthropic/*.svg

# 2. Check registry references
# Look for filePath entries in registry.ts

# 3. Identify missing icons from anthropic.com
# Compare with AnthropicIcons object in anthropic.tsx

# 4. Generate React components for new icons
# Follow pattern in anthropic.tsx
```

### Anthropic Icon Categories

- **Brand**: A-large, A-small, logomark, wordmark
- **Claude**: sparkle, wordmark, for-personal, for-work
- **MCP**: protocol logos (dark/light)
- **UI**: arrows, chevrons, search, menu, close
- **Development**: terminal, code-brackets, api-vine
- **Social**: X/Twitter, LinkedIn, YouTube
- **Illustrations**: Hands-Build, Hands-Stack, Objects-Puzzle, categories 01-14

## Source: Education (ClickView-style)

**Target**: `/public/icons/education/`
**Style**: Clean, simple, education-focused

### Icons to Create/Fetch

| Icon                 | Description          | Keywords                   |
| -------------------- | -------------------- | -------------------------- |
| `classroom`          | Classroom with desks | classroom, class, room     |
| `school-building`    | School structure     | school, building, campus   |
| `district`           | Multi-school network | district, network, schools |
| `student-engagement` | Star/activity symbol | engagement, activity, star |
| `teacher-support`    | Heart/care symbol    | support, teacher, help     |
| `video-content`      | Video/media icon     | video, media, content      |
| `share`              | Share arrow          | share, distribute          |
| `learning`           | Book with lightbulb  | learning, knowledge        |

### Generation Strategy

For icons not available to fetch:

1. Use existing lucide icons as base
2. Modify to match education context
3. Ensure consistency with theme (currentColor)
4. Register in system

## Source: School (Zenda-style)

**Target**: `/public/icons/school/`
**Style**: Operations-focused, school management

### Icons to Create/Fetch

| Icon         | Description            | Keywords                      |
| ------------ | ---------------------- | ----------------------------- |
| `activities` | Sports/extracurricular | activities, sports, clubs     |
| `transport`  | Bus/transportation     | transport, bus, vehicle       |
| `uniform`    | School dress code      | uniform, clothing, dress      |
| `supplies`   | Books/materials        | supplies, books, materials    |
| `laboratory` | Science/lab equipment  | lab, science, equipment       |
| `security`   | Safety/security        | security, safety, protection  |
| `fees`       | Payment/billing        | fees, payment, money          |
| `events`     | Calendar events        | events, calendar, schedule    |
| `rewards`    | Coins/achievements     | rewards, achievements, points |
| `location`   | Map pin/location       | location, address, pin        |

## Workflow

### Step 1: Determine Source

```
User: /icon-fetch <source>
```

Parse the source argument:

- `anthropic` - Sync Anthropic assets
- `education` - Create education icons
- `school` - Create school operations icons
- `all` - Process all sources

### Step 2: Analyze Current State

For each source, check:

- Existing files in target directory
- Icons already in unified system
- Missing icons from list above

### Step 3: Generate/Fetch Icons

**For Anthropic**:

- No generation needed
- Check for any missing React component definitions
- Update exports

**For Education/School**:

- Check if equivalent exists in lucide-react
- If yes, copy SVG path and adapt
- If no, generate simple icon using standard patterns
- Save to appropriate directory

### Step 4: Create Icon Components

Add to Icons namespace:

```typescript
// icons.tsx or category file
activities: (props: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
    <path fill="currentColor" d="..." />
  </svg>
),
```

### Step 5: Register Icons

Add to registry.ts:

```typescript
{
  id: "activities",
  name: "Activities",
  component: Icons.activities,
  category: IconCategory.ACADEMIC,
  tags: ["activities", "sports", "clubs", "extracurricular"],
  description: "Sports and extracurricular activities icon",
  viewBox: "0 0 24 24",
  customizable: true,
}
```

### Step 6: Export Icons

Update index.tsx to include new icons:

```typescript
export const Icons = {
  // ... existing
  activities: SchoolIcons.ActivitiesIcon,
  transport: SchoolIcons.TransportIcon,
  // ... etc
}
```

## Lucide Icon Mapping

Many icons can be sourced from lucide-react:

| Needed Icon     | Lucide Equivalent        |
| --------------- | ------------------------ |
| classroom       | `Users` + customization  |
| school-building | `School`                 |
| activities      | `Trophy` or `Medal`      |
| transport       | `Bus`                    |
| supplies        | `BookOpen`               |
| laboratory      | `FlaskConical`           |
| security        | `Shield`                 |
| fees            | `Wallet` or `CreditCard` |
| events          | `Calendar`               |
| rewards         | `Star` or `Award`        |
| location        | `MapPin`                 |

## Output Report

After fetching, display:

```markdown
## Icon Fetch Report

**Source**: {source}
**Date**: {date}

### Summary

- Checked: {count} icons
- Added: {addedCount} new icons
- Updated: {updatedCount} existing
- Skipped: {skippedCount} (already exists)

### New Icons Added

1. activities - Sports/extracurricular icon
2. transport - Bus/transportation icon
   ...

### Files Created

- public/icons/school/activities.svg
- public/icons/school/transport.svg
  ...

### Registry Updated

- Added {count} entries to registry.ts

### Next Steps

- Run `/icon-validate` to verify compliance
- Test icons in UI: `<Icons.activities className="size-5" />`
```

## Example Usage

```
User: /icon-fetch school
Assistant: Fetching school operations icons...

Analyzing current state:
- Target directory: public/icons/school/
- Existing icons: 0
- Icons to create: 10

Mapping lucide equivalents:
- activities → Trophy (customized)
- transport → Bus
- uniform → (custom generation)
...

Creating icons...
[Progress indicator]

Created 10 school icons:
✅ activities (from Trophy)
✅ transport (from Bus)
✅ uniform (custom)
✅ supplies (from BookOpen)
✅ laboratory (from FlaskConical)
✅ security (from Shield)
✅ fees (from Wallet)
✅ events (from Calendar)
✅ rewards (from Award)
✅ location (from MapPin)

Updating Icons namespace... Done
Updating registry... Done

Run `/icon-validate` to verify compliance.
```

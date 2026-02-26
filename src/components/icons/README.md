# Icon System

Comprehensive icon management system for the Hogwarts platform with 240+ icons, automated workflows, and SVG Maker MCP integration.

## 📁 Directory Structure

```
src/components/icons/
├── index.ts                      # Main export (Icons namespace)
├── registry.ts                   # Icon registry with metadata
├── types.ts                      # TypeScript type definitions
├── utils.ts                      # Helper functions
├── constants.ts                  # Design rules and configuration
├── components/                   # Reusable components
│   ├── icon-wrapper.tsx         # Wrapper with theme support
│   ├── icon-preview.tsx         # Preview card component
│   └── icon-grid.tsx            # Grid display
├── categories/                   # Category-based organization
│   ├── system.tsx               # UI icons (buttons, navigation)
│   ├── integrations.tsx         # Company logos
│   ├── academic.tsx             # School-specific features
│   ├── finance.tsx              # Financial icons
│   ├── communication.tsx        # Messaging, notifications
│   ├── library.tsx              # Library management
│   ├── branding.tsx             # School branding
│   ├── illustrations.tsx        # Complex graphics
│   └── marketing.tsx            # Landing pages
└── README.md                     # This file
```

## 🎯 Usage

### Basic Usage

```tsx
import { Icons } from "@/components/icons"

// Using namespace pattern (recommended)
<Icons.github className="w-6 h-6" />

// With size prop
<Icons.github size="lg" />

// With theme colors
<Icons.github className="text-primary" />

// With loading state
<Icons.github loading />
```

### Individual Imports (Tree-Shaking)

```tsx
import { GithubIcon } from "@/components/icons"

;<GithubIcon className="h-6 w-6" />
```

### Dynamic Icons

```tsx
import { Icon } from "@/components/icons"

// Load icon by ID

;<Icon name="github" className="h-6 w-6" />
```

## 📚 Design System

All icons follow the **Anthropic artifact design system**:

### Style Guide Rules

- **ViewBox**: `0 0 1000 1000` (square aspect ratio)
- **Colors**: Dual-color system
  - Light: `#FAF9F5` (cream/off-white)
  - Dark: `#141413` (near-black)
- **Style**: Minimalist, flat, no gradients
- **File Size**: Under 25KB
- **Theme**: Uses `currentColor` for theme integration

### Validation

Icons are validated against the style guide:

```typescript
import { validateIcon } from "@/components/icons/utils"

const result = validateIcon(svgString)
if (!result.valid) {
  console.error("Validation errors:", result.errors)
}
```

## 🏗️ Adding Icons

### Method 1: Automated with `/icon-add` Command

```bash
# From web download
/icon-add github ~/Downloads/github-icon.svg

# Automatic workflow:
# 1. Validate against style guide
# 2. Optimize SVG
# 3. Generate TypeScript component
# 4. Update registry
# 5. Display preview
```

### Method 2: Generate with SVG Maker

```bash
# Generate new icon
/icon-generate "student attendance present icon, checkmark, minimalist"

# Automatic workflow:
# 1. Call SVG Maker MCP API
# 2. Validate generated icon
# 3. Save to appropriate category
# 4. Generate component + registry entry
```

### Method 3: Manual Addition

1. **Prepare SVG**:
   - Ensure viewBox is `0 0 1000 1000`
   - Use only `#FAF9F5` and `#141413` colors
   - Remove unnecessary attributes
   - No gradients or scripts

2. **Save File**:

   ```bash
   public/icons/{category}/{name}.svg
   ```

3. **Create Component** (`categories/{category}.tsx`):

   ```typescript
   export const MyIcon = (props: IconProps) => (
     <svg
       xmlns="http://www.w3.org/2000/svg"
       viewBox="0 0 1000 1000"
       fill="none"
       {...props}
     >
       <path fill="currentColor" d="..." />
     </svg>
   )
   ```

4. **Register Icon** (`registry.ts`):

   ```typescript
   {
     id: "my-icon",
     name: "My Icon",
     component: MyIcon,
     category: IconCategory.SYSTEM,
     tags: ["example", "demo"],
     description: "Example icon",
     viewBox: "0 0 1000 1000",
     customizable: true,
   }
   ```

5. **Export** (`index.ts`):
   ```typescript
   export { MyIcon } from "./categories/system"
   ```

## 📦 Categories

### System (UI Icons)

Core interface icons for buttons, navigation, and controls.

**Examples**: close, menu, search, chevron, check, trash, edit, settings

### Academic (School Features)

Education-specific icons for academic features.

**Examples**: attendance, grades, exams, assignments, timetable, classes

### Finance (Financial Operations)

Icons for billing, payments, and financial management.

**Examples**: invoice, receipt, payment, fees, salary, expenses, budget

### Communication (Messaging)

Icons for messaging and notifications.

**Examples**: message, notification, email, chat, announcement, alert

### Library (Resources)

Icons for library and resource management.

**Examples**: book, library, borrow, return, catalog, materials

### Integrations (Logos)

Third-party service and technology logos.

**Examples**: github, stripe, google, vercel, nextjs, react, tailwind

### Branding (School Identity)

School logos, certificates, and branded assets.

**Examples**: school-logo, certificate, seal, badge, award, letterhead

### Illustrations (Graphics)

Decorative illustrations and complex graphics.

**Examples**: hand-build, puzzle, artifact, frame, concept

### Marketing (Landing Pages)

Marketing and landing page graphics.

**Examples**: hero, feature, testimonial, banner, promo

### Anthropic (Design System)

Icons from Anthropic's design system, used for core values and marketing sections.

**Tag**: `anthropic`

**Available Icons**:
| ID | Name | Usage | File Path |
|----|------|-------|-----------|
| `network-nodes` | Network Nodes | Courage - interconnected circles | `/anthropic/claude-code-best-practices.svg` |
| `growth-flourish` | Growth Flourish | Wisdom - organic flourishing figure | `/anthropic/category-06.svg` |
| `frame-boundary` | Frame Boundary | Loyalty - rounded rectangle frame | `/anthropic/think-tool.svg` |
| `reaching-ascent` | Reaching Ascent | Ambition - figure reaching upward | `/anthropic/category-03.svg` |

**Usage**:

```tsx
import Image from "next/image"

// Use as Image component (recommended for SVG files in public/)

;<Image
  src="/anthropic/claude-code-best-practices.svg"
  alt="Network Nodes"
  width={32}
  height={32}
  className="dark:invert"
/>
```

**Style Notes**:

- ViewBox varies: `0 0 1000 1000` or `0 0 1200 1200`
- Colors: `#FAF9F5` (light) and `#141413` (dark) or single `black`
- Use `dark:invert` class for theme support

## 🔍 Searching Icons

Browse icons at `/docs/icons` or use the search utilities:

```typescript
import { iconRegistry } from "@/components/icons/registry"
import { searchIcons } from "@/components/icons/utils"

const results = searchIcons(iconRegistry, {
  query: "github",
  category: IconCategory.INTEGRATIONS,
  customizableOnly: true,
  sortBy: "name",
})
```

## 🎨 Customization

### Theme Colors

Icons use `currentColor` by default, inheriting the text color:

```tsx
<Icons.github className="text-primary" />
<Icons.github className="text-destructive" />
<Icons.github className="text-muted-foreground" />
```

### Sizes

Use Tailwind size classes or the `size` prop:

```tsx
{/* Tailwind */}
<Icons.github className="w-4 h-4" />
<Icons.github className="w-6 h-6" />
<Icons.github className="w-8 h-8" />

{/* Size prop */}
<Icons.github size="sm" />
<Icons.github size="md" />
<Icons.github size="lg" />
```

### Custom Colors

For icons that don't use `currentColor`:

```tsx
<Icons.claude className="[&_path]:fill-purple-500" />
```

## 🔒 Security

All icons are sanitized for security:

- Script tags removed
- Event handlers stripped
- External references blocked
- Forbidden elements removed

## 🚀 Performance

- **Tree-shaking**: Only used icons in bundle
- **Lazy loading**: Icons load on-demand
- **Optimized SVG**: Minimal file sizes
- **No external dependencies**: Pure TypeScript/React

## 📊 Statistics

Get icon statistics:

```typescript
import { getIconStatistics } from "@/components/icons/utils"

const stats = getIconStatistics(iconRegistry)
console.log(`Total icons: ${stats.total}`)
console.log(`By category:`, stats.byCategory)
```

## 🛠️ Development

### Run Tests

```bash
pnpm test src/components/icons/**/*.test.ts
```

### Validate All Icons

```bash
/icon-validate --all
```

### Generate Icon Set

```bash
# Generate 20 academic icons
/icon-generate --batch academic 20
```

## 📝 Contributing

1. Follow the Anthropic style guide
2. Use automated workflows (`/icon-add`, `/icon-generate`)
3. Test in both light and dark themes
4. Add meaningful tags for searchability
5. Document usage in icon description

## 🔗 Links

- [Icon Browser](/docs/icons) - Searchable icon gallery
- [Design Guide](/docs/typography) - Typography and design system
- [CLAUDE.md](../../CLAUDE.md) - Development guidelines

## 📄 License

SSPL-1.0 - Icons from Anthropic artifacts and custom-generated icons.

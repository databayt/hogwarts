# Stream (LMS) Module - Required Packages

This document lists all npm packages required for the Stream (LMS) module to function properly.

## Installation Command

To install all required packages at once:

```bash
pnpm install @tiptap/react @tiptap/starter-kit @tiptap/extension-text-align @tiptap/html @tiptap/pm @aws-sdk/client-s3 @aws-sdk/s3-request-presigner @dnd-kit/core @dnd-kit/modifiers @dnd-kit/sortable @dnd-kit/utilities canvas-confetti recharts slugify stripe @arcjet/next @arcjet/ip @arcjet/inspect html-react-parser react-dropzone
```

---

## Core Dependencies

### Rich Text Editor
Used for course descriptions and lesson content.

```json
{
  "@tiptap/react": "^2.14.0",
  "@tiptap/starter-kit": "^2.14.0",
  "@tiptap/extension-text-align": "^2.14.0",
  "@tiptap/html": "^2.22.3",
  "@tiptap/pm": "^2.14.0",
  "html-react-parser": "^5.2.5"
}
```

**Purpose**: WYSIWYG editor for creating and editing course content with rich formatting (bold, italic, lists, headings, etc.)

---

### File Upload & Storage
AWS S3-compatible storage for course images and videos.

```json
{
  "@aws-sdk/client-s3": "^3.828.0",
  "@aws-sdk/s3-request-presigner": "^3.828.0",
  "react-dropzone": "^14.3.8"
}
```

**Purpose**:
- `@aws-sdk/client-s3`: S3 client for uploading/downloading files
- `@aws-sdk/s3-request-presigner`: Generate presigned URLs for secure uploads
- `react-dropzone`: Drag-and-drop file upload interface

**Storage Providers Supported**:
- AWS S3
- Tigris (Fly.io)
- Cloudflare R2
- Any S3-compatible service

---

### Payment Processing
Stripe integration for course enrollment payments.

```json
{
  "stripe": "^18.2.1"
}
```

**Purpose**:
- Create payment sessions
- Handle webhooks
- Process refunds
- Manage subscriptions (if needed)

---

### Drag & Drop
For organizing chapters and lessons in course structure.

```json
{
  "@dnd-kit/core": "^6.3.1",
  "@dnd-kit/modifiers": "^9.0.0",
  "@dnd-kit/sortable": "^10.0.0",
  "@dnd-kit/utilities": "^3.2.2"
}
```

**Purpose**: Allows instructors to drag and reorder chapters/lessons in the course builder.

---

### Analytics & Charts
For admin dashboard statistics.

```json
{
  "recharts": "^2.15.3"
}
```

**Purpose**: Display enrollment trends, revenue charts, and course analytics.

---

### Security & Rate Limiting
Protect API routes from abuse.

```json
{
  "@arcjet/next": "1.0.0-beta.8",
  "@arcjet/ip": "1.0.0-beta.8",
  "@arcjet/inspect": "1.0.0-beta.8"
}
```

**Purpose**:
- Rate limiting on course creation
- Bot detection
- IP-based access control

---

### Utilities

```json
{
  "slugify": "^1.6.6",
  "canvas-confetti": "^1.9.3"
}
```

**Purpose**:
- `slugify`: Generate URL-friendly slugs from course titles
- `canvas-confetti`: Celebration animation when course is created

---

## Packages Already in Your Project

These packages are likely already installed if you're using shadcn/ui and Next.js:

### UI Components
```json
{
  "@radix-ui/react-alert-dialog": "^1.1.14",
  "@radix-ui/react-avatar": "^1.1.10",
  "@radix-ui/react-checkbox": "^1.3.2",
  "@radix-ui/react-collapsible": "^1.1.11",
  "@radix-ui/react-dialog": "^1.1.14",
  "@radix-ui/react-dropdown-menu": "^2.1.15",
  "@radix-ui/react-label": "^2.1.7",
  "@radix-ui/react-progress": "^1.1.7",
  "@radix-ui/react-select": "^2.2.5",
  "@radix-ui/react-separator": "^1.1.7",
  "@radix-ui/react-slot": "^1.2.3",
  "@radix-ui/react-tabs": "^1.1.12",
  "@radix-ui/react-toggle": "^1.1.9",
  "@radix-ui/react-toggle-group": "^1.1.10",
  "@radix-ui/react-tooltip": "^1.2.7"
}
```

### Form Handling
```json
{
  "react-hook-form": "^7.56.4",
  "@hookform/resolvers": "^5.0.1",
  "zod": "^3.25.46"
}
```

### Styling
```json
{
  "tailwindcss": "^4",
  "tailwind-merge": "^3.3.0",
  "class-variance-authority": "^0.7.1",
  "clsx": "^2.1.1"
}
```

### Icons
```json
{
  "lucide-react": "^0.511.0",
  "@tabler/icons-react": "^3.34.0"
}
```

### Notifications
```json
{
  "sonner": "^2.0.4"
}
```

---

## Dev Dependencies

These are already in your project but listed here for reference:

```json
{
  "@types/canvas-confetti": "^1.9.0",
  "@types/node": "^20",
  "@types/react": "^19",
  "@types/react-dom": "^19",
  "prisma": "^6.8.2",
  "typescript": "^5"
}
```

---

## Optional Packages

These enhance the experience but aren't strictly required:

### Email Notifications
```json
{
  "resend": "^4.5.2"
}
```
**Purpose**: Send enrollment confirmations, course updates, completion certificates

### Internationalization
```json
{
  "negotiator": "^0.6.3",
  "@formatjs/intl-localematcher": "^0.5.4"
}
```
**Purpose**: Multi-language support for course content

---

## Package Purpose Summary

| Category | Packages | Purpose |
|----------|----------|---------|
| **Core** | Next.js, React, Prisma | Framework & Database |
| **Auth** | AuthJS/NextAuth | User authentication |
| **Content** | Tiptap, HTML Parser | Rich text editing |
| **Storage** | AWS SDK | File uploads (images/videos) |
| **Payments** | Stripe | Course enrollment payments |
| **UI** | Radix UI, shadcn/ui | Component library |
| **Forms** | React Hook Form, Zod | Form handling & validation |
| **Drag & Drop** | DND Kit | Course structure organization |
| **Analytics** | Recharts | Admin dashboard charts |
| **Security** | Arcjet | Rate limiting & bot protection |
| **Utils** | Slugify, Confetti | URL slugs & celebrations |

---

## Dependency Tree

```
Stream Module
├── Course Management
│   ├── @tiptap/* (rich text editing)
│   ├── @aws-sdk/* (file storage)
│   ├── @dnd-kit/* (drag & drop)
│   └── slugify (URL generation)
│
├── Enrollment System
│   ├── stripe (payments)
│   └── @arcjet/* (rate limiting)
│
├── Student Dashboard
│   ├── recharts (progress charts)
│   └── canvas-confetti (celebrations)
│
└── Shared
    ├── react-hook-form + zod (forms)
    ├── @radix-ui/* (UI primitives)
    ├── lucide-react (icons)
    └── sonner (notifications)
```

---

## Installation Steps

### Step 1: Install Core Stream Dependencies

```bash
pnpm install @tiptap/react @tiptap/starter-kit @tiptap/extension-text-align @tiptap/html @tiptap/pm
```

### Step 2: Install File Storage

```bash
pnpm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner react-dropzone
```

### Step 3: Install Payment Processing

```bash
pnpm install stripe
```

### Step 4: Install Drag & Drop

```bash
pnpm install @dnd-kit/core @dnd-kit/modifiers @dnd-kit/sortable @dnd-kit/utilities
```

### Step 5: Install Analytics & Charts

```bash
pnpm install recharts
```

### Step 6: Install Security

```bash
pnpm install @arcjet/next @arcjet/ip @arcjet/inspect
```

### Step 7: Install Utilities

```bash
pnpm install slugify canvas-confetti html-react-parser
```

### Step 8: Install Dev Dependencies (if missing)

```bash
pnpm install -D @types/canvas-confetti
```

---

## Verification

After installation, verify all packages are installed:

```bash
pnpm list @tiptap/react @aws-sdk/client-s3 stripe @dnd-kit/core recharts @arcjet/next
```

You should see version numbers for all packages without errors.

---

## Package Size Impact

Estimated bundle size impact of Stream module:

| Package | Size (gzipped) |
|---------|----------------|
| Tiptap | ~80 KB |
| AWS SDK | ~120 KB (tree-shakeable) |
| Stripe | ~15 KB (server-side) |
| DND Kit | ~30 KB |
| Recharts | ~90 KB |
| Arcjet | ~25 KB |
| Total | **~360 KB** |

**Note**: Most packages are lazy-loaded or only used in admin panels, minimizing impact on student-facing pages.

---

## Troubleshooting

### Issue: Package Installation Fails

**Solution**:
```bash
# Clear pnpm cache
pnpm store prune

# Remove node_modules and lockfile
rm -rf node_modules pnpm-lock.yaml

# Reinstall
pnpm install
```

### Issue: Type Errors After Installation

**Solution**:
```bash
# Regenerate types
pnpm prisma generate

# Restart TypeScript server in VS Code
# CMD/CTRL + Shift + P → "TypeScript: Restart TS Server"
```

### Issue: Peer Dependency Warnings

**Solution**:
Most peer dependency warnings can be ignored. If you see critical errors, use:
```bash
pnpm install --legacy-peer-deps
```

---

## Keeping Packages Updated

To update Stream module packages:

```bash
# Check for updates
pnpm outdated

# Update all to latest compatible versions
pnpm update

# Update specific package
pnpm update @tiptap/react
```

---

## Package Alternatives

If you prefer different packages, here are alternatives:

| Current Package | Alternative | Notes |
|----------------|-------------|-------|
| Tiptap | Lexical, Slate | Tiptap is most battle-tested |
| AWS SDK | Uploadthing | Simpler but less flexible |
| Stripe | Lemonsqueezy | If Stripe not available in region |
| Recharts | Chart.js, Victory | Similar features |
| DND Kit | React Beautiful DND | DND Kit is more modern |

---

## License Considerations

All packages used are MIT or similar permissive licenses. No GPL or restrictive licenses.

**Commercial Use**: ✅ All packages allow commercial use
**Attribution Required**: ❌ None require attribution
**Open Source**: ✅ All are open source

---

**Last Updated**: January 2025
**Total Dependencies**: 30+ (Stream-specific)
**Bundle Size**: ~360 KB (gzipped)

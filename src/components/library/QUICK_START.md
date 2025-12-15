# Library Management System - Quick Start Guide

## 🚀 3-Step Integration

### Step 1: Copy Folders (2 minutes)

From the `library` directory, copy these folders to your Hogwarts project:

```bash
# Navigate to library directory
cd D:\repo\library

# Copy app routes
cp -r app-refactored/library ../hogwarts/src/app/[lang]/

# Copy components
cp -r components-refactored/library ../hogwarts/src/components/

# Copy Prisma schema
cp database/library.prisma ../hogwarts/prisma/models/
```

### Step 2: Install & Setup (5 minutes)

```bash
# Navigate to Hogwarts project
cd ../hogwarts

# Install new dependencies
pnpm install react-colorful sonner

# Generate Prisma client
pnpm prisma generate

# Push schema to database
pnpm prisma db push

# Verify it worked
pnpm prisma studio
```

### Step 3: Configure Tenant Context (10 minutes)

Open these files and replace `"placeholder-school-id"` with your tenant context:

1. `src/components/library/content.tsx` (line 10)
2. `src/components/library/book-detail/content.tsx` (line 11)
3. `src/components/library/my-profile/content.tsx` (line 10)
4. `src/components/library/admin/content.tsx` (line 9)
5. `src/components/library/admin/books/content.tsx` (line 9)
6. `src/components/library/admin/books/book-form.tsx` (line 60)

**Replace this:**

```typescript
const schoolId = "placeholder-school-id"
```

**With this (example - adjust to your implementation):**

```typescript
const schoolId = session?.user?.schoolId as string
```

## ✅ That's It!

Your library is now integrated. Visit:

- `/library` - Browse books
- `/library/my-profile` - View borrowed books
- `/library/admin` - Manage library (admin only)

## 📖 Full Documentation

For detailed setup including:

- i18n configuration
- File upload implementation
- Middleware setup
- Permissions & roles
- Styling integration
- Testing checklist

See: `components-refactored/library/README.md`

## 🆘 Quick Troubleshooting

**Error: Cannot find module '@/lib/db'**
→ Your Prisma client might be at a different path. Update imports in library components.

**Error: schoolId is undefined**
→ You need to implement tenant context. See Step 3 above.

**Books not showing**
→ Seed some books first. See README.md "Migration & Seeding" section.

**Styles look broken**
→ Add library styles to your CSS. See README.md "Styling Integration" section.

---

**Time to integrate:** ~15-20 minutes
**Time to production:** ~2-4 hours (including i18n, styling, testing)

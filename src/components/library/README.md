# Library Management System - Integration Guide

This library management system is designed to be integrated into your Hogwarts multi-tenant school management SaaS project. It follows the mirror-pattern architecture and component-driven modularity principles.

## 📁 Folder Structure

```
library/
├── app-refactored/library/          → Copy to: hogwarts/src/app/[lang]/library/
├── components-refactored/library/   → Copy to: hogwarts/src/components/library/
└── database/library.prisma          → Merge into: hogwarts/prisma/models/library.prisma
```

## 📦 Required Packages

Add these dependencies to your `package.json` if not already present:

```json
{
  "dependencies": {
    "react-colorful": "^5.6.1",
    "sonner": "^2.0.6"
  }
}
```

**Note:** Most dependencies (React Hook Form, Zod, Radix UI, etc.) should already be present in your Hogwarts project.

## 🔧 Installation Steps

### Step 1: Copy Folders

```bash
# From the library directory, copy the two main folders:
cp -r app-refactored/library ../hogwarts/src/app/[lang]/
cp -r components-refactored/library ../hogwarts/src/components/
```

### Step 2: Integrate Prisma Schema

Copy the content from `database/library.prisma` into your `hogwarts/prisma/models/library.prisma`:

```bash
cp database/library.prisma ../hogwarts/prisma/models/
```

**Important Notes:**
- The schema includes `Book` and `BorrowRecord` models with multi-tenant support via `schoolId`
- It extends the `User` and `School` models with library relations
- Review and adjust field names if your existing models differ
- The schema uses `@relation` with `onDelete: Cascade` for data integrity

After copying, run:

```bash
cd ../hogwarts
pnpm prisma generate
pnpm prisma db push
```

### Step 3: Install Additional Packages

```bash
cd ../hogwarts
pnpm install react-colorful sonner
```

### Step 4: Environment Variables

Add these to your `.env` file (if using file upload services):

```env
# ImageKit (Optional - for book covers and videos)
NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY=your_public_key
IMAGEKIT_PRIVATE_KEY=your_private_key
IMAGEKIT_URL_ENDPOINT=your_url_endpoint

# Or use your existing file upload service
# The file upload component is a placeholder - replace with your implementation
```

## 🔗 Integration Checklist

### 1. Database Schema ✅
- [ ] Copy `library.prisma` to `hogwarts/prisma/models/`
- [ ] Review model relations with existing `User` and `School` models
- [ ] Adjust `User` model extensions if fields already exist:
  - `universityId`, `universityCard`, `libraryStatus`, `lastActivityDate`
- [ ] Run `prisma generate && prisma db push`

### 2. Authentication Integration 🔐
- [ ] Verify `@/auth` import works (uses your existing NextAuth setup)
- [ ] Add role-based access control for admin routes
- [ ] Update middleware to handle `/library/*` routes

**Middleware Update** (`src/middleware.ts`):
```typescript
// Add library routes to public or protected routes
const libraryRoutes = [
  '/library',
  '/library/books/*',
  '/library/my-profile',
];

const adminLibraryRoutes = [
  '/library/admin',
  '/library/admin/books',
  '/library/admin/books/new',
];
```

### 3. Tenant Context Integration 🏫

**Critical:** Replace all `"placeholder-school-id"` instances with actual tenant context.

Files to update:
- `components/library/content.tsx` (line 10)
- `components/library/book-detail/content.tsx` (line 11)
- `components/library/my-profile/content.tsx` (line 10)
- `components/library/admin/content.tsx` (line 9)
- `components/library/admin/books/content.tsx` (line 9)
- `components/library/admin/books/book-form.tsx` (line 60)

**Example using your tenant context:**
```typescript
// Before
const schoolId = "placeholder-school-id";

// After (adjust based on your implementation)
import { getSchoolIdFromSession } from "@/lib/tenant-context";
const schoolId = await getSchoolIdFromSession();

// Or if you have it in session
const session = await auth();
const schoolId = session?.user?.schoolId;
```

### 4. File Upload Integration 📤

The file upload component (`components/library/admin/books/file-upload.tsx`) is a **placeholder**.

**Options:**
1. **ImageKit** (current library uses this)
   - Create `/api/library/upload` endpoint
   - Use ImageKit SDK

2. **Your existing upload system**
   - Replace the `FileUpload` component with your existing implementation
   - Update `BookForm` to use your upload component

3. **Cloudinary / AWS S3**
   - Implement your preferred service

**Example API Route** (ImageKit):
```typescript
// app/api/library/upload/route.ts
import ImageKit from "imagekit";

const imagekit = new ImageKit({
  publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY!,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT!,
});

export async function POST(req: Request) {
  // Implementation here
}
```

### 5. Internationalization (i18n) 🌍

Create dictionary files for library content:

**`src/components/internationalization/dictionaries/en/library.json`:**
```json
{
  "library": {
    "title": "Library",
    "description": "Browse and borrow books",
    "noBooks": "No books available",
    "borrow": "Borrow Book",
    "return": "Return Book",
    "myProfile": "My Library Profile",
    "admin": {
      "title": "Library Admin",
      "addBook": "Add New Book",
      "allBooks": "All Books",
      "totalBooks": "Total Books",
      "activeBorrows": "Active Borrows",
      "overdueBooks": "Overdue Books"
    }
  }
}
```

**`src/components/internationalization/dictionaries/ar/library.json`:**
```json
{
  "library": {
    "title": "المكتبة",
    "description": "تصفح واستعارة الكتب",
    "noBooks": "لا توجد كتب متاحة",
    "borrow": "استعارة الكتاب",
    "return": "إرجاع الكتاب",
    "myProfile": "ملفي في المكتبة",
    "admin": {
      "title": "إدارة المكتبة",
      "addBook": "إضافة كتاب جديد",
      "allBooks": "جميع الكتب",
      "totalBooks": "إجمالي الكتب",
      "activeBorrows": "الاستعارات النشطة",
      "overdueBooks": "الكتب المتأخرة"
    }
  }
}
```

**Update pages to use dictionaries:**
```typescript
// app/[lang]/library/page.tsx
import { getDictionary } from "@/components/internationalization/dictionaries";
import { type Locale } from "@/components/internationalization/config";

interface Props {
  params: Promise<{ lang: Locale }>;
}

export default async function Library({ params }: Props) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);
  const session = await auth();

  return (
    <LibraryContent
      userId={session?.user?.id as string}
      dictionary={dictionary.library}
      lang={lang}
    />
  );
}
```

### 6. Styling Integration 🎨

The library uses custom CSS classes. Add these to your stylesheets:

**Option A:** Create `src/styles/library.css`:
```css
/* Book Cards */
.book-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
}

.book-card {
  border-radius: 0.5rem;
  overflow: hidden;
  transition: transform 0.2s;
}

.book-card:hover {
  transform: translateY(-4px);
}

/* Admin Dashboard */
.library-admin-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
}

.library-admin-stat-card {
  padding: 1.5rem;
  border-radius: 0.5rem;
  background: white;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

/* More styles... */
```

**Option B:** Use Tailwind utility classes (recommended)
- Review components and replace custom classes with Tailwind utilities
- Update the existing class names to match your design system

### 7. Fonts (Optional) 📝

The original library uses custom fonts:
- **IBM Plex Sans** (body text)
- **Bebas Neue** (headings)

If you want to maintain the original look:

```typescript
// app/layout.tsx or library layout
import localFont from "next/font/local";

const bebasNeue = localFont({
  src: "/fonts/BebasNeue-Regular.ttf",
  variable: "--font-bebas-neue",
});
```

Or use your existing font setup - the library will adapt.

### 8. Navigation Integration 🧭

Add library links to your navigation:

**Main Navigation:**
```typescript
const mainNavItems = [
  // ... existing items
  {
    title: "Library",
    href: "/library",
    icon: BookOpen,
  },
];
```

**User Menu:**
```typescript
const userMenuItems = [
  // ... existing items
  {
    title: "My Library",
    href: "/library/my-profile",
    icon: BookMarked,
  },
];
```

**Admin Sidebar:**
```typescript
const adminMenuItems = [
  // ... existing items
  {
    title: "Library",
    icon: Library,
    children: [
      { title: "Dashboard", href: "/library/admin" },
      { title: "All Books", href: "/library/admin/books" },
      { title: "Add Book", href: "/library/admin/books/new" },
    ],
  },
];
```

### 9. Permissions & Roles 🔒

Add library-specific permissions:

```typescript
// lib/permissions.ts or equivalent
export const LibraryPermissions = {
  VIEW_BOOKS: "library:view",
  BORROW_BOOKS: "library:borrow",
  ADMIN_BOOKS: "library:admin",
  MANAGE_BORROWS: "library:manage_borrows",
};

// Protect admin routes
export function canAccessLibraryAdmin(user: User) {
  return user.role === "ADMIN" || user.role === "LIBRARIAN";
}
```

**Update admin pages:**
```typescript
// app/[lang]/library/admin/page.tsx
import { canAccessLibraryAdmin } from "@/lib/permissions";

export default async function LibraryAdmin() {
  const session = await auth();

  if (!session?.user || !canAccessLibraryAdmin(session.user)) {
    redirect("/library");
  }

  // ... rest of component
}
```

### 10. Testing Checklist ✅

- [ ] User can view books at `/library`
- [ ] User can view book details at `/library/books/[id]`
- [ ] User can borrow a book (check DB for borrow record)
- [ ] User can return a book
- [ ] Book availability updates correctly
- [ ] User can view borrowed books at `/library/my-profile`
- [ ] Admin can access `/library/admin`
- [ ] Admin can create a new book
- [ ] Admin can delete a book (without active borrows)
- [ ] Overdue books are marked correctly
- [ ] Multi-tenancy works (each school sees only their books)
- [ ] i18n works for both English and Arabic

## 📚 Usage Examples

### Borrowing a Book
```typescript
import { borrowBook } from "@/components/library/actions";

const result = await borrowBook({
  bookId: "book-id",
  userId: session.user.id,
  schoolId: schoolId,
});

if (result.success) {
  toast.success(result.message);
}
```

### Creating a Book (Admin)
```typescript
import { createBook } from "@/components/library/actions";

const result = await createBook({
  title: "The Great Gatsby",
  author: "F. Scott Fitzgerald",
  genre: "Fiction",
  rating: 4.5,
  coverUrl: "https://...",
  coverColor: "#F4E8D8",
  description: "...",
  totalCopies: 5,
  summary: "...",
  schoolId: schoolId,
});
```

## 🔄 Migration & Seeding

Create a seed file to populate initial books:

```typescript
// prisma/generator/seed-library.ts
import { db } from "@/lib/db";

export async function seedLibrary(schoolId: string) {
  const books = [
    {
      title: "1984",
      author: "George Orwell",
      genre: "Fiction",
      rating: 5,
      // ... more fields
    },
    // ... more books
  ];

  await db.book.createMany({
    data: books.map(book => ({
      ...book,
      schoolId,
    })),
  });
}
```

## 🐛 Troubleshooting

### Issue: "Cannot find module '@/lib/db'"
**Solution:** Ensure your `lib/db.ts` exports the Prisma client correctly:
```typescript
// lib/db.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const db = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
```

### Issue: "Prisma model not found"
**Solution:** Run `pnpm prisma generate` after adding library.prisma

### Issue: "schoolId is undefined"
**Solution:** Implement tenant context properly. See Step 3 above.

### Issue: File upload not working
**Solution:** Implement your file upload logic in `file-upload.tsx`. See Step 4.

### Issue: Styles not applying
**Solution:** Add library styles to your global CSS or convert to Tailwind classes.

## 📞 Support

For issues related to:
- **Architecture questions**: Review `.claude/agents/architect.md`
- **Prisma setup**: Check `hogwarts/prisma/README.md`
- **i18n setup**: Check `hogwarts/src/components/internationalization/`

## 🚀 Next Steps

After integration:
1. Test all library routes
2. Add library-specific analytics
3. Implement email notifications for overdue books
4. Add book reservation system
5. Create reports for library usage
6. Add QR code scanning for books
7. Implement fine calculation for overdue books

## 📝 Notes

- All components are **server-first** with client components marked `"use client"`
- Server actions are used instead of API routes
- Multi-tenancy is built-in via `schoolId` field
- Database operations use Prisma (not Drizzle)
- Authentication leverages your existing NextAuth setup
- No standalone auth system - fully integrated with main project

---

**Version:** 1.0.0
**Last Updated:** 2025-10-12
**Compatible with:** Hogwarts SaaS v15.4+

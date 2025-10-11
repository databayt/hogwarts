# Stream (LMS) Module Integration Guide

This guide will help you integrate the Marshal LMS system as a "Stream" module into your multi-tenant school management system.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Installation Steps](#installation-steps)
3. [Prisma Integration](#prisma-integration)
4. [Environment Variables](#environment-variables)
5. [Route Configuration](#route-configuration)
6. [Component Integration](#component-integration)
7. [Middleware Updates](#middleware-updates)
8. [Testing Checklist](#testing-checklist)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before integrating the Stream module, ensure you have:

- ✅ Next.js 15+ application with App Router
- ✅ AuthJS v5 (Next-Auth) authentication system
- ✅ Prisma ORM configured with PostgreSQL
- ✅ Existing User model with required fields
- ✅ Multi-tenant support (subdomain or path-based)
- ✅ TailwindCSS with shadcn/ui components

### Required User Model Fields

Your existing `User` model MUST have these fields:
```prisma
model User {
  id    String  @id @default(cuid())
  name  String?
  email String  @unique
  role  UserRole @default(USER)

  // Optional but recommended
  stripeCustomerId String? @unique

  // Stream module relations (add these)
  courses               Course[]           @relation("UserCourses")
  enrollment            Enrollment[]
  lessonProgress        LessonProgress[]
}

enum UserRole {
  ADMIN
  USER
  TEACHER
  STUDENT
}
```

---

## Installation Steps

### Step 1: Copy Stream Directories

Copy these two directories to your main project:

```bash
# Copy app directory
cp -r app/stream <YOUR_PROJECT>/app/

# Copy components directory
cp -r components/stream <YOUR_PROJECT>/components/
```

### Step 2: Copy API Routes (Optional)

The Stream module uses the following API routes. These remain at root level:

```bash
# S3 File Upload/Delete (if using S3)
app/api/s3/upload/route.ts
app/api/s3/delete/route.ts

# Stripe Webhook (for payment processing)
app/api/webhook/stripe/route.ts
```

**Note**: Only copy these if you don't have existing S3 or Stripe implementations.

### Step 3: Copy Shared Components

Copy stream-specific shared components:

```bash
cp -r components/rich-text-editor <YOUR_PROJECT>/components/
cp -r components/file-uploader <YOUR_PROJECT>/components/
cp components/general/EmptyState.tsx <YOUR_PROJECT>/components/general/
```

### Step 4: Install Required Packages

See `STREAM_PACKAGES.md` for the complete list of dependencies.

```bash
pnpm install @tiptap/react @tiptap/starter-kit @aws-sdk/client-s3 stripe canvas-confetti @dnd-kit/core recharts
```

---

## Prisma Integration

### Step 1: Add Stream Models to Your Schema

You have two options:

#### Option A: Multi-File Approach (Recommended)

If you're using Prisma's multi-file approach:

1. Copy the stream models file:
```bash
cp prisma/models/stream.prisma <YOUR_PROJECT>/prisma/models/
```

2. In your main `prisma/schema.prisma`, ensure you have:
```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../lib/generated/prisma"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Your existing models or imports here
```

3. Prisma will automatically detect and include all `*.prisma` files in the `prisma/models/` directory.

#### Option B: Single File Approach

If using a single `schema.prisma` file:

1. Open `prisma/models/stream.prisma`
2. Copy all model definitions
3. Paste them into your main `prisma/schema.prisma` file
4. Remove duplicate enum definitions if any exist

### Step 2: Update User Model Relations

Add these relations to your existing `User` model:

```prisma
model User {
  // ... your existing fields ...

  // Stream module relations
  courses        Course[]         @relation("UserCourses")
  enrollment     Enrollment[]
  lessonProgress LessonProgress[]
}
```

### Step 3: Run Migration

```bash
# Generate Prisma client
pnpm prisma generate

# Create and apply migration
pnpm prisma migrate dev --name add_stream_module

# Or if in production
pnpm prisma migrate deploy
```

### Step 4: Verify Table Creation

Check that these tables were created with the `stream_` prefix:
- `stream_course`
- `stream_chapter`
- `stream_lesson`
- `stream_enrollment`
- `stream_lesson_progress`
- `stream_course_level` (enum)
- `stream_course_status` (enum)
- `stream_enrollment_status` (enum)

---

## Environment Variables

Add these environment variables to your `.env` file:

### Required Variables

```bash
# Stripe (Payment Processing)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# AWS S3 (File Storage) - Using Tigris or any S3-compatible service
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_ENDPOINT_URL_S3=https://fly.storage.tigris.dev
AWS_REGION=auto
NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES=your-bucket-name

# Arcjet (Rate Limiting & Bot Protection)
ARCJET_KEY=ajkey_...

# Resend (Email Service - for course notifications)
RESEND_API_SECRET_KEY=re_...
```

### Optional Variables

```bash
# If different from main app
BETTER_AUTH_URL=https://yourdomain.com
```

---

## Route Configuration

### Update Your Routes File

If you have a `routes.ts` or similar file, add stream routes:

```typescript
// lib/stream/routes.ts or add to existing routes.ts
export const streamRoutes = {
  // Public routes
  public: [
    '/stream',
    '/stream/courses',
  ],

  // Protected routes (require authentication)
  protected: [
    '/stream/dashboard',
    '/stream/payment/success',
    '/stream/payment/cancel',
  ],

  // Admin routes (require ADMIN or TEACHER role)
  admin: [
    '/stream/admin',
    '/stream/admin/courses',
  ],
};
```

### Update Middleware (if needed)

If your middleware restricts routes, ensure stream routes are handled:

```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public stream routes
  if (pathname.startsWith('/stream/courses') || pathname === '/stream') {
    return NextResponse.next();
  }

  // Protect stream dashboard
  if (pathname.startsWith('/stream/dashboard')) {
    // Check authentication
  }

  // Protect stream admin
  if (pathname.startsWith('/stream/admin')) {
    // Check admin role
  }

  // ... rest of your middleware
}
```

---

## Component Integration

### Add Stream Navigation

Update your main navigation to include stream links:

```typescript
// components/navigation.tsx or similar
const navigation = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Courses', href: '/stream/courses' }, // Add this
  { name: 'My Learning', href: '/stream/dashboard' }, // Add this
  // ... other links
];

// For admin users
const adminNavigation = [
  { name: 'Admin Dashboard', href: '/admin' },
  { name: 'Manage Courses', href: '/stream/admin/courses' }, // Add this
  // ... other admin links
];
```

### Update Dashboard Layout

If using a custom dashboard layout:

```typescript
// app/stream/dashboard/layout.tsx (create if needed)
import { DashboardAppSidebar } from "@/components/stream/dashboard/dashboard-app-sidebar";

export default function StreamDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen">
      <DashboardAppSidebar />
      <main className="flex-1 overflow-y-auto p-8">
        {children}
      </main>
    </div>
  );
}
```

---

## Middleware Updates

### Rate Limiting for Stream Routes

The stream module uses Arcjet for rate limiting. Update your middleware:

```typescript
// middleware.ts
import arcjet, { fixedWindow } from "@/lib/arcjet";

const aj = arcjet.withRule(
  fixedWindow({
    mode: "LIVE",
    window: "1m",
    max: 60, // 60 requests per minute
  })
);

export async function middleware(request: NextRequest) {
  // Apply rate limiting to stream API routes
  if (request.nextUrl.pathname.startsWith("/stream/admin")) {
    const decision = await aj.protect(request);

    if (decision.isDenied()) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429 }
      );
    }
  }

  // ... rest of middleware
}
```

---

## Testing Checklist

After integration, test these scenarios:

### Public Routes
- [ ] Browse courses at `/stream/courses`
- [ ] View course details at `/stream/courses/[slug]`
- [ ] Enrollment button triggers Stripe checkout
- [ ] Unauthenticated users redirected to login

### Student Dashboard
- [ ] View enrolled courses at `/stream/dashboard`
- [ ] Access course lessons
- [ ] Mark lessons as complete
- [ ] Track course progress

### Admin Panel
- [ ] Create new course at `/stream/admin/courses/create`
- [ ] Edit course structure (chapters/lessons)
- [ ] Upload course thumbnails and videos
- [ ] Delete courses

### Payments
- [ ] Stripe checkout flow completes
- [ ] Webhook handles `checkout.session.completed`
- [ ] Enrollment status updates to "Active"
- [ ] User can access course after payment

### API Routes
- [ ] S3 upload works for images
- [ ] S3 upload works for videos
- [ ] Stripe webhook receives events
- [ ] Rate limiting blocks excessive requests

---

## Troubleshooting

### Issue: Prisma Client Not Regenerated

**Solution**:
```bash
pnpm prisma generate
# Restart your dev server
```

### Issue: S3 Uploads Failing

**Symptoms**: File upload returns 500 error

**Solutions**:
1. Check AWS credentials in `.env`
2. Verify bucket permissions (should allow PutObject, GetObject, DeleteObject)
3. Check CORS settings on bucket:
```json
[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedHeaders": ["*"]
  }
]
```

### Issue: Stripe Webhook Not Receiving Events

**Solutions**:
1. Verify webhook secret in `.env`
2. Check Stripe dashboard webhook logs
3. Use Stripe CLI for local testing:
```bash
stripe listen --forward-to localhost:3000/api/webhook/stripe
```

### Issue: Routes Return 404

**Solutions**:
1. Clear Next.js cache: `rm -rf .next`
2. Restart dev server
3. Check middleware isn't blocking stream routes
4. Verify file structure matches expected paths

### Issue: Type Errors with Prisma Models

**Symptoms**: TypeScript errors about missing types

**Solutions**:
1. Regenerate Prisma client: `pnpm prisma generate`
2. Restart TypeScript server in VS Code
3. Check `tsconfig.json` includes Prisma output path

### Issue: Enrollment Not Working

**Symptoms**: User can't enroll even after payment

**Solutions**:
1. Check Stripe webhook is configured correctly
2. Verify `STRIPE_WEBHOOK_SECRET` matches Stripe dashboard
3. Check database for enrollment record with "Pending" status
4. Review webhook logs in Stripe dashboard

---

## Multi-Tenant Considerations

If your system uses subdomains for tenants:

### Option 1: Shared Courses Across Tenants

Courses are available to all tenants:
- No changes needed
- All tenants access `/stream` routes

### Option 2: Tenant-Specific Courses

Courses are isolated per tenant:

1. Add `tenantId` or `schoolId` to Course model:
```prisma
model Course {
  // ... existing fields
  schoolId String?
  school   School? @relation(fields: [schoolId], references: [id])
}
```

2. Update course queries to filter by tenant:
```typescript
// components/stream/data/course/get-all-courses.ts
export async function getAllCourses() {
  const session = await auth();
  const tenantId = session?.user?.schoolId;

  return prisma.course.findMany({
    where: {
      schoolId: tenantId, // Filter by tenant
      status: "Published",
    },
  });
}
```

---

## Next Steps

1. ✅ Install all required packages (see `STREAM_PACKAGES.md`)
2. ✅ Copy directories to your project
3. ✅ Integrate Prisma models
4. ✅ Add environment variables
5. ✅ Update navigation and middleware
6. ✅ Run tests
7. ✅ Deploy to staging environment
8. ✅ Test payment flow end-to-end
9. ✅ Deploy to production

---

## Support

For issues specific to the Stream module:
1. Check this integration guide
2. Review `STREAM_PACKAGES.md` for dependency issues
3. Check the troubleshooting section above

For general Next.js/Prisma issues:
- Next.js docs: https://nextjs.org/docs
- Prisma docs: https://www.prisma.io/docs
- Stripe docs: https://stripe.com/docs

---

## Version Compatibility

| Package | Minimum Version | Tested Version |
|---------|----------------|----------------|
| Next.js | 15.0.0 | 15.3.3 |
| React | 19.0.0 | 19.0.0 |
| Prisma | 6.0.0 | 6.8.2 |
| AuthJS | 5.0.0 | 5.x |
| Stripe | 18.0.0 | 18.2.1 |

---

**Last Updated**: January 2025
**Stream Module Version**: 1.0.0

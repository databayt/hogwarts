# Stream (LMS) Module

A complete Learning Management System (LMS) built with Next.js 15, designed as a modular "stream" block that can be injected into multi-tenant school management systems.

## 📚 Overview

Stream is a full-featured LMS that provides:

- **Course Management**: Create, edit, and organize courses with chapters and lessons
- **Student Dashboard**: Track progress, watch lessons, and manage enrollments
- **Admin Panel**: Analytics, course management, and student oversight
- **Payment Integration**: Stripe-powered course enrollment payments
- **File Management**: S3-compatible storage for videos and images
- **Progress Tracking**: Lesson completion and course progress monitoring

## 🏗️ Architecture

### Mirror-Pattern Design

The Stream module follows a mirror-pattern architecture where routes are mirrored by components:

```
app/stream/courses/page.tsx  →  components/stream/courses/content.tsx
app/stream/dashboard/page.tsx  →  components/stream/dashboard/content.tsx
```

### Server-First Approach

- **Server Components by default** for optimal performance
- **Client Components** only when needed (forms, interactivity)
- **Server Actions** for mutations and data operations
- **Suspense** boundaries for progressive loading

### Modular Structure

```
stream/
├── app/stream/              # Routes (prefixed with /stream)
├── components/stream/       # UI components
├── lib/stream/              # Utilities, types, constants
└── prisma/models/           # Database models
```

## 🚀 Quick Start

### For Integration into Existing Project

See [`STREAM_INTEGRATION.md`](./STREAM_INTEGRATION.md) for complete integration instructions.

**TL;DR:**

1. Copy `app/stream` and `components/stream` directories
2. Merge `prisma/models/stream.prisma` into your schema
3. Install dependencies from `STREAM_PACKAGES.md`
4. Add environment variables
5. Run migrations
6. Update navigation

### For Standalone Development

1. **Install Dependencies**

```bash
pnpm install
```

2. **Configure Environment**

```bash
cp .env.example .env
# Fill in your environment variables
```

3. **Setup Database**

```bash
pnpm prisma generate
pnpm prisma migrate dev
```

4. **Run Development Server**

```bash
pnpm dev
```

5. **Access Stream**

- Public: http://localhost:3000/stream
- Dashboard: http://localhost:3000/stream/dashboard
- Admin: http://localhost:3000/stream/admin

## 📋 Features

### 🎓 Student Features

- Browse and search courses
- View course details and curriculum
- Enroll in courses via Stripe checkout
- Access course content (videos, text)
- Track lesson progress
- View enrollment history
- Resume where you left off

### 👨‍🏫 Instructor Features

- Create and publish courses
- Organize content with chapters and lessons
- Upload course thumbnails and videos
- Drag-and-drop chapter/lesson reordering
- Rich text editor for descriptions
- Set course pricing and categories
- View enrollment analytics
- Draft and published states

### 🛠️ Admin Features

- Dashboard with key metrics
- Enrollment trends and revenue charts
- Manage all courses
- View student progress
- Delete courses
- Export data (coming soon)

## 🗂️ Directory Structure

```
stream/
├── app/stream/                          # Next.js App Router
│   ├── (public)/                        # Public routes
│   │   ├── page.tsx                     # Browse courses
│   │   └── courses/
│   │       ├── page.tsx                 # All courses
│   │       └── [slug]/
│   │           └── page.tsx             # Course detail
│   ├── dashboard/                       # Student dashboard
│   │   ├── page.tsx                     # Dashboard home
│   │   ├── [slug]/
│   │   │   ├── page.tsx                 # Course overview
│   │   │   └── [lessonId]/
│   │   │       └── page.tsx             # Lesson viewer
│   ├── admin/                           # Admin panel
│   │   ├── page.tsx                     # Admin dashboard
│   │   └── courses/
│   │       ├── page.tsx                 # Manage courses
│   │       ├── create/
│   │       │   └── page.tsx             # Create course
│   │       └── [courseId]/
│   │           ├── edit/page.tsx        # Edit course
│   │           ├── delete/page.tsx      # Delete course
│   │           └── [chapterId]/[lessonId]/page.tsx  # Edit lesson
│   ├── payment/                         # Payment flows
│   │   ├── success/page.tsx
│   │   └── cancel/page.tsx
│   └── not-admin/page.tsx               # Access denied
│
├── components/stream/                   # React Components
│   ├── home/
│   │   └── content.tsx                  # Stream home page
│   ├── courses/
│   │   ├── content.tsx                  # Courses listing
│   │   ├── [slug]/content.tsx           # Course detail view
│   │   └── enrollment/
│   │       ├── button.tsx               # Enroll button
│   │       └── actions.ts               # Enrollment actions
│   ├── dashboard/
│   │   ├── content.tsx                  # Dashboard main
│   │   ├── course-progress-card.tsx     # Progress widget
│   │   ├── course-sidebar.tsx           # Course navigation
│   │   └── lesson/
│   │       ├── course-content.tsx       # Lesson viewer
│   │       └── lesson-skeleton.tsx      # Loading state
│   ├── admin/
│   │   ├── content.tsx                  # Admin dashboard
│   │   └── courses/
│   │       ├── content.tsx              # Courses list
│   │       ├── card.tsx                 # Course card
│   │       ├── create/
│   │       │   ├── form.tsx             # Create form
│   │       │   └── actions.ts           # Create actions
│   │       ├── edit/
│   │       │   ├── form.tsx             # Edit form
│   │       │   ├── structure.tsx        # Chapter/lesson manager
│   │       │   └── actions.ts           # Update actions
│   │       └── delete/
│   │           ├── form.tsx             # Delete confirmation
│   │           └── actions.ts           # Delete actions
│   ├── payment/
│   │   ├── success-content.tsx          # Success page
│   │   └── cancel-content.tsx           # Cancel page
│   ├── shared/
│   │   ├── course-card.tsx              # Reusable course card
│   │   └── empty-state.tsx              # Empty state component
│   └── data/                            # Data access layer
│       ├── course/
│       │   ├── get-all-courses.ts
│       │   ├── get-course.ts
│       │   └── get-lesson-content.ts
│       ├── admin/
│       │   ├── admin-get-courses.ts
│       │   ├── admin-get-course.ts
│       │   ├── admin-get-stats.ts
│       │   └── require-admin.ts
│       └── user/
│           ├── get-enrolled-courses.ts
│           ├── user-is-enrolled.ts
│           └── require-user.ts
│
├── lib/stream/                          # Utilities
│   ├── routes.ts                        # Route configuration
│   ├── schemas.ts                       # Zod validation schemas
│   ├── constants.ts                     # Constants & enums
│   └── types.ts                         # TypeScript types
│
├── prisma/models/
│   └── stream.prisma                    # Database models
│
└── app/api/                             # API Routes (root level)
    ├── s3/
    │   ├── upload/route.ts              # File upload
    │   └── delete/route.ts              # File deletion
    └── webhook/
        └── stripe/route.ts              # Stripe webhook
```

## 🗄️ Database Schema

### Tables (with `stream_` prefix)

- **stream_course**: Course metadata and settings
- **stream_chapter**: Course chapters (sections)
- **stream_lesson**: Individual lessons with content
- **stream_enrollment**: Student enrollments and payments
- **stream_lesson_progress**: Lesson completion tracking

### Relations

- Course → User (instructor)
- Course → Chapters → Lessons
- Course → Enrollments
- Enrollment → User (student)
- LessonProgress → User + Lesson

See [`prisma/models/stream.prisma`](./prisma/models/stream.prisma) for complete schema.

## 🔧 Configuration

### Environment Variables

Required variables for Stream module:

```bash
# Database
DATABASE_URL="postgresql://..."

# Authentication (AuthJS v5)
BETTER_AUTH_SECRET="your-secret"
BETTER_AUTH_URL="http://localhost:3000"

# Stripe (Payments)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# AWS S3 (File Storage)
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_ENDPOINT_URL_S3="https://fly.storage.tigris.dev"
AWS_REGION="auto"
NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES="your-bucket"

# Arcjet (Rate Limiting)
ARCJET_KEY="ajkey_..."

# Resend (Email - Optional)
RESEND_API_SECRET_KEY="re_..."
```

See `.env.example` for all variables.

### TypeScript Configuration

Add Stream path aliases to `tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@/components/stream/*": ["components/stream/*"],
      "@/lib/stream/*": ["lib/stream/*"],
      "@stream/*": ["*"]
    }
  }
}
```

## 🎨 Customization

### Branding

Update these files to match your brand:

- `components/stream/home/content.tsx` - Landing page
- `lib/stream/constants.ts` - Course categories
- `components/stream/shared/*` - Reusable components

### Course Categories

Modify in `lib/stream/constants.ts`:

```typescript
export const COURSE_CATEGORIES = [
  "Your Category 1",
  "Your Category 2",
  // ... add your categories
]
```

### Pricing Currency

Update in `lib/stream/constants.ts`:

```typescript
export const STRIPE_CONFIG = {
  currency: "eur", // Change from "usd"
  // ...
}
```

## 🧪 Testing

### Manual Testing Checklist

- [ ] Browse courses as guest
- [ ] Sign up and enroll in course
- [ ] Complete Stripe checkout
- [ ] Access course content
- [ ] Mark lessons complete
- [ ] Create course as admin
- [ ] Upload files (images/videos)
- [ ] Edit course structure
- [ ] Delete course

### Unit Tests (Coming Soon)

```bash
pnpm test
```

## 📊 Performance

### Optimization Features

- **Server Components**: Render on server for faster initial load
- **Streaming**: Progressive rendering with Suspense
- **Image Optimization**: Next.js Image component
- **Code Splitting**: Lazy load admin components
- **CDN Caching**: Static assets cached at edge

### Bundle Size

- Public pages: ~200 KB (gzipped)
- Dashboard: ~250 KB (gzipped)
- Admin panel: ~400 KB (gzipped)

## 🔒 Security

### Authentication

- AuthJS v5 (NextAuth) for session management
- Role-based access control (ADMIN, TEACHER, STUDENT)
- Protected routes with middleware

### Rate Limiting

- Arcjet integration for API protection
- 5 requests/minute for course creation
- 10 requests/minute for enrollments
- 20 requests/minute for file uploads

### Payment Security

- Stripe-hosted checkout (PCI compliant)
- Webhook signature verification
- Idempotent enrollment creation

## 🐛 Troubleshooting

### Common Issues

**Q: Routes return 404**

- Ensure `app/stream` directory copied correctly
- Clear Next.js cache: `rm -rf .next`
- Restart dev server

**Q: Type errors with Prisma**

- Run `pnpm prisma generate`
- Restart TypeScript server in IDE

**Q: File uploads fail**

- Check S3 credentials in `.env`
- Verify bucket permissions
- Check CORS configuration

**Q: Stripe webhook not working**

- Verify webhook secret matches
- Check webhook URL in Stripe dashboard
- Use Stripe CLI for local testing

See [`STREAM_INTEGRATION.md`](./STREAM_INTEGRATION.md) for more troubleshooting.

## 📖 Documentation

- **[Integration Guide](./STREAM_INTEGRATION.md)**: Step-by-step integration instructions
- **[Package List](./STREAM_PACKAGES.md)**: All required npm packages
- **[Schema Documentation](./prisma/models/stream.prisma)**: Database models and relations

## 🤝 Contributing

This is a standalone module designed for integration. For improvements:

1. Test changes thoroughly
2. Ensure backward compatibility
3. Update documentation
4. Maintain mirror-pattern structure

## 📄 License

SSPL-1.0 - See LICENSE in the project root for details.

## 🆘 Support

For integration support or questions:

1. Check documentation files
2. Review troubleshooting section
3. Check Next.js and Prisma docs

## 🗺️ Roadmap

- [ ] Certificate generation on completion
- [ ] Course reviews and ratings
- [ ] Discussion forums per course
- [ ] Live streaming support
- [ ] Quizzes and assignments
- [ ] Bulk course imports
- [ ] Advanced analytics
- [ ] Mobile app support

---

**Version**: 1.0.0
**Last Updated**: January 2025
**Compatible With**: Next.js 15+, React 19+, Prisma 6+

Built with ❤️ using Next.js, Prisma, Stripe, and TailwindCSS

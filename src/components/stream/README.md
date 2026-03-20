## Stream — Learning Management System (LMS)

### Overview

Full-featured LMS module for the Hogwarts platform supporting course creation, video lessons, student enrollment (free and Stripe-paid), progress tracking, certificates, analytics, and email notifications. Built with the mirror pattern linking routes under `(school-dashboard)/stream/` to components here.

### File Structure

```
src/components/stream/
├── types.ts                        # Type definitions (StreamDictionary)
├── queries.ts                      # Shared query functions
├── authorization.ts                # Role-based access control
├── list-params.ts                  # List parameter utilities
├── header.tsx                      # Stream header
├── loading.tsx                     # Loading states
├── search.tsx                      # Search component
├── search-bar.tsx                  # Search bar UI
├── explore.tsx                     # Explore/browse courses
├── home/                           # Landing page sections
├── courses/                        # Public course browsing
│   ├── content.tsx                 # Course catalog
│   ├── course-card.tsx             # Course card component
│   ├── [slug]/content.tsx          # Course detail page
│   └── enrollment/                 # Enrollment actions and buttons
├── dashboard/                      # Student dashboard
│   ├── content.tsx                 # Enrolled courses view
│   ├── lesson/                     # Lesson viewer with video player
│   └── certificate-card.tsx        # Certificate viewer/download
├── admin/                          # Admin panel
│   ├── content.tsx                 # Admin dashboard
│   ├── courses/                    # Course CRUD management
│   │   ├── create/                 # Create course
│   │   ├── edit/                   # Edit course + video actions
│   │   ├── delete/                 # Delete confirmation
│   │   └── lesson/                 # Lesson management
│   ├── analytics/                  # Charts and statistics
│   └── enrollments/                # Enrollment management
├── shared/                         # Reusable components
│   ├── video-player/               # Enterprise player (2,000+ lines)
│   ├── rich-text-editor.tsx        # Tiptap WYSIWYG
│   ├── sortable-list.tsx           # Drag-and-drop
│   ├── file-upload.tsx             # File upload with progress
│   ├── slug-utils.ts              # Auto-slug generation
│   ├── duration-utils.ts          # Duration formatting
│   ├── url-validators.ts          # URL validation
│   └── email-service.ts           # Email sending (wired)
├── emails/                         # Email templates
├── data/                           # Data fetchers with React cache()
│   ├── course/                     # Course queries + certificates
│   └── catalog/                    # Catalog/admin queries
├── teach/                          # Teacher content management
├── not-admin/                      # Non-admin fallback
└── __tests__/                      # 72 tests (duration, URL, slug, types)
```

### Status

**Completion:** 100% | **Blockers:** None

All core features production-ready: CRUD, enrollment, video player, progress tracking, certificates, analytics, email notifications, and search.

### Integration Points

- **Routes**: `src/app/[lang]/s/[subdomain]/(school-dashboard)/stream/`
- **Stripe**: Checkout in `enrollment/actions.ts`, webhook at `api/webhook/stripe/route.ts`
- **Email**: Resend integration via `shared/email-service.ts`
- **Prisma Models**: `prisma/models/stream.prisma`
- **Dictionary**: `src/components/internationalization/stream-{en,ar}.json`

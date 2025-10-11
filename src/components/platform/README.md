# School Management Platform — Admin Control Center

## Overview

This directory contains the complete school management platform that empowers school administrators to run their institution efficiently. The platform provides comprehensive tools for managing students, teachers, classes, schedules, exams, assignments, attendance, and all academic operations.

**Primary User:** School Administrators (ADMIN role)
**Secondary Users:** Teachers, Students, Parents, Staff, Accountants

---

## What Admins Can Manage

### 1. People Management
- **Students** (`students/`) - Enrollment, records, class assignments, guardians
- **Teachers** (`teachers/`) - Profiles, departments, subject assignments, schedules
- **Parents** (`parents/`) - Guardian accounts, student relationships, access control
- **Admin Settings** (`admin/`) - User roles, invitations, school configuration

### 2. Academic Structure
- **Subjects** (`subjects/`) - Curriculum, subject catalog, prerequisites
- **Classes** (`classes/`) - Grade sections (1A, 1B), teacher assignments, capacity
- **Lessons** (`lessons/`) - Lesson plans, content management, resources
- **Timetable** (`timetable/`) - Weekly schedules, conflict resolution, printing

### 3. Assessment & Evaluation
- **Assignments** (`assignments/`) - Create, distribute, collect, grade
- **Exams** (`exams/`) - Scheduling, marks entry, grade boundaries
- **Results** (`results/`) - Gradebook, report cards, transcripts, GPA

### 4. Daily Operations
- **Attendance** (`attendance/`) - Daily/period tracking, reports, analytics
- **Announcements** (`announcements/`) - School-wide broadcasts, targeted messaging
- **Events** (`events/`) - School calendar, assemblies, sports day, RSVP

### 5. Access & Configuration
- **Dashboard** (`dashboard/`) - Role-based overview, quick stats, widgets
- **Settings** (`settings/`) - School profile, locale, timezone, domains
- **Profile** (`profile/`) - User account management
- **Parent Portal** (`parent-portal/`) - Guardian view of student data
- **Import/Export** (`import/`) - Bulk CSV operations, data migration

---

## Admin Workflows

### Initial School Setup
1. Configure school settings (name, logo, academic year structure)
2. Set up subjects and grade levels
3. Create classes (Grade 1A, 1B, 2A, etc.)
4. Import or manually add teachers
5. Import or manually add students
6. Assign teachers to classes and subjects
7. Enroll students in classes
8. Build weekly timetable
9. Configure attendance and grading policies

### Daily Operations
1. Review dashboard for pending tasks
2. Mark attendance (or delegate to teachers)
3. Post announcements
4. Respond to teacher/parent requests
5. Monitor exam schedules
6. Review assignment submissions
7. Generate reports

### End of Term
1. Close assignment and exam submissions
2. Finalize grades and results
3. Generate report cards
4. Export academic data
5. Plan next term schedule

---

## Feature Integration Map

```
┌─────────────────────────────────────────────────────────────┐
│                        ADMIN DASHBOARD                        │
│                    (Role-based overview)                      │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
   ┌────▼────┐          ┌────▼────┐          ┌────▼────┐
   │ STUDENTS│          │TEACHERS │          │ CLASSES │
   └────┬────┘          └────┬────┘          └────┬────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
   ┌────▼────┐          ┌────▼────┐          ┌────▼────┐
   │TIMETABLE│          │ATTENDANCE│         │ SUBJECTS│
   └────┬────┘          └────┬────┘          └─────────┘
        │                     │
        │              ┌──────┴────────┐
        │              │               │
   ┌────▼────┐    ┌───▼────┐    ┌────▼─────┐
   │ LESSONS │    │ EXAMS  │    │ASSIGNMENTS│
   └─────────┘    └───┬────┘    └────┬─────┘
                      │              │
                      └──────┬───────┘
                             │
                        ┌────▼────┐
                        │ RESULTS │
                        └────┬────┘
                             │
                        ┌────▼────────┐
                        │ANNOUNCEMENTS│
                        └─────────────┘
                             │
                        ┌────▼─────────┐
                        │PARENT PORTAL │
                        └──────────────┘
```

---

## Role-Based Access

### ADMIN (Full Access)
- ✅ Create, read, update, delete all entities
- ✅ Configure school settings
- ✅ Manage user roles
- ✅ Generate reports and analytics
- ✅ Export data
- ✅ Access billing and subscription

### TEACHER (Delegated Access)
- ✅ View assigned classes and students
- ✅ Mark attendance for their classes
- ✅ Create and grade assignments
- ✅ Enter exam marks
- ✅ Post class announcements
- ✅ View timetable
- ❌ Cannot modify school structure
- ❌ Cannot manage other teachers

### STUDENT (Read-Mostly)
- ✅ View personal timetable
- ✅ View assignments and submit work
- ✅ View grades and attendance
- ✅ Read announcements
- ❌ Cannot access other students' data
- ❌ Cannot modify records

### GUARDIAN (Parent View)
- ✅ View linked children's data
- ✅ View attendance and grades
- ✅ Read school announcements
- ✅ View timetable and events
- ❌ Cannot access other students
- ❌ Limited to read-only

### STAFF (Limited Admin)
- ✅ View school data
- ✅ Basic CRUD on assigned entities
- ❌ Cannot access billing
- ❌ Cannot modify system settings

### ACCOUNTANT (Finance Focus)
- ✅ Access billing and invoices
- ✅ View student/parent accounts
- ❌ No access to academic data
- ❌ Cannot modify school structure

---

## Data Flow & Relationships

### Core Entities
```typescript
School (tenant root)
  └─ SchoolYear
      └─ Term
          ├─ Period (time slots)
          ├─ YearLevel (Grade 1, Grade 2...)
          │   └─ Class (1A, 1B, 2A...)
          │       ├─ StudentClass (enrollment)
          │       ├─ Teacher (assigned)
          │       ├─ Subject
          │       ├─ Timetable (schedule slots)
          │       ├─ Attendance
          │       ├─ Assignment
          │       └─ Exam
          │
          ├─ Student
          │   ├─ Guardian (parent relationship)
          │   ├─ Attendance records
          │   ├─ AssignmentSubmission
          │   └─ Results
          │
          └─ Teacher
              ├─ Department
              ├─ Classes taught
              └─ Subjects taught
```

### Multi-Tenant Safety
**CRITICAL:** Every database query MUST include `schoolId` from `getTenantContext()`.

All business tables have:
- `schoolId` field (required)
- Unique constraints scoped by `schoolId`
- Row-level isolation enforced

---

## Technical Architecture

### Stack
- **Framework:** Next.js 15.4.4 (App Router) + React 19
- **Database:** PostgreSQL (Neon) + Prisma ORM 6.14.0
- **Auth:** NextAuth v5 (JWT sessions with schoolId)
- **UI:** Tailwind CSS 4 + shadcn/ui (Radix)
- **Forms:** react-hook-form + Zod validation
- **State:** Server actions + SWR for client caching
- **Testing:** Vitest + Playwright
- **Deployment:** Vercel with pnpm

### Technology Stack & Documentation

This platform is built with modern, production-grade technologies and follows best practices for multi-tenant SaaS applications.

#### Core Framework & Runtime

**Next.js 15.4** ([Official Docs](https://nextjs.org/docs))
- **App Router**: File-system based routing with server components
- **Turbopack**: Next-generation bundler for development and production (100% integration test compatibility)
- **React Server Components**: Default server rendering with selective client hydration
- **Server Actions**: Type-safe RPC for mutations with "use server" directive
- **Incremental Static Regeneration**: Dynamic content with static performance
- **Built-in Optimizations**: Image, font, and script optimization
- **Key Features**: Partial prerendering, streaming SSR, automatic code splitting
- **Release Notes**: [Next.js 15.4 Release](https://nextjs.org/blog/next-15-4)

**React 19** ([Official Docs](https://react.dev))
- **Actions**: First-class support for async transitions and form submissions
- **Server Components**: Zero-bundle server-side rendering
- **New Hooks**: `useActionState`, `useFormStatus`, `useOptimistic`, `use` for promises
- **Improved Error Handling**: Better error boundaries and recovery
- **Ref as Prop**: Simplified ref forwarding without `forwardRef`
- **Document Metadata**: Built-in `<title>`, `<meta>` support
- **Transitions**: Concurrent rendering with `useTransition` and `startTransition`
- **Release Notes**: [React 19 Release](https://react.dev/blog/2024/12/05/react-19)

#### Database & ORM

**Neon PostgreSQL** ([Official Docs](https://neon.tech/docs/introduction))
- **Serverless Postgres**: Autoscaling, scale-to-zero, instant provisioning
- **Database Branching**: Git-like branches for development and testing
- **Connection Pooling**: Built-in Pgbouncer for connection management
- **Auto-suspend**: Automatic compute suspension after inactivity
- **Point-in-Time Restore**: Continuous backups with 30-day retention
- **Multi-Region**: Deploy databases close to users
- **Features**: Read replicas, IP allowlist, query insights

**Prisma ORM 6.14+** ([Official Docs](https://www.prisma.io/docs))
- **Type-Safe Queries**: Auto-generated TypeScript types from schema
- **Migration System**: Declarative schema migrations with history
- **Multi-Schema Support**: 19 separate model files for organization
- **Connection Pooling**: Optimized connection management
- **Query Performance**: N+1 query prevention with `include`
- **Prisma Client**: Auto-completion, type safety, and runtime validation
- **Prisma Studio**: GUI for database browsing and editing
- **Latest**: v6.17+ with Rust-free builds and ESM-first generator

#### UI & Styling

**shadcn/ui** ([Official Docs](https://ui.shadcn.com/docs))
- **Component Library**: Copy-paste components built on Radix UI primitives
- **Accessibility**: ARIA compliant, keyboard navigation, screen reader support
- **Customizable**: Full control over component code and styling
- **Design System**: Consistent design tokens and theming
- **Components**: 50+ production-ready components (Button, Dialog, Table, Form, etc.)
- **Dark Mode**: Built-in dark mode support with next-themes
- **New York Style**: Selected design variant for this project

**Tailwind CSS 4** ([Official Docs](https://tailwindcss.com/docs))
- **Utility-First**: Rapid UI development with utility classes
- **OKLCH Colors**: Modern color space for better color perception
- **CSS-First Configuration**: Native CSS variables and @theme directive
- **Performance**: JIT compilation, automatic purging
- **Responsive Design**: Mobile-first breakpoints
- **Dark Mode**: Class-based dark mode support
- **Custom Plugins**: Extended with project-specific utilities

#### Authentication & Authorization

**NextAuth.js v5** ([Official Docs](https://authjs.dev))
- **JWT Strategy**: Stateless authentication with signed tokens
- **Multi-Provider**: Google, Facebook, and Credentials (bcrypt)
- **Session Management**: Automatic session refresh and expiration
- **Callbacks**: Extended JWT with `schoolId`, `role`, `isPlatformAdmin`
- **CSRF Protection**: Built-in CSRF token validation
- **Cookie Security**: HttpOnly, SameSite, Secure flags
- **OAuth Flow**: Complex redirect preservation for multi-tenant routing
- **Database Sessions**: Optional database session storage

#### Form Management & Validation

**React Hook Form 7.61+** ([Official Docs](https://react-hook-form.com))
- **Performance**: Minimized re-renders with uncontrolled components
- **TypeScript Support**: Full type inference from schema
- **Validation**: Integrates with Zod for schema validation
- **Field Arrays**: Dynamic form fields with proper state management
- **Form State**: Built-in dirty, touched, errors tracking
- **DevTools**: Browser extension for debugging forms

**Zod 4.0+** ([Official Docs](https://zod.dev))
- **Type Inference**: Generate TypeScript types from schemas
- **Runtime Validation**: Client and server-side validation
- **Error Messages**: Customizable error messages with i18n support
- **Schema Composition**: Reusable schemas with `z.object()`, `z.array()`, etc.
- **Refinements**: Custom validation logic with `.refine()`
- **Transformations**: Data parsing and transformation with `.transform()`

#### Data Tables & UI Components

**TanStack Table 8.21+** ([Official Docs](https://tanstack.com/table))
- **Headless UI**: Full control over rendering and styling
- **Sorting**: Multi-column sorting with custom comparators
- **Filtering**: Column filters, global search, faceted filters
- **Pagination**: Server-side and client-side pagination
- **Column Visibility**: Toggle columns, resize, reorder
- **Row Selection**: Single and multi-row selection
- **TypeScript**: Full type safety for row data

**Additional UI Libraries**:
- **Radix UI**: Unstyled, accessible component primitives
- **Recharts 2.15+**: Composable charting library for analytics
- **date-fns 4.1+**: Modern date utility library (lighter than moment.js)
- **@dnd-kit 6.3+**: Drag-and-drop for timetable and reordering
- **lucide-react**: Icon library with 1000+ icons

#### Development Tools

**TypeScript 5.x** ([Official Docs](https://www.typescriptlang.org/docs))
- **Strict Mode**: Full type safety with `strict: true`
- **Type Inference**: Automatic type detection from Prisma and Zod
- **Path Mapping**: `@/` alias for clean imports
- **JSX**: React 19 with new JSX transform

**Testing Stack**:
- **Vitest 2.0+**: Fast unit testing with Vite integration
- **React Testing Library**: Component testing with user-centric queries
- **Playwright 1.55+**: End-to-end testing across browsers
- **MSW**: API mocking for integration tests

**Build & Development**:
- **pnpm 9.x**: Fast, disk-efficient package manager (required for Vercel)
- **ESLint**: Code linting with Next.js recommended config
- **Prettier**: Code formatting (via ESLint integration)
- **Husky**: Git hooks for pre-commit checks

#### Monitoring & Analytics

- **Sentry 10.12+**: Error tracking and performance monitoring
- **Vercel Analytics**: Web vitals and user analytics
- **Vercel Speed Insights**: Real user monitoring (RUM)

#### Email & Communication

- **Resend 4.7+**: Transactional email API
- **@react-email/components**: React-based email templates
- **Nodemailer**: Fallback SMTP support

#### Internationalization

- **Custom i18n**: 800+ translation keys for Arabic (RTL) and English (LTR)
- **@formatjs/intl-localematcher**: Locale detection and matching
- **Tajawal Font**: Arabic typography
- **Inter Font**: English typography

#### Code Quality & Patterns

**Architectural Patterns**:
- **Server Actions**: "use server" directive for type-safe mutations
- **Mirror Pattern**: Routes in `app/` mirror components in `components/`
- **Component Hierarchy**: UI → Atoms → Templates → Blocks → Micro → Apps
- **Multi-Tenant Isolation**: Every query scoped by `schoolId` from session
- **Role-Based Access Control**: 8 roles (DEVELOPER, ADMIN, TEACHER, STUDENT, GUARDIAN, ACCOUNTANT, STAFF, USER)

**Best Practices**:
- **Type Safety**: No `any` types, strict TypeScript
- **Validation**: Double validation (client UX + server security)
- **Error Handling**: Graceful degradation with user-friendly messages
- **Performance**: Database indexes, connection pooling, SWR caching
- **Accessibility**: ARIA labels, keyboard navigation, semantic HTML
- **Security**: CSRF protection, XSS prevention, SQL injection prevention

#### Deployment & Infrastructure

- **Vercel**: Edge network with automatic HTTPS and CDN
- **Neon Database**: Serverless Postgres with autoscaling
- **Environment Variables**: Type-safe with @t3-oss/env-nextjs
- **CI/CD**: Automatic deployments from `main` branch
- **Preview Deployments**: Automatic preview URLs for PRs

---

### Directory Structure (Mirror Pattern)
```
src/
├── app/[lang]/s/[subdomain]/(platform)/
│   ├── students/page.tsx          # Route
│   ├── teachers/page.tsx
│   ├── classes/page.tsx
│   └── ...
│
└── components/platform/
    ├── students/
    │   ├── content.tsx            # Main UI
    │   ├── actions.ts             # Server actions
    │   ├── validation.ts          # Zod schemas
    │   ├── types.ts               # TypeScript types
    │   ├── config.ts              # Constants and configurations
    │   ├── form.tsx               # Forms
    │   ├── columns.tsx            # Table columns
    │   ├── table.tsx              # Data table
    │   ├── README.md              # Documentation
    │   └── ISSUE.md               # Production tracker
    ├── teachers/...
    └── ...
```

### Server Actions Pattern
```typescript
// actions.ts
"use server"

export async function createStudent(input: FormData) {
  // 1. Get tenant context
  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("Missing school context")

  // 2. Validate with Zod
  const validated = studentCreateSchema.parse(input)

  // 3. Execute with schoolId scope
  const student = await db.student.create({
    data: { ...validated, schoolId }
  })

  // 4. Revalidate cache
  revalidatePath('/students')

  return { success: true, id: student.id }
}
```

### Validation Pattern
```typescript
// validation.ts
import { z } from 'zod'

export const studentCreateSchema = z.object({
  givenName: z.string().min(1, "First name required"),
  surname: z.string().min(1, "Last name required"),
  dateOfBirth: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE"]),
  enrollmentDate: z.string().optional(),
})

export type StudentCreate = z.infer<typeof studentCreateSchema>
```

---

## Common Admin Tasks

### 1. Add a New Student
1. Navigate to `/students`
2. Click "Add Student"
3. Fill form: name, date of birth, gender, enrollment date
4. Save → redirects to student list
5. Optionally: assign to classes, link guardian

### 2. Create a Weekly Timetable
1. Navigate to `/timetable`
2. Select term and grade/class
3. Configure working days (e.g., Sun-Thu for Arabic schools)
4. Set lunch break position
5. Drag-drop or click to assign subjects to time slots
6. System detects conflicts (teacher/room double-booking)
7. Resolve conflicts with suggestions
8. Print A4-ready schedule

### 3. Mark Daily Attendance
1. Navigate to `/attendance`
2. Select class and date
3. View student roster
4. Mark Present/Absent/Late for each student
5. Save → updates records
6. Export attendance reports as CSV

### 4. Create and Assign Homework
1. Navigate to `/assignments`
2. Click "New Assignment"
3. Fill form: title, description, due date, total points
4. Select class(es)
5. Attach files (optional)
6. Publish → visible to students
7. Monitor submissions in real-time
8. Grade and provide feedback

### 5. Post School Announcement
1. Navigate to `/announcements`
2. Click "New Announcement"
3. Write title and message
4. Select scope: School / Class / Role
5. Set priority and expiration date
6. Publish → delivered to target audience
7. Monitor read receipts (future)

### 6. Schedule an Exam
1. Navigate to `/exams`
2. Click "New Exam"
3. Fill: subject, class, date, duration
4. Set total marks and passing threshold
5. Define grade boundaries (A+, A, B+, etc.)
6. Save → appears in class timetable
7. Teachers enter marks after exam
8. Results auto-calculate to report cards

### 7. Generate Report Cards
1. Navigate to `/results`
2. Select term and class
3. Review all exam and assignment scores
4. Calculate GPA per student
5. Apply grade boundaries
6. Generate PDF report cards
7. Bulk download or email to parents

### 8. Bulk Import Students from CSV
1. Navigate to `/import`
2. Download CSV template
3. Fill with student data (name, DOB, gender, etc.)
4. Upload CSV file
5. System validates and shows preview
6. Confirm → students created
7. Review error report for any issues
8. Assign students to classes

---

## Feature Summaries

### 📚 Students (`students/`)
Comprehensive student information system with enrollment, class assignments, guardian relationships, and academic history tracking. Supports bulk CSV import and individual management.

### 👨‍🏫 Teachers (`teachers/`)
Teacher profiles, qualifications, department assignments, and teaching load management. Track which classes and subjects each teacher handles.

### 🏛️ Classes (`classes/`)
Create and manage grade sections (e.g., Grade 1A, 1B), assign teachers, set capacity limits, and enroll students. Links to timetable and attendance systems.

### 📅 Timetable (`timetable/`)
Visual weekly schedule builder with flexible working days, lunch break configuration, conflict detection (teacher/room/class), and A4 print-ready output. Supports both class view and teacher view.

### ✅ Attendance (`attendance/`)
Daily or period-by-period attendance tracking with Present/Absent/Late status codes. Generate reports, export to CSV, and track attendance percentages over time.

### 📝 Assignments (`assignments/`)
Create homework and projects, set due dates, collect submissions, grade student work, and provide feedback. Integrates with results system for GPA calculation.

### 📖 Exams (`exams/`)
Schedule exams, define marking schemes, set grade boundaries, allow teacher marks entry, and auto-calculate results. Supports midterms, finals, and quizzes.

### 🎯 Results (`results/`)
Centralized gradebook combining assignment scores and exam marks. Calculate GPA, apply grading scales, generate report cards, and track academic progress.

### 📢 Announcements (`announcements/`)
Broadcast messages to entire school or target specific classes, grades, or roles. Set priority levels, expiration dates, and track read status.

### 🎉 Events (`events/`)
School calendar for assemblies, sports days, parent meetings, and holidays. Manage RSVPs, assign locations, and send email reminders.

### 📖 Lessons (`lessons/`)
Lesson planning and content management system. Teachers create lesson plans, attach resources, and link to timetable slots.

### 👨‍👩‍👧 Parents (`parents/`)
Guardian account management with student relationships. Parents can log in to view their children's attendance, grades, and announcements via the parent portal.

### 🏠 Parent Portal (`parent-portal/`)
Read-only interface for parents to monitor their children's academic progress, view announcements, check timetables, and download reports.

### 📊 Dashboard (`dashboard/`)
Role-based landing page with quick stats, pending tasks, and shortcuts. Different views for admins, teachers, students, and parents.

### ⚙️ Settings (`settings/`)
School configuration including profile (name, logo), academic year structure, locale (Arabic/English), timezone, subdomain management, and custom domain requests.

### 🔧 Admin (`admin/`)
User and role management, invitation system, billing overview, and school-wide configuration controls. Restricted to ADMIN role only.

### 📤 Import/Export (`import/`)
Bulk data operations via CSV. Import students and teachers with validation. Export data for backup or integration with other systems.

### 📚 Subjects (`subjects/`)
Subject catalog and curriculum management. Define subjects, set prerequisites, and assign to classes and teachers.

### 👤 Profile (`profile/`)
User account settings for updating personal information, changing password, notification preferences, and profile picture.

---

## Export & Reporting Capabilities

Admins can export data from any feature:

- **Students:** CSV with all fields, enrollment status, class assignments
- **Teachers:** CSV with contact info, subjects taught, departments
- **Attendance:** CSV filtered by class, date range, status
- **Results:** PDF report cards, transcript PDFs, CSV gradebook
- **Timetable:** A4 PDF printouts (class or teacher view)
- **Announcements:** CSV history with read status
- **Events:** iCal export for calendar apps

---

## Internationalization (i18n)

Platform supports **Arabic (default)** and **English**:
- RTL (Right-to-Left) for Arabic UI
- LTR (Left-to-Right) for English UI
- 800+ translation keys covering all features
- Font: Tajawal (Arabic), Inter (English)
- Date formatting respects locale
- Timezone: Africa/Khartoum (customizable)

---

## Multi-Tenant Architecture

### How It Works
1. Each school has a unique `schoolId` (UUID)
2. User session includes `schoolId` from JWT
3. Every database query filters by `schoolId`
4. Unique constraints are scoped within tenant
5. Subdomain routing: `school.databayt.org` → `/s/school/...`

### Tenant Isolation Guarantees
- ✅ No cross-tenant data leakage
- ✅ Users can only access their school's data
- ✅ Queries automatically scoped by middleware
- ✅ DEVELOPER role can access all schools (platform admin)

---

## Performance Considerations

- **Database Indexes:** All foreign keys and `schoolId` fields indexed
- **Query Optimization:** Use `include` to avoid N+1 queries
- **Caching:** SWR for client-side data caching
- **Pagination:** All lists support pagination (default 50 per page)
- **Code Splitting:** Dynamic imports for role-specific routes
- **Image Optimization:** Next/Image with WebP/AVIF formats

---

## Future Enhancements

### Planned Features
- 📧 Messaging system (teacher-parent, admin-teacher communication)
- 🔔 Push notifications for mobile devices
- 📚 Library management (books, borrowing, overdue tracking)
- 💰 Fee management (invoices, payments, receipts)
- 🚌 Transport management (bus routes, student assignments)
- 🏥 Health records (vaccinations, medical conditions)
- 📊 Advanced analytics dashboard (predictive insights)
- 🤖 AI-powered recommendations (at-risk student detection)
- 📱 Mobile apps (iOS/Android for parents and students)
- 🔗 Integration with learning management systems (LMS)

### Quality Improvements
- Comprehensive E2E testing for all workflows
- Performance monitoring and alerting
- Accessibility audit (WCAG 2.1 AA compliance)
- Dark mode consistency
- Offline mode support (PWA)

---

## Development Commands

```bash
# Install dependencies
pnpm install

# Run development server with Turbopack
pnpm dev

# Build for production (includes Prisma generation)
pnpm build

# Start production server
pnpm start

# Run linting
pnpm lint

# Run unit tests
pnpm test

# Run E2E tests
pnpm test:e2e

# Database operations
pnpm prisma generate       # Generate Prisma client
pnpm prisma migrate dev    # Run migrations
pnpm db:seed              # Seed database with test data
```

---

## Support & Documentation

- **Main Docs:** `src/app/[lang]/docs/`
- **Requirements:** `src/app/[lang]/docs/requirements/page.mdx`
- **Roadmap:** `src/app/[lang]/docs/roadmap/page.mdx`
- **Architecture:** `CLAUDE.md` (root directory)
- **Feature Docs:** Each subdirectory has `README.md` and `ISSUE.md`

---

## Contributing

When adding new features:
1. Follow the mirror pattern (route matches component folder)
2. Include `README.md` documenting admin capabilities
3. Include `ISSUE.md` tracking production readiness
4. Add Zod validation schemas
5. Implement server actions with `schoolId` scoping
6. Add TypeScript types (no `any`)
7. Use shadcn/ui components
8. Support both Arabic and English
9. Add unit tests (Vitest)
10. Add E2E tests (Playwright)

---

**Platform Status:** Production-ready MVP with ongoing enhancements

**License:** MIT

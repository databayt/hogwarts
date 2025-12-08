# School Onboarding Block

A comprehensive multi-step onboarding flow for new schools joining the platform. Built with Next.js 14, React Server Components, and shadcn/ui.

## 🎯 Overview

The onboarding block provides a guided setup process for schools to configure their profile, settings, and business information. The flow is organized into logical step groups with validation, progress tracking, and data persistence.

## 📁 Architecture

The onboarding system is **fully consolidated** into two directories following the mirror pattern:

### Directory Structure

```
src/
├── app/[lang]/onboarding/              # Routes (21 files)
│   ├── page.tsx                        # Landing page
│   ├── overview/
│   │   └── page.tsx                    # School list dashboard
│   └── [id]/                           # Dynamic school routes
│       ├── layout.tsx                  # Shared layout with providers
│       ├── route-handler.ts            # Route utilities
│       ├── about-school/page.tsx
│       ├── title/page.tsx
│       ├── description/page.tsx
│       ├── location/page.tsx
│       ├── stand-out/page.tsx
│       ├── capacity/page.tsx
│       ├── branding/page.tsx
│       ├── import/page.tsx
│       ├── finish-setup/page.tsx
│       ├── join/page.tsx
│       ├── visibility/page.tsx
│       ├── price/page.tsx
│       ├── discount/page.tsx
│       ├── legal/page.tsx
│       ├── subdomain/page.tsx
│       └── congratulations/page.tsx
│
├── app/api/onboarding/                 # API routes
│   └── validate-access/route.ts
│
└── components/onboarding/              # Components (145 files)
    │
    │ # Core files
    ├── index.ts                        # Barrel exports
    ├── actions.ts                      # Server actions (CRUD)
    ├── auth.ts                         # Authentication utilities
    ├── config.ts                       # Step configurations
    ├── config.client.ts                # Client-side config
    ├── constants.client.ts             # Client constants
    ├── types.ts                        # TypeScript definitions
    ├── validation.ts                   # Global validation schemas
    ├── validation-utils.ts             # Validation helpers
    ├── util.ts                         # General utilities
    │
    │ # State & hooks
    ├── use-listing.tsx                 # ListingProvider context
    ├── use-onboarding.ts               # Navigation & validation
    ├── use-user-schools.tsx            # User schools hook
    ├── with-school-context.tsx         # HOC for school context
    │
    │ # Layout components
    ├── host-footer.tsx                 # Back/Next navigation
    ├── host-header.tsx                 # Progress indicator
    ├── host-step-header.tsx            # Step header
    ├── host-step-layout.tsx            # Step layout wrapper
    ├── host-validation-context.tsx     # Validation context
    ├── step-header.tsx                 # Generic step header
    ├── step-navigation.tsx             # Navigation controls
    ├── step-title.tsx                  # Step title component
    ├── step-wrapper.tsx                # Step wrapper
    │
    │ # UI components
    ├── card.tsx                        # Card layout
    ├── column.tsx                      # Column layout
    ├── column-layout.tsx               # Column utilities
    ├── content.tsx                     # Content wrapper
    ├── detail.tsx                      # Detail view
    ├── all.tsx                         # All items view
    ├── form.tsx                        # Form wrapper
    ├── form-field.tsx                  # Form field component
    ├── selection-card.tsx              # Selection card
    ├── progress-indicator.tsx          # Progress bar
    │
    │ # Error handling & monitoring
    ├── error-boundary.tsx              # Error boundary
    ├── performance-monitor.ts          # Performance tracking
    │
    │ # Completion
    ├── success-completion-modal.tsx    # Success modal
    │
    │ # Step subdirectories (15 steps)
    ├── about-school/                   # 7 files
    ├── title/                          # 8 files
    ├── description/                    # 9 files
    ├── location/                       # 9 files
    ├── stand-out/                      # 7 files
    ├── capacity/                       # 9 files
    ├── branding/                       # 8 files
    ├── import/                         # 7 files
    ├── finish-setup/                   # 7 files
    ├── join/                           # 5 files
    ├── visibility/                     # 4 files
    ├── price/                          # 8 files
    ├── discount/                       # 4 files
    ├── legal/                          # 5 files
    ├── subdomain/                      # 7 files
    ├── congratulations/                # 2 files
    ├── overview/                       # 5 files (dashboard)
    └── floor-plan/                     # 1 file (validation only)
```

### Step Directory Pattern

Each step follows a consistent structure:

```
[step-name]/
├── action.ts or actions.ts    # Server actions
├── card.tsx                   # Card UI component
├── config.ts                  # Step configuration
├── content.tsx                # Main content (server component)
├── form.tsx                   # Form implementation (client)
├── types.ts                   # Type definitions
├── validation.ts              # Zod schemas
└── use-[step].tsx            # Optional custom hook
```

### File Statistics

| Category | Count |
|----------|-------|
| Route files | 21 |
| Component files | 145 |
| Step directories | 17 |
| **Total** | **166 files** |

## 🔄 Onboarding Flow

### Step Groups

#### 1. **Basic Information** (Group: `basic`)
- **About School** - Welcome and introduction (static)
- **Title** - School name configuration
- **Description** - School type, level, and description
- **Location** - Physical address and location
- **Stand Out** - Highlight unique features (static)

#### 2. **School Setup** (Group: `setup`)
- **Capacity** - Student, teacher, classroom limits
- **Branding** - Logo, colors, visual theme
- **Import** - Bulk data import (CSV/Excel)
- **Finish Setup** - Review and confirmation (static)

#### 3. **Business & Legal** (Group: `business`)
- **Join** - Platform account creation
- **Visibility** - Public/private settings
- **Price** - Tuition fees and payment
- **Discount** - Promotional codes
- **Legal** - Terms, compliance, safety
- **Subdomain** - Custom domain configuration

## 🚀 Current Implementation Status

### ✅ Core Infrastructure
- [x] Dynamic routing with school ID
- [x] ListingProvider context at layout level
- [x] Server actions with authentication
- [x] Progress tracking and navigation
- [x] Error boundary and fallback handling
- [x] Form validation with Zod schemas

### 📋 Step Implementation

| Step | UI | Form | Actions | Validation | Database | Production Ready |
|------|-----|------|---------|------------|----------|-----------------|
| About School | ✅ | ✅ | ✅ | ✅ | N/A | ✅ |
| Title | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Description | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Location | ✅ | ✅ | ✅ | ✅ | ✅ | 🔶 (Maps API pending) |
| Stand Out | ✅ | ✅ | ✅ | ✅ | N/A | ✅ |
| Capacity | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Branding | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Import | ✅ | ✅ | ✅ | ✅ | ⚠️ | 🔶 (Parser incomplete) |
| Finish Setup | ✅ | ✅ | ✅ | ✅ | N/A | ✅ |
| Join | ✅ | ✅ | ✅ | ✅ | ⚠️ | 🔶 (Workflow pending) |
| Visibility | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Price | ✅ | ✅ | ✅ | ✅ | ⚠️ | 🔶 (Stripe pending) |
| Discount | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Legal | ✅ | ✅ | ✅ | ✅ | ⚠️ | 🔶 (Docs pending) |
| Subdomain | ✅ | ✅ | ✅ | ✅ | ✅ | 🔶 (DNS config pending) |

Legend: ✅ Complete | 🔶 Partial | ⚠️ In Progress | ❌ Not Started

## 🔧 Key Components

### ListingProvider Context
- Manages school data state across all steps
- Handles optimistic updates and server sync
- Provides `useListing` hook for components
- Automatically available in all step pages (set at layout level)

### Server Actions
- `initializeSchoolSetup()` - Creates new school record
- `getListing()` - Fetches school data with auth
- `updateListing()` - Updates school fields
- `deleteListing()` - Removes school (with safeguards)

### Navigation & Validation
- `useOnboarding()` - Step navigation and validation
- Automatic progress tracking
- Step dependencies and requirements
- Forward/backward navigation with validation

## 🛡️ Security & Authentication

- Server-side authentication via `auth-security.ts`
- School ownership verification
- Multi-tenant data isolation
- CSRF protection on mutations
- Input sanitization and validation

## 💾 Database Models

### Primary Models
- `School` - Core school information
- `SchoolBranding` - Visual customization
- `User` - Platform users with school association

### Supporting Models
- `SubscriptionTier` - Plan limits and features
- `Subscription` - Active subscriptions
- `Invoice` - Payment records
- `Discount` - Promotional codes
- `LegalConsent` - Terms acceptance

## 🚦 Getting Started

### Development Setup

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Type checking
pnpm type-check

# Linting
pnpm lint
```

### Environment Variables

```env
# Required for production
DATABASE_URL="postgresql://..."
NEXTAUTH_URL="https://..."
NEXTAUTH_SECRET="..."

# Optional integrations
STRIPE_SECRET_KEY="sk_..."
GOOGLE_MAPS_API_KEY="..."
UPLOADTHING_SECRET="..."
```

## 📈 Performance Optimizations

- React Server Components for reduced bundle size
- Optimistic UI updates with server reconciliation
- Progressive form validation
- Code splitting per step
- Image optimization with next/image

## 🎨 UI/UX Features

- Clean, modern design with shadcn/ui
- Mobile-responsive layout
- Progress indicators and step navigation
- Real-time validation feedback
- Error recovery and retry mechanisms
- Accessibility compliant (WCAG 2.1 AA)

## 🔍 Monitoring & Analytics

- Performance monitoring via `performance-monitor.ts`
- Error tracking and logging
- User journey analytics
- Conversion funnel metrics

## 📝 Development Guidelines

1. **Component Structure**: Each step follows the same pattern
2. **Server Actions**: All mutations go through server actions
3. **Validation**: Client + server validation with Zod
4. **Type Safety**: Strict TypeScript, no `any` types
5. **Error Handling**: Graceful degradation with user feedback
6. **Testing**: Unit tests for validation, E2E for critical paths

## 🚧 Known Issues & TODOs

See [ISSUE.md](./ISSUE.md) for detailed tracking of:
- Pending integrations (Maps, Stripe, DNS)
- Data import parser implementation
- Legal document templates
- Invitation workflow
- Performance optimizations
- Test coverage improvements

## 📚 Related Documentation

- [Database Schema](/docs/database.md)
- [Authentication Guide](/docs/auth.md)
- [Component Patterns](/docs/patterns.md)
- [API Reference](/docs/api.md)

## 👥 Contributing

1. Check [ISSUE.md](./ISSUE.md) for open tasks
2. Follow the existing component patterns
3. Add tests for new functionality
4. Update this README for significant changes

---

## 🧹 December 2024 Cleanup

### Phase 1: Legacy Code Removal

| Removed File | Reason |
|-------------|--------|
| `action.ts` | Superseded by `actions.ts` |
| `use-optimized-listing.tsx` | Never integrated (ListingProvider is used) |
| `enums.ts` | Legacy Airbnb/rental concepts (WiFi, Pool, etc.) |
| `host-refactor-plan.md` | Old planning document |
| Legacy types in `types.ts` | Removed: HostStep, StepCompletion, HostingProgress, AmenityOption, etc. |

### Phase 2: External Files Consolidation

| Action | File | From | To |
|--------|------|------|-----|
| Moved | `onboarding-auth.ts` | `src/lib/` | `components/onboarding/auth.ts` |
| Deleted | `onboarding-optimization.ts` | `src/lib/` | (unused - was only imported by deleted file) |
| Deleted | `onboarding.config.ts` | `src/config/` | (unused - never imported) |

The onboarding system is now **100% consolidated** into the two-directory pattern with no external dependencies.

---

**Last Updated**: December 2024
**Status**: Production Ready (with noted limitations)
**Version**: 1.2.0
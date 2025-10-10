# School Onboarding Block

A comprehensive multi-step onboarding flow for new schools joining the platform. Built with Next.js 14, React Server Components, and shadcn/ui.

## 🎯 Overview

The onboarding block provides a guided setup process for schools to configure their profile, settings, and business information. The flow is organized into logical step groups with validation, progress tracking, and data persistence.

## 📁 Architecture

```
src/
├── app/onboarding/
│   ├── page.tsx                    # Landing page
│   ├── overview/
│   │   └── page.tsx                # Overview dashboard
│   └── [id]/                       # Dynamic school ID routes
│       ├── layout.tsx              # Shared layout with ListingProvider
│       ├── about-school/           # Static intro step
│       ├── title/                  # School name
│       ├── description/            # School details
│       ├── location/               # Address & location
│       ├── stand-out/              # Unique features (static)
│       ├── capacity/               # Student/teacher limits
│       ├── branding/               # Visual customization
│       ├── import/                 # Data import
│       ├── finish-setup/           # Setup completion (static)
│       ├── join/                   # Platform registration
│       ├── visibility/             # Privacy settings
│       ├── price/                  # Tuition & fees
│       ├── discount/               # Promotional offers
│       ├── legal/                  # Terms & compliance
│       └── subdomain/              # Custom domain setup
│
└── components/onboarding/
    ├── actions.ts                  # Server actions (CRUD)
    ├── config.ts                # Step configurations
    ├── types.ts                    # TypeScript definitions
    ├── use-listing.tsx             # Context & state management
    ├── use-onboarding.ts           # Navigation & validation
    ├── host-footer.tsx             # Navigation controls
    ├── host-header.tsx             # Progress indicator
    ├── error-boundary.tsx          # Error handling
    └── [step-name]/                # Step-specific components
        ├── content.tsx             # Main UI component
        ├── form.tsx                # Form implementation
        ├── action.ts               # Server actions
        ├── validation.ts           # Zod schemas
        ├── config.ts             # Step constants
        └── type.ts                 # Step types
```

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

**Last Updated**: December 2024  
**Status**: Production Ready (with noted limitations)  
**Version**: 1.0.0
# School Onboarding Block

A comprehensive onboarding flow for new schools joining the platform. Built following our component-driven architecture and shadcn/ui patterns.

## Architecture

The onboarding block follows our standard mirror-pattern architecture:

```
src/
├── app/
│   └── onboarding/
│       ├── page.tsx
│       ├── overview/
│       └── [id]/
└── components/
    └── onboarding/
        ├── content.tsx
        ├── actions.ts
        ├── types.ts
        ├── constants.ts
        ├── use-listing.tsx
        └── steps/
            ├── title/
            ├── description/
            ├── location/
            ├── capacity/
            ├── branding/
            ├── import/
            ├── join/
            ├── visibility/
            ├── price/
            ├── discount/
            └── legal/
```

## Step Groups

The onboarding flow is organized into 3 main groups:

1. **Basic Information**
   - About School (static)
   - Title
   - Description
   - Location
   - Stand Out (static)

2. **School Setup**
   - Capacity
   - Branding
   - Import
   - Finish Setup (static)

3. **Business & Legal**
   - Join
   - Visibility
   - Price
   - Discount
   - Legal

## Components

### Core Components

- `HostFooter` - Navigation and progress tracking
- `StepWrapper` - Consistent layout for all steps
- `StepHeader` - Step title and description
- `StepNavigation` - Next/Previous navigation
- `ProgressIndicator` - Visual progress bar

### Form Components

Each interactive step includes:
- `content.tsx` - Main step content
- `actions.ts` - Server actions for mutations
- `validation.ts` - Zod schemas
- `types.ts` - TypeScript types
- `form.tsx` - Form components
- `use-{step}.ts` - Custom hooks

## Database Schema

The onboarding flow interacts with the following Prisma models:

### Core Models
- `School` - Core school information
- `SchoolBranding` - Visual customization and visibility settings
- `SchoolYear` - Academic calendar setup

### Subscription & Pricing
- `SubscriptionTier` - Plan features and limits
- `Subscription` - Active subscriptions
- `Invoice` - Payment records
- `Discount` - Promotional codes
- `AppliedDiscount` - Discount usage tracking

### Legal & Compliance
- `LegalConsent` - User consent tracking
- `LegalDocument` - Terms and policies
- `ComplianceLog` - Audit trail

## Development

1. Install dependencies:
```bash
pnpm install
```

2. Start the development server:
```bash
pnpm dev
```

3. Run type checks:
```bash
pnpm type-check
```

## Important Notes

### ListingProvider Context
- The `ListingProvider` is set at the layout level (`src/app/onboarding/layout.tsx`)
- Individual pages DO NOT need to wrap their content with ListingProvider
- All onboarding pages automatically have access to the listing context

## Validation & Security

- All form inputs are validated with Zod schemas
- Server-side validation in actions.ts
- Multi-tenant safety with schoolId scoping
- Auth.js session validation

## Best Practices

1. Follow shadcn/ui component patterns
2. Use Tailwind utilities with cn helper
3. Keep components small and focused
4. Validate on both client and server
5. Use TypeScript strictly - no any
6. Include schoolId in all queries

## Related Documentation

- [Architecture Guide](/docs/architecture)
- [Pattern Guide](/docs/pattern)
- [Database Schema](/docs/database)

## Onboarding -- Multi-step school setup wizard for new platform subscribers

### Overview

The onboarding block provides a 15-step guided setup process for schools joining the platform. It handles school creation, profile configuration, branding, capacity planning, pricing, legal compliance, and subdomain setup. The flow creates a School record, links the user as ADMIN, and culminates in a live school subdomain at `school.databayt.org`.

### Capabilities by Role

- **USER (unauthenticated/new)**: Redirected to onboarding after registration to create a school
- **ADMIN**: Full access to all onboarding steps, can revisit and edit via overview dashboard
- **DEVELOPER**: Can access any school's onboarding state for debugging

### Routes

| Route                                     | Page                             | Status                          |
| ----------------------------------------- | -------------------------------- | ------------------------------- |
| `/{lang}/onboarding`                      | Landing / entry point            | Ready                           |
| `/{lang}/onboarding/overview`             | School list dashboard            | Ready                           |
| `/{lang}/onboarding/[id]/about-school`    | Welcome and introduction         | Ready                           |
| `/{lang}/onboarding/[id]/title`           | School name                      | Ready                           |
| `/{lang}/onboarding/[id]/description`     | School type, level, description  | Ready                           |
| `/{lang}/onboarding/[id]/location`        | Physical address                 | Ready (Maps API pending)        |
| `/{lang}/onboarding/[id]/stand-out`       | Unique features highlight        | Ready                           |
| `/{lang}/onboarding/[id]/capacity`        | Student/teacher/classroom limits | Ready                           |
| `/{lang}/onboarding/[id]/branding`        | Logo, colors, theme              | Ready                           |
| `/{lang}/onboarding/[id]/schedule`        | Schedule configuration           | Ready                           |
| `/{lang}/onboarding/[id]/import`          | Bulk data import                 | In Progress (parser incomplete) |
| `/{lang}/onboarding/[id]/finish-setup`    | Review and confirmation          | Ready                           |
| `/{lang}/onboarding/[id]/join`            | Platform account linking         | Ready                           |
| `/{lang}/onboarding/[id]/visibility`      | Public/private settings          | Ready                           |
| `/{lang}/onboarding/[id]/price`           | Tuition and payment              | In Progress (Stripe pending)    |
| `/{lang}/onboarding/[id]/discount`        | Promotional codes                | Ready                           |
| `/{lang}/onboarding/[id]/legal`           | Terms, compliance, safety        | In Progress (docs pending)      |
| `/{lang}/onboarding/[id]/subdomain`       | Custom domain configuration      | In Progress (DNS pending)       |
| `/{lang}/onboarding/[id]/congratulations` | Completion and redirect          | Ready                           |

### API Routes

| Route                             | Purpose                            |
| --------------------------------- | ---------------------------------- |
| `/api/onboarding/validate-access` | Validate user access to onboarding |
| `/api/onboarding/create-school`   | Atomic school creation endpoint    |
| `/api/onboarding/extract`         | Data extraction utility            |

### File Structure

```
src/components/onboarding/
  # Core files
  index.ts                     # Barrel exports
  actions.ts                   # Server actions (CRUD)
  auth.ts                      # Authentication utilities
  auth-helpers.ts              # Auth helper functions
  config.ts                    # Step configurations
  config.client.ts             # Client-side config
  constants.client.ts          # Client constants
  types.ts                     # TypeScript definitions
  validation.ts                # Global validation schemas
  validation-utils.ts          # Validation helpers
  util.ts                      # General utilities

  # State and hooks
  use-listing.tsx              # ListingProvider context
  use-onboarding.ts            # Navigation and validation
  use-user-schools.tsx         # User schools hook
  with-school-context.tsx      # HOC for school context

  # Layout components
  host-footer.tsx              # Back/Next navigation
  host-header.tsx              # Progress indicator
  host-step-header.tsx         # Step header
  host-step-layout.tsx         # Step layout wrapper
  host-validation-context.tsx  # Validation context
  step-header.tsx              # Generic step header
  step-navigation.tsx          # Navigation controls
  step-title.tsx               # Step title component
  step-wrapper.tsx             # Step wrapper

  # UI components
  card.tsx                     # Card layout
  column.tsx                   # Column layout
  column-layout.tsx            # Column utilities
  content.tsx                  # Content wrapper
  detail.tsx                   # Detail view
  all.tsx                      # All items view
  form.tsx                     # Form wrapper
  form-field.tsx               # Form field component
  selection-card.tsx           # Selection card
  progress-indicator.tsx       # Progress bar
  error-boundary.tsx           # Error boundary
  performance-monitor.ts       # Performance tracking
  success-completion-modal.tsx # Success modal

  # Step subdirectories (18 total)
  about-school/                # Welcome step
  title/                       # School name
  description/                 # School details
  location/                    # Address and map
  stand-out/                   # Unique features
  capacity/                    # Limits config
  branding/                    # Visual identity
  schedule/                    # Schedule setup
  import/                      # Data import
  finish-setup/                # Review step
  join/                        # Account linking
  visibility/                  # Public/private
  price/                       # Tuition config
  discount/                    # Promo codes
  legal/                       # Compliance
  subdomain/                   # Domain setup
  congratulations/             # Completion
  floor-plan/                  # Validation only

  # Additional modules
  overview/                    # Dashboard (school list, steps overview)
  newcomers/                   # New user onboarding modal
  apply/                       # Application client
```

**Total**: 172 TypeScript/TSX files across 23 directories

### Status

**Completion:** 75% | **Blockers:** External service integrations (Maps API, Stripe, DNS provider)

Core onboarding flow (all 15 steps with UI, forms, validation, server actions, and database persistence) is functional. Remaining work is external service integrations and some backend processing (CSV parser, legal document templates).

### Integration Points

- [Auth block](../auth/README.md) -- Users must authenticate before entering onboarding; school creation links user as ADMIN
- `src/lib/school-access.ts` -- Atomic school-user linking with `$transaction`
- `src/auth.ts` -- Smart redirect sends users to their school subdomain after completion
- `src/middleware.ts` -- Subdomain rewriting enables `school.databayt.org` routing post-onboarding

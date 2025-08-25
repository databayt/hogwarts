# Hogwarts

Hogwarts is a school automation platform that manages students, faculty, and academic processes with an intuitive interface.

![hero](public/thumb.png)

## Stack

![hero](public/stack.png)

## Quick Start

```bash
# Install dependencies
pnpm install

# Setup database
pnpm db:seed

# Start development server
pnpm dev
```

## School Onboarding Process

This platform features a comprehensive onboarding flow for new schools. The onboarding process is designed to be user-friendly and guides school administrators through setting up their institution on the platform.

### Onboarding Architecture

The onboarding system follows a multi-step wizard approach with:

- **Entry Point**: `/onboarding` - Overview and getting started page
- **Multi-Step Flow**: `/onboarding/[id]/[step]` - Dynamic step-by-step process  
- **Context Management**: React Context for state management across steps
- **Progress Tracking**: Visual progress indicators and completion status
- **Data Persistence**: Automatic saving as users progress through steps

### Onboarding Steps

The school setup process consists of three main phases:

#### Phase 1: Basic Information
1. **About School** - Welcome and school type selection
2. **Title** - School name and basic identification
3. **Description** - School level (primary/secondary) and type (private/public/etc.)
4. **Location** - Address and geographic information
5. **Stand Out** - Highlight unique features and amenities

#### Phase 2: School Setup
6. **Capacity** - Student/teacher limits and facility counts
7. **Branding** - Logo upload, color scheme, visual customization
8. **Import** - Data import for existing students/staff (CSV/API)
9. **Finish Setup** - Review and confirmation

#### Phase 3: Business & Legal
10. **Join** - Staff invitation and role management
11. **Visibility** - Public listing and enrollment settings
12. **Price** - Tuition fees and payment schedules
13. **Discount** - Promotional codes and special offers
14. **Legal** - Terms acceptance and compliance

### Database Schema

The onboarding process interacts with several key models:

- **School** - Core school information and configuration
- **SchoolBranding** - Visual customization and visibility settings
- **Subscription** - Plan features and billing information
- **Legal Models** - Consent tracking and compliance

### Key Features

- **Progressive Enhancement**: Works without JavaScript for basic functionality
- **Auto-Save**: Progress is automatically saved as users navigate
- **Validation**: Client and server-side validation with Zod schemas
- **Multi-tenant Safe**: Proper data isolation between schools
- **Responsive Design**: Works on all device sizes
- **Accessibility**: WCAG 2.1 AA compliant

### File Structure

```
src/
├── app/onboarding/           # Next.js app routes
│   ├── page.tsx             # Main onboarding entry
│   ├── overview/            # Getting started page
│   └── [id]/                # Dynamic step routes
└── components/onboarding/    # Reusable components
    ├── actions.ts           # Server actions
    ├── types.ts             # TypeScript definitions
    ├── constants.ts         # Configuration
    ├── use-listing.tsx      # Context management
    └── [step]/              # Individual step components
```

### Production Readiness

The onboarding system has been designed with production considerations:

- **Error Handling**: Comprehensive error boundaries and fallbacks
- **Performance**: Lazy loading and code splitting
- **Security**: Input validation and CSRF protection
- **Analytics**: Built-in tracking for onboarding funnel
- **Testing**: Unit and integration test coverage

## Documentation

Visit https://ed.databayt.org/docs to view the full documentation.

## Contributing

Please read the [contributing guide](/CONTRIBUTING.md).

## License

Licensed under the [MIT license](https://github.com/shadcn/ui/blob/main/LICENSE.md).

# Onboarding Block Implementation Tasks

## Static Pages
- [x] About School
  - [x] Create content.tsx with static UI
  - [x] Add school type selector component
  - [x] Implement step navigation

- [x] Stand Out
  - [x] Create content.tsx with static UI
  - [x] Add feature highlights section
  - [x] Add amenities showcase

- [x] Finish Setup
  - [x] Create content.tsx with static UI
  - [x] Add completion celebration
  - [x] Add next steps guidance

## Interactive Pages

### Title Step
- [x] Create directory structure
  - [x] content.tsx
  - [x] actions.ts
  - [x] validation.ts
  - [x] types.ts
  - [x] form.tsx
  - [x] use-title.ts
- [x] Implement school name validation
- [x] Add character counter
- [ ] Add SEO preview

### Description Step
- [x] Create directory structure
  - [x] content.tsx
  - [x] actions.ts
  - [x] validation.ts
  - [x] types.ts
  - [x] form.tsx
  - [x] use-description.ts
- [x] Add school level selection
- [x] Add school type selection
- [x] Implement two-step navigation

### Location Step
- [x] Create directory structure
  - [x] content.tsx
  - [x] actions.ts
  - [x] validation.ts
  - [x] types.ts
  - [x] form.tsx
  - [x] use-location.tsx
- [ ] Integrate maps API
- [x] Add address validation
- [ ] Implement geocoding

### Capacity Step
- [x] Create directory structure
  - [x] content.tsx
  - [x] actions.ts
  - [x] validation.ts
  - [x] types.ts
  - [x] form.tsx
  - [x] use-capacity.ts
- [x] Add student capacity input
- [x] Add teacher capacity input
- [x] Add facilities counter
- [x] Add classrooms counter
- [x] Implement plan limits validation

### Branding Step
- [x] Create directory structure
  - [x] content.tsx
  - [x] actions.ts
  - [x] validation.ts
  - [x] types.ts
  - [x] form.tsx
  - [x] use-branding.ts
- [x] Add logo upload
- [x] Add color scheme picker
- [x] Add border radius options
- [x] Add shadow options
- [x] Implement brand preview

### Import Step
- [x] Create directory structure
  - [x] content.tsx
  - [x] actions.ts
  - [x] validation.ts
  - [x] types.ts
  - [x] form.tsx
  - [x] use-import.ts
- [x] Add file upload UI
- [x] Add file type validation
- [x] Add progress tracking
- [ ] Implement CSV parsing
- [ ] Add column mapping
- [ ] Add data validation

### Join Step
- [x] Create directory structure
  - [x] content.tsx
  - [x] actions.ts
  - [x] validation.ts
  - [x] types.ts
  - [x] form.tsx
  - [x] use-join.ts
- [x] Add join method selection
- [x] Add validation schema
- [ ] Add invitation code generation
- [ ] Add role management
- [ ] Implement approval workflow

### Visibility Step
- [x] Create directory structure
  - [x] content.tsx
  - [x] actions.ts
  - [x] validation.ts
  - [x] types.ts
  - [x] form.tsx
  - [x] use-visibility.ts
- [x] Add information sharing options
- [x] Add access controls
- [ ] Add directory settings
- [ ] Add preview mode

### Price Step
- [x] Create directory structure
  - [x] content.tsx
  - [x] actions.ts
  - [x] validation.ts
  - [x] types.ts
  - [x] form.tsx
  - [x] use-price.ts
- [x] Add price input UI
- [x] Add fee breakdown
- [x] Add validation schema
- [ ] Add payment schedule selection
- [ ] Integrate with Stripe

### Discount Step
- [x] Create directory structure
  - [x] content.tsx
  - [x] actions.ts
  - [x] validation.ts
  - [x] types.ts
  - [x] form.tsx
  - [x] use-discount.ts
- [x] Add discount selection UI
- [x] Add percentage badges
- [x] Add validation schema
- [ ] Add custom discount creation
- [ ] Add discount scheduling

### Legal Step
- [x] Create directory structure
  - [x] content.tsx
  - [x] actions.ts
  - [x] validation.ts
  - [x] types.ts
  - [x] form.tsx
  - [x] use-legal.ts
- [x] Add operational status selection
- [x] Add safety features checklist
- [x] Add compliance information
- [ ] Add terms acceptance
- [ ] Add document upload

## Database Updates

### Core Models
- [x] Add missing fields to School model
  - [x] Add branding fields (primaryColor, secondaryColor, borderRadius, shadow)
  - [x] Add visibility settings (isPubliclyListed, allowSelfEnrollment, requireParentApproval)
  - [x] Add import tracking (lastImportDate, importStatus, totalImported)
- [x] Create SchoolBranding model
  - [x] Add visual customization options
  - [x] Add font and CSS customization
  - [x] Add visibility preferences

### Subscription & Pricing
- [x] Create SubscriptionTier model
  - [x] Add feature flags
  - [x] Add usage limits
  - [x] Add pricing tiers
- [x] Create Discount model
  - [x] Add code generation
  - [x] Add usage tracking
  - [x] Add validity periods
- [x] Create AppliedDiscount model
  - [x] Add audit trail
  - [x] Add amount tracking
  - [x] Add invoice linking

### Legal & Compliance
- [x] Create LegalConsent model
  - [x] Add version control
  - [x] Add consent evidence
  - [x] Add GDPR compliance
- [x] Create LegalDocument model
  - [x] Add document versioning
  - [x] Add effective dates
  - [x] Add consent requirements
- [x] Create ComplianceLog model
  - [x] Add event tracking
  - [x] Add user auditing
  - [x] Add event metadata

## Code Organization

### Types and Constants Separation
- [ ] Split types.ts into page-specific files:
  - [ ] about-school/types.ts
  - [x] title/types.ts
  - [x] description/types.ts
  - [x] location/types.ts
  - [x] capacity/types.ts
  - [ ] branding/types.ts
  - [ ] import/types.ts
  - [ ] join/types.ts
  - [ ] visibility/types.ts
  - [ ] price/types.ts
  - [ ] discount/types.ts
  - [ ] legal/types.ts

- [ ] Split constants.ts into page-specific files:
  - [ ] about-school/constants.ts
  - [x] title/constants.ts (title limits and messages)
  - [x] description/constants.ts (school levels and types)
  - [x] location/constants.ts (messages and supported countries)
  - [x] capacity/constants.ts (limits, fields, and messages)
  - [ ] branding/constants.ts
  - [ ] import/constants.ts
  - [ ] join/constants.ts
  - [ ] visibility/constants.ts
  - [ ] price/constants.ts
  - [ ] discount/constants.ts
  - [ ] legal/constants.ts

## Architecture Notes
- ListingProvider is at layout level (src/app/onboarding/layout.tsx)
- Remove any local ListingProvider wrapping in pages
- Use client-side constants from constants.client.ts, not constants.ts

## General Improvements
- [ ] Add progress persistence
- [ ] Implement step validation
- [ ] Add error handling
- [ ] Add loading states
- [ ] Add success notifications
- [ ] Add analytics tracking
- [ ] Add A/B testing
- [ ] Improve accessibility
- [ ] Add E2E tests
- [ ] Add unit tests
- [ ] Add documentation

## Technical Debt
- [ ] Refactor step navigation
- [ ] Optimize form validation
- [ ] Improve error messages
- [ ] Clean up unused code
- [ ] Update dependencies

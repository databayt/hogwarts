# Host Flow Documentation

## Overview
The host onboarding flow is a multi-step process that guides property owners through listing their property on the platform. The flow is organized into 3 main phases with 16 total steps.

## Architecture Structure

### Directory Structure
```
src/app/host/
├── page.tsx                    # Main host dashboard entry point
├── overview/
│   └── page.tsx               # Steps overview & getting started
└── [id]/                      # Dynamic route for listing creation
    ├── layout.tsx             # Layout with footer navigation
    ├── about-place/           # Step 1: Introduction
    ├── structure/             # Step 2: Property type selection
    ├── privacy-type/          # Step 3: Privacy type (entire/private/shared)
    ├── location/              # Step 4: Location & address
    ├── floor-plan/            # Step 5: Room/guest count
    ├── stand-out/             # Step 6: What makes it special
    ├── amenities/             # Step 7: Amenities selection
    ├── photos/                # Step 8: Photo upload
    ├── title/                 # Step 9: Listing title
    ├── description/           # Step 10: Description & highlights
    ├── finish-setup/          # Step 11: Setup completion
    ├── instant-book/          # Step 12: Instant booking settings
    ├── visibility/            # Step 13: Listing visibility
    ├── price/                 # Step 14: Pricing
    ├── discount/              # Step 15: Discount options
    └── legal/                 # Step 16: Legal & publish
```

### Component Structure
```
src/components/host/
├── index.ts                   # Component exports
├── host-dashboard.tsx         # Main dashboard component
├── host-header.tsx            # Header component
├── host-footer.tsx            # Footer with navigation & progress
├── steps-overview.tsx         # Step overview page
├── host-step-layout.tsx       # 2-column layout wrapper
├── host-step-header.tsx       # Step header with illustration
├── selection-card.tsx         # Reusable selection card
├── property-selector.tsx      # Property type selector
├── amenity-selector.tsx       # Amenity selection component
├── listing-card.tsx           # Listing card for dashboard
├── new-listing-options.tsx    # New listing creation options
├── step-header.tsx            # Step header component
└── step-navigation.tsx        # Navigation component
```

## Flow Documentation

### Phase 1: Tell us about your place (Steps 1-6)
**Progress: Steps 1-6 of 16**

1. **about-place** `/host/[id]/about-place`
   - Purpose: Introduction and overview
   - Content: Video explanation of the process
   - Navigation: Auto-enabled next button
   - Layout: HostStepHeader with video illustration

2. **structure** `/host/[id]/structure`
   - Purpose: Property type selection
   - Content: PropertyTypeSelector component
   - Validation: Requires property type selection
   - Layout: HostStepLayout (2-column)

3. **privacy-type** `/host/[id]/privacy-type`
   - Purpose: Select sharing type (entire place, private room, shared room)
   - Content: SelectionCard components with icons
   - Validation: Requires privacy type selection
   - Layout: HostStepLayout (2-column)

4. **location** `/host/[id]/location`
   - Purpose: Address and location details
   - Content: Location input and map
   - Validation: Requires valid address
   - Layout: HostStepLayout (2-column)

5. **floor-plan** `/host/[id]/floor-plan`
   - Purpose: Room counts (guests, bedrooms, bathrooms)
   - Content: Counter components
   - Validation: Requires guest count
   - Layout: HostStepLayout (2-column)

6. **stand-out** `/host/[id]/stand-out`
   - Purpose: Special features selection
   - Content: Feature selection cards
   - Layout: HostStepLayout (2-column)

### Phase 2: Make it stand out (Steps 7-11)
**Progress: Steps 7-11 of 16**

7. **amenities** `/host/[id]/amenities`
   - Purpose: Amenity selection
   - Content: AmenitySelector with icon grid
   - Validation: Requires amenity selection
   - Layout: HostStepLayout (2-column)

8. **photos** `/host/[id]/photos`
   - Purpose: Photo upload
   - Content: Photo upload interface
   - Layout: HostStepLayout (2-column)

9. **title** `/host/[id]/title`
   - Purpose: Listing title creation
   - Content: Text input with character limit
   - Layout: HostStepLayout (2-column)

10. **description** `/host/[id]/description`
    - Purpose: Description and highlights
    - Content: Two-step process (highlights selection → description writing)
    - Custom Navigation: Internal step progression
    - Layout: Custom grid layout

11. **finish-setup** `/host/[id]/finish-setup`
    - Purpose: Setup completion confirmation
    - Layout: HostStepLayout (2-column)

### Phase 3: Finish up and publish (Steps 12-16)
**Progress: Steps 12-16 of 16**

12. **instant-book** `/host/[id]/instant-book`
    - Purpose: Instant booking settings
    - Layout: HostStepLayout (2-column)

13. **visibility** `/host/[id]/visibility`
    - Purpose: Listing visibility settings
    - Layout: HostStepLayout (2-column)

14. **price** `/host/[id]/price`
    - Purpose: Pricing setup
    - Content: Price input and suggestions
    - Layout: HostStepLayout (2-column)

15. **discount** `/host/[id]/discount`
    - Purpose: Discount options
    - Content: Checkbox cards for different discounts
    - Layout: HostStepLayout (2-column)

16. **legal** `/host/[id]/legal`
    - Purpose: Legal agreements and publishing
    - Final Step: Redirects to `/hosting/listings`
    - Layout: HostStepLayout (2-column)

## Core Components

### HostStepLayout
**Purpose**: Standard 2-column layout for onboarding steps
**Props**: 
- `title`: Step title (left column)
- `subtitle`: Step description (left column)  
- `children`: Content (right column)
- `className`: Additional styling

**Usage**: Most onboarding steps use this layout

### SelectionCard
**Purpose**: Reusable selection component for options
**Props**:
- `id`, `title`, `description`: Content
- `icon`: Optional icon
- `isSelected`: Selection state
- `onClick`: Selection handler
- `compact`: Compact mode for smaller cards

### Navigation System

#### HostFooter
**Features**:
- Fixed bottom navigation
- 3-phase progress bars
- Back/Next buttons with validation
- Logo, Help, and Save buttons
- Dynamic step progression

#### Validation Context
**Provider**: `HostValidationProvider`
**Features**:
- `enableNext()` / `disableNext()`: Control next button
- `isNextDisabled`: Current validation state
- `customNavigation`: Override default navigation
- `setCustomNavigation()`: Set custom handlers

## Current State Analysis

### ✅ Completed Features
1. **Basic Flow Structure**: 16-step onboarding flow
2. **Navigation System**: Footer with progress and validation
3. **Layout Components**: HostStepLayout, HostStepHeader
4. **Reusable Components**: SelectionCard, PropertySelector, AmenitySelector
5. **Validation Context**: Enable/disable navigation based on form state
6. **Progress Tracking**: 3-phase progress indicators
7. **Shadcn Integration**: Using Card, Button, Progress, etc.
8. **Theme Integration**: Using CSS variables and theme colors

### ✅ Completed Improvements
1. **✅ Shadcn & Theme Consistency**: All components now use theme variables instead of hardcoded colors
2. **✅ Typography System Integration**: All components use semantic HTML with configured typography
3. **Limited Atom Components**: Need more granular reusable components
4. **Navigation Optimization**: Could be more flexible and optimized
5. **No Data Persistence**: No server actions or form handling
6. **No Authentication**: Host flow not protected
7. **No Schema Validation**: Missing Zod schemas and form validation

### ⚠️ Recent Fixes Applied
**Issue #1 - Shadcn Components & Theme Consistency:**
- ✅ Replaced hardcoded colors (`text-gray-500`, `bg-gray-50`, `border-neutral-300`) with theme variables
- ✅ Updated components to use `text-foreground`, `text-muted-foreground`, `bg-background`, `bg-accent`, etc.
- ✅ Fixed components: description, floor-plan, photos, title, instant-book, visibility, discount pages
- ✅ Updated selection-card component to use theme-based styling

**Issue #2 - Typography System Integration:**  
- ✅ Removed manual font classes (`text-lg`, `font-medium`, `text-sm`) from all host components
- ✅ Components now use semantic HTML elements (h1, h2, h3, p) with configured styles from typography.css
- ✅ Added `.display` class for large price display elements
- ✅ Ensured consistent text hierarchy across all steps

### ⚠️ Remaining Areas for Improvement

## Data Flow
**Current**: Client-side only, no persistence
**Needed**: 
- Form validation with Zod schemas
- Server actions for data submission
- Prisma integration for database storage
- Real-time data saving on each step

## Navigation Flow
```
/host → /host/overview → /host/[id]/about-place → ... → /host/[id]/legal → /hosting/listings
```

## Key Context Providers
1. **HostValidationProvider**: Navigation validation and control
2. **Future**: Form data provider, authentication provider

## Integration Points
- **UI Components**: src/components/ui (shadcn)
- **Theme**: src/app/globals.css
- **Typography**: src/styles/typography.css
- **Icons**: src/components/atom/airbnb-icons.tsx
- **Validation**: src/context/host-validation-context.tsx

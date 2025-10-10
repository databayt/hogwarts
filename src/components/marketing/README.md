# Marketing Components

## Overview
The marketing components provide public-facing features for the Hogwarts platform, including landing pages, pricing, features showcase, testimonials, and blog functionality. This module handles the conversion funnel from visitor to registered school.

## Architecture Status

### Current Structure
```
src/components/marketing/
├── features/          # Feature showcase components
├── pricing/           # Pricing plans and billing
├── blog/              # Blog content system
├── backup-SDG/        # Legacy pricing components
├── hero.tsx           # Hero section
├── faqs.tsx           # FAQ section
├── testimonial.tsx    # Customer testimonials
├── logo-cloud.tsx     # Partner logos
├── config.ts       # Static content
└── content.tsx        # Main marketing page
```

### Compliance Status
- ✅ **Component Organization**: Well-structured feature folders
- ✅ **Server Components**: Properly using server/client separation
- ⚠️ **Mirror Pattern**: Should follow app router structure
- ❌ **Typography**: Multiple violations with hardcoded text classes
- ❌ **Standardization**: Missing required files per feature
- ❌ **TypeScript**: Some `any` types and unsafe assertions

## Features

### 1. Landing Pages
- Hero section with call-to-action
- Feature showcase grid
- Testimonials carousel
- Partner logo cloud
- FAQ accordion

### 2. Pricing
- Tiered pricing plans
- Billing frequency toggle (monthly/annual)
- Feature comparison table
- Enterprise section
- Stripe checkout integration

### 3. Features
- Feature grid with icons
- Detailed feature descriptions
- Benefits highlighting
- Use case examples

### 4. Blog
- Article listing
- Content management
- SEO optimization
- Reading time estimation

## Technology Stack
- **Framework**: Next.js 15.4.4 App Router
- **UI**: ShadCN UI + Custom components
- **Styling**: Tailwind CSS v4 with OKLCH colors
- **Payments**: Stripe integration
- **Forms**: React Hook Form + Zod
- **Analytics**: Vercel Analytics
- **Icons**: Lucide React

## Critical Issues Found

### Typography Violations ❌
Found in multiple files:
- `time.tsx`: Uses `text-3xl`, `text-lg` instead of semantic HTML
- `backup-SDG/*`: Extensive hardcoded text classes
- `features/content.tsx`: Mixed typography approaches

### Component Organization Issues
- **backup-SDG folder**: Contains duplicate/legacy pricing components
- **Mixed patterns**: Some components use old patterns
- **Inconsistent file naming**: Some use kebab-case, others don't

### Performance Concerns
- Large static data in client components
- Missing lazy loading for images
- No code splitting for pricing module

## Development Guidelines

### Component Creation
```typescript
// Use Server Components by default
export default async function MarketingFeature() {
  const data = await fetchData()
  return <FeatureContent data={data} />
}

// Client components only when needed
"use client"
export function InteractiveFeature() {
  // Interactive logic here
}
```

### Typography Pattern
```typescript
// ❌ BAD - Don't use hardcoded classes
<h2 className="text-3xl font-bold">Title</h2>
<p className="text-sm text-muted-foreground">Description</p>

// ✅ GOOD - Use semantic HTML
<h2>Title</h2>
<p className="muted">Description</p>
```

### Pricing Integration
```typescript
// Server action for Stripe
"use server"
export async function createCheckoutSession(planId: string) {
  const session = await stripe.checkout.sessions.create({
    // Stripe config
  })
  redirect(session.url)
}
```

## Standardization Requirements

### Missing Files Per Feature
Each feature folder should have:
- `type.ts` - TypeScript interfaces
- `validation.ts` - Zod schemas
- `constant.ts` - Static data
- `actions.ts` - Server actions
- `hooks.ts` - Custom React hooks

### Component Patterns
1. Use ShadCN UI components as base
2. Extend with custom variants using CVA
3. Follow atomic design principles
4. Implement proper loading states

## Testing Requirements
- Unit tests for utility functions
- Integration tests for Stripe flows
- Visual regression tests for marketing pages
- A/B testing framework for conversion optimization

## SEO & Performance
- Server-side rendering for all marketing pages
- Proper meta tags and Open Graph data
- Image optimization with Next/Image
- Font optimization with next/font
- Critical CSS inlining

## Internationalization
- Support for Arabic (RTL) and English
- Localized pricing based on region
- Translated marketing copy
- RTL-aware layouts

## Analytics & Tracking
- Conversion funnel tracking
- A/B test metrics
- Page performance monitoring
- User behavior analytics

## Related Documentation
- [CLAUDE.md](../../../CLAUDE.md) - Overall architecture
- [Pricing Strategy](../../docs/pricing.md)
- [Marketing Guidelines](../../docs/marketing.md)
- [Stripe Integration](../../docs/stripe.md)

## Maintainers
Marketing and growth team responsible for conversion optimization.

## License
MIT
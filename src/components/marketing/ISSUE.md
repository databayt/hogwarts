# Marketing Components - Issues & Backlog

Status legend: [x] done, [~] in progress, [ ] todo

## Critical Architecture Issues (Priority 1) 🔴

### Typography System Violations
- [ ] Fix `time.tsx` - Replace `text-3xl`, `text-lg` with semantic HTML
- [ ] Fix `backup-SDG/` folder - Multiple typography violations
- [ ] Fix `features/content.tsx` - Standardize typography approach
- [ ] Fix hero section - Remove hardcoded font classes
- [ ] Run typography-refactor agent on all marketing files

### Component Organization
- [ ] **CRITICAL**: Remove or archive `backup-SDG/` folder
- [ ] Standardize file naming to kebab-case
- [ ] Move marketing to proper mirror pattern structure
- [ ] Consolidate duplicate pricing implementations

### TypeScript Type Safety
- [ ] Remove all `any` type usage
- [ ] Add proper type definitions for all components
- [ ] Fix unsafe type assertions
- [ ] Create shared types in `type.ts` files

## Standardization Issues (Priority 2) ⚠️

### Missing Required Files
For each feature folder (features, pricing, blog):
- [ ] Create `type.ts` - Shared TypeScript interfaces
- [ ] Create `validation.ts` - Zod schemas for forms
- [ ] Create `actions.ts` - Server actions
- [ ] Create `config.ts` - Static marketing data
- [ ] Create `hooks.ts` - Custom React hooks
- [ ] Create `utils.ts` - Utility functions

### Component Standardization
- [ ] Convert all components to use ShadCN UI base
- [ ] Implement consistent loading states
- [ ] Add proper error boundaries
- [ ] Create reusable marketing components library

## Performance Issues (Priority 3) 🚀

### Bundle Size Optimization
- [ ] Move large static data to server components
- [ ] Implement code splitting for pricing module
- [ ] Lazy load testimonials carousel
- [ ] Optimize image loading with Next/Image

### React Optimizations
- [ ] Add React.memo to expensive components
- [ ] Implement virtual scrolling for blog listings
- [ ] Use dynamic imports for heavy features
- [ ] Optimize re-renders in pricing calculator

## Feature Implementation (Priority 4) 🛠️

### Pricing Module
- [ ] Complete Stripe checkout integration
- [ ] Add subscription management portal
- [ ] Implement usage-based pricing tiers
- [ ] Add promotional code support
- [ ] Create pricing API endpoints
- [ ] Add A/B testing for pricing

### Features Showcase
- [ ] Create interactive feature demos
- [ ] Add feature comparison matrix
- [ ] Implement feature search/filter
- [ ] Add video demonstrations
- [ ] Create feature request form

### Blog System
- [ ] Implement MDX support for articles
- [ ] Add blog categories and tags
- [ ] Create author profiles
- [ ] Add comment system
- [ ] Implement RSS feed
- [ ] Add newsletter signup

### Landing Pages
- [ ] Create school-specific landing pages
- [ ] Add social proof widgets
- [ ] Implement exit-intent popups
- [ ] Add live chat integration
- [ ] Create case study pages

## UI/UX Improvements (Priority 5) 🎨

### Accessibility
- [ ] Add ARIA labels to all interactive elements
- [ ] Ensure keyboard navigation works
- [ ] Test with screen readers
- [ ] Add skip navigation links
- [ ] Implement focus management

### Responsive Design
- [ ] Fix mobile navigation issues
- [ ] Optimize tablet layouts
- [ ] Test on various screen sizes
- [ ] Improve touch targets for mobile
- [ ] Add responsive typography

### Dark Mode
- [ ] Ensure all components support dark mode
- [ ] Fix contrast issues in dark theme
- [ ] Add theme-aware images
- [ ] Test dark mode thoroughly

### RTL Support
- [ ] Use CSS logical properties
- [ ] Test all layouts in Arabic
- [ ] Fix directional icons
- [ ] Ensure proper text alignment

## Testing Requirements (Priority 6) 🧪

### Unit Tests
- [ ] Add tests for pricing calculations
- [ ] Test form validations
- [ ] Test utility functions
- [ ] Test custom hooks

### Integration Tests
- [ ] Test Stripe checkout flow
- [ ] Test form submissions
- [ ] Test API endpoints
- [ ] Test authentication flows

### E2E Tests
- [ ] Test complete signup flow
- [ ] Test pricing page interactions
- [ ] Test blog navigation
- [ ] Test responsive layouts

### Visual Regression
- [ ] Set up visual testing for marketing pages
- [ ] Create baseline screenshots
- [ ] Test across browsers
- [ ] Monitor for UI regressions

## SEO & Analytics (Priority 7) 📊

### SEO Optimization
- [ ] Add structured data markup
- [ ] Optimize meta descriptions
- [ ] Implement canonical URLs
- [ ] Add XML sitemap
- [ ] Optimize page load speed
- [ ] Add Open Graph tags

### Analytics Implementation
- [ ] Set up conversion tracking
- [ ] Implement funnel analytics
- [ ] Add heatmap tracking
- [ ] Track user behavior
- [ ] Set up A/B testing framework
- [ ] Monitor Core Web Vitals

### Performance Monitoring
- [ ] Set up performance budgets
- [ ] Monitor bundle sizes
- [ ] Track page load times
- [ ] Monitor API response times
- [ ] Set up error tracking

## Content Management (Priority 8) 📝

### CMS Integration
- [ ] Evaluate headless CMS options
- [ ] Implement content versioning
- [ ] Add content preview
- [ ] Create content templates
- [ ] Set up content workflow

### Localization
- [ ] Extract all strings to translation files
- [ ] Set up translation management
- [ ] Add language switcher
- [ ] Localize images and videos
- [ ] Test RTL languages

## Migration & Cleanup (Priority 9) 🧹

### Legacy Code Removal
- [ ] Archive `backup-SDG` folder
- [ ] Remove unused components
- [ ] Clean up duplicate code
- [ ] Update deprecated APIs
- [ ] Remove console.logs

### Documentation
- [ ] Document component APIs
- [ ] Add usage examples
- [ ] Create style guide
- [ ] Document best practices
- [ ] Add troubleshooting guide

## Future Enhancements 🚀

### Advanced Features
- [ ] Implement personalization
- [ ] Add recommendation engine
- [ ] Create interactive demos
- [ ] Add virtual tours
- [ ] Implement chatbot support

### Integrations
- [ ] Add CRM integration
- [ ] Connect marketing automation
- [ ] Integrate analytics platforms
- [ ] Add social media feeds
- [ ] Connect review platforms

## Acceptance Criteria

All implementations must:
1. Follow the typography system (no hardcoded text classes)
2. Use Server Components by default
3. Include proper TypeScript types
4. Have loading and error states
5. Be fully accessible
6. Support RTL languages
7. Include appropriate tests
8. Follow ShadCN UI patterns
9. Be optimized for performance
10. Include proper documentation

## Dependencies
- Next.js 15.4.4
- React 19.1.0
- ShadCN UI
- Tailwind CSS v4
- Stripe
- React Hook Form
- Zod

## References
- [CLAUDE.md](../../../CLAUDE.md) - Architecture guidelines
- [Typography System](../../styles/typography.css)
- [Marketing Best Practices](https://nextjs.org/docs/app/building-your-application)
- [Stripe Documentation](https://stripe.com/docs)
# Invoice Components - Issues & Backlog

Status legend: [x] done, [~] in progress, [ ] todo

## Critical Architecture Issues (Priority 1) 🔴

### Code Organization Cleanup
- [ ] **CRITICAL**: Remove `_component/` legacy folder
- [ ] **CRITICAL**: Clean up `actions/` legacy folder
- [ ] Consolidate duplicate invoice creation logic
- [ ] Standardize file naming to kebab-case
- [ ] Move to proper mirror pattern structure

### TypeScript Type Safety
- [ ] Fix all `any` type usage in actions
- [ ] Add proper error type definitions
- [ ] Complete type definitions for complex objects
- [ ] Create shared types in `type.ts`
- [ ] Add type guards for external data

## Standardization Issues (Priority 2) ⚠️

### Missing Required Files
- [ ] Create `constant.ts` for invoice statuses and enums
- [ ] Create `hooks.ts` for custom React hooks
- [ ] Create `utils.ts` for calculation utilities
- [ ] Reorganize `steps/` into proper structure
- [ ] Create `card.tsx` for invoice cards
- [ ] Create `all.tsx` for invoice list view
- [ ] Create `detail.tsx` for invoice detail view

### File Structure Standardization
- [ ] Rename files to follow kebab-case convention
- [ ] Organize components by feature
- [ ] Separate client and server components
- [ ] Create proper folder hierarchy

## Performance Issues (Priority 3) 🚀

### Server-Side Optimization
- [ ] Move all filtering to server-side
- [ ] Implement proper pagination
- [ ] Add data caching strategy
- [ ] Optimize database queries
- [ ] Add indexes for frequently queried fields

### Client-Side Optimization
- [ ] Implement optimistic UI updates
- [ ] Add React.memo for expensive components
- [ ] Lazy load heavy components
- [ ] Optimize bundle size
- [ ] Add virtualization for large lists

## Testing Requirements (Priority 4) 🧪

### Unit Tests
- [ ] Test invoice calculations
- [ ] Test tax calculations
- [ ] Test discount logic
- [ ] Test date utilities
- [ ] Test validation schemas

### Integration Tests
- [ ] Test invoice creation flow
- [ ] Test invoice update flow
- [ ] Test invoice deletion
- [ ] Test email sending
- [ ] Test PDF generation

### E2E Tests
- [ ] Test complete invoice workflow
- [ ] Test multi-step form
- [ ] Test search and filtering
- [ ] Test pagination
- [ ] Test status updates

## Feature Implementation (Priority 5) 🛠️

### Invoice Management
- [ ] Implement recurring invoices
- [ ] Add invoice templates
- [ ] Create invoice duplication
- [ ] Add batch operations
- [ ] Implement invoice scheduling

### Payment Integration
- [ ] Add payment gateway integration
- [ ] Implement payment reminders
- [ ] Create payment history
- [ ] Add partial payments
- [ ] Implement refunds

### Reporting & Analytics
- [ ] Create invoice dashboard
- [ ] Add revenue reports
- [ ] Implement aging reports
- [ ] Create client statements
- [ ] Add export functionality

### Multi-Currency Support
- [ ] Add currency selection
- [ ] Implement exchange rates
- [ ] Create currency conversion
- [ ] Add multi-currency reports

## UI/UX Improvements (Priority 6) 🎨

### Form Improvements
- [ ] Enhance multi-step form UX
- [ ] Add form validation feedback
- [ ] Implement auto-save
- [ ] Add keyboard shortcuts
- [ ] Improve mobile experience

### Table Enhancements
- [ ] Add column customization
- [ ] Implement bulk selection
- [ ] Add advanced filters
- [ ] Create saved filter sets
- [ ] Add export options

### Visual Enhancements
- [ ] Create invoice preview
- [ ] Add status timeline
- [ ] Implement activity feed
- [ ] Add visual indicators
- [ ] Create better empty states

## Accessibility (Priority 7) ♿

### ARIA Support
- [ ] Add proper ARIA labels
- [ ] Implement focus management
- [ ] Add keyboard navigation
- [ ] Create skip links
- [ ] Add screen reader support

### Keyboard Navigation
- [ ] Enable tab navigation
- [ ] Add keyboard shortcuts
- [ ] Implement focus trapping
- [ ] Add escape key handling

## Email & Notifications (Priority 8) 📧

### Email Templates
- [ ] Create HTML email templates
- [ ] Add plain text fallback
- [ ] Implement email customization
- [ ] Add email preview
- [ ] Create email tracking

### Notifications
- [ ] Add in-app notifications
- [ ] Implement push notifications
- [ ] Create notification preferences
- [ ] Add notification history

## PDF Generation (Priority 9) 📄

### PDF Features
- [ ] Implement PDF generation
- [ ] Add custom PDF templates
- [ ] Create PDF preview
- [ ] Add digital signatures
- [ ] Implement PDF customization

## Security Enhancements (Priority 10) 🔒

### Data Security
- [ ] Implement field-level encryption
- [ ] Add audit logging
- [ ] Create access controls
- [ ] Implement data retention policies
- [ ] Add activity monitoring

### Multi-Tenant Safety
- [ ] Verify schoolId scoping in all queries
- [ ] Add cross-tenant protection
- [ ] Implement data isolation tests
- [ ] Create tenant-specific validations

## Documentation (Priority 11) 📚

### Code Documentation
- [ ] Add JSDoc comments
- [ ] Create API documentation
- [ ] Write usage examples
- [ ] Document business logic
- [ ] Create troubleshooting guide

### User Documentation
- [ ] Create user guide
- [ ] Add video tutorials
- [ ] Write FAQ section
- [ ] Create quick start guide

## Migration & Cleanup (Priority 12) 🧹

### Legacy Code Removal
- [ ] Remove unused components
- [ ] Clean up dead code
- [ ] Update deprecated APIs
- [ ] Remove console.logs
- [ ] Clean up comments

### Data Migration
- [ ] Create migration scripts
- [ ] Add data validation
- [ ] Implement rollback strategy
- [ ] Create backup procedures

## Acceptance Criteria

All implementations must:
1. Follow the mirror pattern architecture
2. Use Server Components by default
3. Include proper TypeScript types
4. Have comprehensive error handling
5. Include loading and error states
6. Be fully accessible
7. Support multi-tenancy with schoolId
8. Include appropriate tests
9. Follow ShadCN UI patterns
10. Be optimized for performance

## Technical Debt

### High Priority
1. Remove `_component/` folder
2. Clean up `actions/` folder
3. Fix TypeScript `any` usage
4. Standardize file naming

### Medium Priority
1. Consolidate duplicate logic
2. Optimize database queries
3. Add missing tests
4. Improve error handling

### Low Priority
1. Add code comments
2. Update documentation
3. Optimize bundle size
4. Add telemetry

## Dependencies
- Next.js 15.4.4
- React 19.1.0
- ShadCN UI
- React Hook Form
- Zod
- Prisma
- @tanstack/react-table

## References
- [CLAUDE.md](../../../CLAUDE.md) - Architecture guidelines
- [Server Actions](https://nextjs.org/docs/app/api-reference/functions/server-actions)
- [Prisma Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)
- [React Hook Form](https://react-hook-form.com/)
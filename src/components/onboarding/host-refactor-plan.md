# Host Feature Refactor Plan (Architecture Compliance)

## Overview
This plan outlines the steps required to refactor the `host` feature to fully comply with the architecture rules defined in the project. The goal is to achieve modularity, reusability, type safety, and maintainability by following standardized file patterns, component layering, and documentation practices.

---

## Phase 1: File Structure Reorganization

### 1.1 Rename Files to Standard Patterns
- `action.ts` → `actions.ts`
- `use-listing.tsx` → `use-listing.ts`
- `readme.md` → `README.md`
- `issue.md` → `ISSUE.md`

### 1.2 Create Missing Standard Files
- `validation.ts` — Zod schemas for form validation
- `form.tsx` — Main form components
- `cards.tsx` — Card-based UI components
- `content.tsx` — General UI content components
- `featured.tsx` — Featured/hero components
- `utils.ts` — Utility functions

### 1.3 Reorganize Component Structure
- Move atomic UI elements to `atoms/`
- Move layout/structural components to `templates/`
- Keep business logic and feature-specific components in `host/`

---

## Phase 2: Component Refactoring

### 2.1 Extract Form Components
- Consolidate form logic into `form.tsx`
- Centralize validation and state management

### 2.2 Create Card Components
- Consolidate `listing-card.tsx`, `amenities-card.tsx`, `selection-card.tsx`, `new-listing-options.tsx` into `cards.tsx`

### 2.3 Create Content Components
- Consolidate `steps-overview.tsx`, `step-title.tsx`, `step-header.tsx`, `host-step-header.tsx` into `content.tsx`

### 2.4 Create Featured Components
- Add `featured.tsx` for hero/featured content

---

## Phase 3: Type Safety & Validation

### 3.1 Enhance `types.ts`
- Add missing interfaces and generics
- Ensure comprehensive type coverage

### 3.2 Create `validation.ts`
- Zod schemas for all forms and APIs
- Centralize error messages

### 3.3 Create `utils.ts`
- Data formatting, helper functions, calculations

---

## Phase 4: Hook Organization

### 4.1 Refactor `use-listing.tsx`
- Rename to `use-listing.ts`
- Improve type safety and error handling

### 4.2 Create Additional Hooks
- `use-host-steps.ts` — Step navigation logic
- `use-listing-form.ts` — Form state management
- `use-listing-validation.ts` — Validation logic

---

## Phase 5: Documentation & Standards

### 5.1 Update `README.md`
- Feature overview, usage, architecture notes, guidelines

### 5.2 Update `ISSUE.md`
- Known issues, feature requests, bug tracking, todos

### 5.3 Export Patterns
- Use named exports for all components
- Use default exports only for pages
- Create proper `index.ts` barrel exports

---

## Phase 6: Constants & Configuration

### 6.1 Refactor `constants.ts`
- Organize by category
- Add TypeScript enums
- Remove hardcoded values

---

## Phase 7: Actions Refactoring

### 7.1 Rename and Restructure `actions.ts`
- Organize by functionality
- Add error handling and type safety

---

## Implementation Order
1. File Renaming
2. Create Missing Files
3. Component Layer Reorganization
4. Type Safety Enhancement
5. Hook Refactoring
6. Documentation Update
7. Constants & Actions

---

## Expected Benefits
- **Improved Discoverability**: Standard file patterns make code easier to find
- **Better Maintainability**: Clear separation of concerns
- **Enhanced Reusability**: Components properly layered
- **Type Safety**: Comprehensive TypeScript coverage
- **Developer Experience**: Consistent patterns across features
- **Documentation**: Clear usage guidelines

---

## Risk Mitigation
- Implement changes incrementally (by phase)
- Maintain backward compatibility during transition
- Test after each phase
- Update all references to renamed files 
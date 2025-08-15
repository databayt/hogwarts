# Host Flow Issues & Implementation Plan

## Overview
This document outlines the current issues in the host onboarding flow and provides a detailed implementation plan to address each concern.

## 🚨 Critical Issues to Address

### 1. ✅ Shadcn Components & Theme Consistency (COMPLETED)
**Issues Fixed:**
- ✅ Replaced all hard-coded colors (`text-gray-500`, `bg-gray-50`, etc.) with theme variables
- ✅ Updated components to use consistent shadcn components
- ✅ All components now use theme CSS variables

**Examples of Issues Found:**
```tsx
// ❌ Hard-coded colors (found in description/page.tsx)
className="text-neutral-700"
className="border-black bg-gray-50"
className="text-gray-500"

// ❌ Not using shadcn components consistently
<div className="border border-neutral-300"> // Should use Card/Border
```

**Solution Implementation:**
```tsx
// ✅ Use theme variables
className="text-foreground"
className="border-foreground bg-accent"
className="text-muted-foreground"

// ✅ Use shadcn components
<Card className="border">
<Button variant="outline">
```

**Tasks:**
- [x] Audit all host components for hard-coded colors
- [x] Replace all hardcoded colors with theme variables
- [x] Ensure all interactive elements use shadcn components
- [x] Update color palette to use `text-foreground`, `text-muted-foreground`, `bg-background`, `bg-accent`, etc.

**Components Updated:**
- [x] `src/app/host/[id]/description/page.tsx`
- [x] `src/app/host/[id]/floor-plan/page.tsx`
- [x] `src/app/host/[id]/photos/page.tsx`
- [x] `src/app/host/[id]/title/page.tsx`
- [x] `src/app/host/[id]/instant-book/page.tsx`
- [x] `src/app/host/[id]/visibility/page.tsx`
- [x] `src/app/host/[id]/discount/page.tsx`
- [x] `src/components/host/selection-card.tsx`
- [x] `src/components/host/steps-overview.tsx`

### 2. ✅ Typography System Integration (COMPLETED)
**Issues Fixed:**
- ✅ Consistent typography classes across all components
- ✅ All components now use configured typography from `@typography.css`
- ✅ Semantic typography replacing manual font sizing

**Examples of Issues:**
```tsx
// ❌ Manual typography
<h3 className="text-xl font-medium">Title</h3>
<p className="text-sm text-gray-500">Description</p>

// ✅ Should use configured typography
<h3>Title</h3>  // Uses configured h3 styles
<p>Description</p>  // Uses configured p styles
```

**Solution Implementation:**
- [x] Remove manual font classes from all components
- [x] Use semantic HTML elements (h1, h2, h3, p) with configured styles
- [x] Add custom typography classes where needed (.lead, .muted, .display, etc.)
- [x] Ensure consistent text hierarchy across all steps

**Typography Enhancements Made:**
- [x] Added `.display` class in `typography.css` for large text elements
- [x] Removed `text-lg`, `text-sm`, `text-xl`, `font-medium`, `font-bold` from components
- [x] Semantic HTML now uses configured styles automatically
- [x] All components follow consistent typography hierarchy

### 3. Atom Components for Reusability
**Current Issues:**
- ❌ Repetitive patterns not abstracted (title + description combos)
- ❌ Limited atom components in `src/components/host`
- ❌ Components doing too much instead of being composed

**Needed Atom Components:**
```tsx
// src/components/host/
├── step-title.tsx           // Title + description wrapper
├── amenities-card.tsx       // Grid layout for selections
├── privacy-card.tsx       // Grid layout for selections
├── sturcture-card.tsx       // Grid layout for selections
├── book-card.tsx       // Grid layout for selections
├── visibility-card.tsx       // Grid layout for selection
├── form-field.tsx          // Input field with label
├── counter.tsx             // Number counter component
├── progress-indicator.tsx   // Step progress display
├── column-layout.tsx   // Reusable 2-column layout
└── step-wrapper.tsx        // Standard step container
```

**Implementation Example:**
```tsx
// ✅ Atom component example
<StepTitle 
  title="Which of these best describes your place?"
  description="Choose the option that best matches your property type."
/>

<SelectionGrid columns={2}>
  {options.map(option => (
    <SelectionCard key={option.id} {...option} />
  ))}
</SelectionGrid>
```

**Tasks:**
- [ ] Create StepTitle atom component
- [ ] Create SelectionGrid atom component
- [ ] Create FormField atom component
- [ ] Create Counter atom component
- [ ] Create ProgressIndicator atom component
- [ ] Refactor existing components to use atoms

### 4. Desktop Layout Optimization
**Current Issues:**
- ❌ Inconsistent column ratios (50/50, 1/3, etc.)
- ❌ No standardized responsive wrapper
- ❌ Manual grid implementations everywhere

**Solution - Layout Wrapper System:**
```tsx
// src/components/atom/layout-wrapper.tsx
interface LayoutWrapperProps {
  leftRatio?: '1/3' | '1/2' | '2/3';
  rightRatio?: '2/3' | '1/2' | '1/3';
  gap?: 'sm' | 'md' | 'lg' | 'xl';
  children: [React.ReactNode, React.ReactNode];
}

// Usage examples
<LayoutWrapper leftRatio="1/3" rightRatio="2/3" gap="xl">
  <StepTitle title="..." description="..." />
  <SelectionGrid>{children}</SelectionGrid>
</LayoutWrapper>

<LayoutWrapper leftRatio="1/2" rightRatio="1/2" gap="lg">
  <StepContent />
  <StepIllustration />
</LayoutWrapper>
```

**Tasks:**
- [ ] Create LayoutWrapper atom component
- [ ] Define standard layout ratios (1/3-2/3, 1/2-1/2, 2/3-1/3)
- [ ] Replace all manual grid implementations
- [ ] Add responsive breakpoints for mobile

### 5. Navigation Optimization
**Current Issues:**
- ❌ Complex navigation logic in HostFooter
- ❌ Validation context could be more intuitive
- ❌ Custom navigation overrides are complex

**Solution - Enhanced Navigation System:**
```tsx
// Enhanced validation context
interface HostValidationContext {
  // Current functionality
  enableNext: () => void;
  disableNext: () => void;
  isNextDisabled: boolean;
  
  // Enhanced functionality
  setValidationRules: (rules: ValidationRule[]) => void;
  validateStep: () => Promise<boolean>;
  setStepData: (data: any) => void;
  getStepData: () => any;
  
  // Progress tracking
  currentStep: number;
  totalSteps: number;
  progressPercentage: number;
}

// Simplified step wrapper
interface StepWrapperProps {
  stepKey: string;
  validation?: ValidationRule[];
  onNext?: (data: any) => void | Promise<void>;
  onBack?: () => void;
  autoSave?: boolean;
}
```

**Tasks:**
- [ ] Simplify HostFooter navigation logic
- [ ] Enhance validation context with better API
- [ ] Add step-level validation rules
- [ ] Implement auto-validation on data change
- [ ] Add progress calculation helpers

### 6. Server Actions & Form Handling
**Current Issues:**
- ❌ No data persistence
- ❌ No form validation with Zod schemas
- ❌ No server actions for data submission
- ❌ No Prisma integration

**Solution Implementation:**
```typescript
// lib/schemas/host.ts
export const PropertySchema = z.object({
  type: z.enum(['house', 'apartment', 'room']),
  privacyType: z.enum(['entire', 'private', 'shared']),
  title: z.string().min(10).max(100),
  description: z.string().min(50).max(500),
  // ... other fields
});

// lib/actions/host-actions.ts
export async function saveHostData(step: string, data: any) {
  const validatedData = PropertySchema.partial().parse(data);
  
  return await prisma.listing.upsert({
    where: { id: data.listingId },
    update: validatedData,
    create: { ...validatedData, userId: data.userId }
  });
}

// In components
const { register, handleSubmit, formState } = useForm({
  resolver: zodResolver(PropertySchema.partial())
});
```

**Tasks:**
- [ ] Create Zod schemas for each step
- [ ] Implement server actions for data saving
- [ ] Add React Hook Form integration
- [ ] Set up Prisma models for listings
- [ ] Add form validation UI feedback

### 7. Real-time Data Persistence
**Current Issues:**
- ❌ Data lost on page refresh
- ❌ No auto-saving functionality
- ❌ No data retrieval from database

**Solution Implementation:**
```tsx
// Auto-save hook
const useAutoSave = (stepKey: string, data: any, delay = 2000) => {
  const [isSaving, setIsSaving] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (data && Object.keys(data).length > 0) {
        setIsSaving(true);
        await saveHostData(stepKey, data);
        setIsSaving(false);
      }
    }, delay);
    
    return () => clearTimeout(timer);
  }, [data, stepKey, delay]);
  
  return isSaving;
};

// Data provider
const HostDataProvider = ({ children, listingId }) => {
  const [data, setData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  
  // Load data on mount
  useEffect(() => {
    loadHostData(listingId).then(setData).finally(() => setIsLoading(false));
  }, [listingId]);
  
  return (
    <HostDataContext.Provider value={{ data, setData, isLoading }}>
      {children}
    </HostDataContext.Provider>
  );
};
```

**Tasks:**
- [ ] Create HostDataProvider context
- [ ] Implement auto-save functionality
- [ ] Add data loading on page load
- [ ] Show saving/loading states
- [ ] Handle offline scenarios

### 8. Authentication Protection
**Current Issues:**
- ❌ Host routes not protected
- ❌ No user authentication checks
- ❌ No role-based access

**Solution Implementation:**
```tsx
// middleware.ts
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  if (pathname.startsWith('/host')) {
    const session = await getServerSession();
    
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    // Check if user can create listings
    if (!session.user?.canHost) {
      return NextResponse.redirect(new URL('/upgrade', request.url));
    }
  }
}

// In layout
const HostLayout = ({ children }) => {
  return (
    <SessionProvider>
      <ProtectedRoute requiredRole="host">
        <HostValidationProvider>
          {children}
        </HostValidationProvider>
      </ProtectedRoute>
    </SessionProvider>
  );
};
```

**Tasks:**
- [ ] Add middleware for route protection
- [ ] Implement session checking
- [ ] Add role-based access control
- [ ] Create login redirect flow
- [ ] Add user permission checks

## 📋 Implementation Priority

### Phase 1: ✅ Core Improvements (COMPLETED)
1. **✅ Shadcn & Theme Consistency**
   - ✅ Audit and fix all hard-coded colors
   - ✅ Ensure all components use theme variables
   - ✅ Replace manual styling with shadcn components

2. **✅ Typography System**
   - ✅ Remove manual font classes
   - ✅ Use semantic HTML with configured styles
   - ✅ Ensure consistent hierarchy

### Phase 2: Component Architecture (Week 2-3)
3. **Atom Components**
   - Create StepTitle, SelectionGrid, FormField atoms
   - Refactor existing components to use atoms
   - Build reusable layout wrappers

4. **Layout Optimization**
   - Create LayoutWrapper system
   - Standardize column ratios
   - Add responsive design

### Phase 3: Data & Navigation (Week 3-4)
5. **Navigation Enhancement**
   - Simplify validation context
   - Add step-level validation
   - Improve progress tracking

6. **Form Handling**
   - Create Zod schemas
   - Implement React Hook Form
   - Add server actions

### Phase 4: Persistence & Security (Week 4-5)
7. **Data Persistence**
   - Add auto-save functionality
   - Implement data loading
   - Create data provider context

8. **Authentication**
   - Add route protection
   - Implement session checks
   - Add role-based access

## 🎯 Success Criteria

### Code Quality
- [ ] Zero hard-coded colors
- [ ] All components use shadcn
- [ ] Consistent typography throughout
- [ ] No repetitive code patterns

### User Experience
- [ ] Seamless navigation between steps
- [ ] Auto-saving data preservation
- [ ] Clear progress indication
- [ ] Responsive design on all devices

### Technical Standards
- [ ] TypeScript strict mode compliance
- [ ] Zod schema validation
- [ ] Server action integration
- [ ] Prisma database integration
- [ ] Authentication protection

### Performance
- [ ] Fast page transitions
- [ ] Optimized re-renders
- [ ] Efficient data loading
- [ ] Minimal bundle size

## 🔧 Development Guidelines

### Component Creation Standards
```tsx
// ✅ Follow this pattern for new components
interface ComponentProps {
  // Props interface with clear typing
}

const Component: React.FC<ComponentProps> = ({ 
  // Destructured props with defaults
}) => {
  // Hooks at top
  // Event handlers
  // Render logic
  
  return (
    <div className="theme-class"> {/* Use theme classes */}
      <h3>Semantic HTML</h3> {/* Use semantic typography */}
      <Card> {/* Use shadcn components */}
        {/* Component content */}
      </Card>
    </div>
  );
};

export default Component;
```

### File Naming Conventions
- Components: `kebab-case.tsx`
- Hooks: `use-kebab-case.ts`
- Utils: `kebab-case.ts`
- Types: `kebab-case.types.ts`
- Schemas: `kebab-case.schema.ts`

### Testing Requirements
- [ ] Unit tests for all atom components
- [ ] Integration tests for step flows
- [ ] E2E tests for complete onboarding
- [ ] Form validation testing

This comprehensive plan will transform the host flow into a robust, maintainable, and user-friendly onboarding experience.

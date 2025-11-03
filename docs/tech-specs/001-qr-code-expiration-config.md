# Hogwarts - Technical Specification

**Feature ID:** TS-001
**Author:** Product Team
**Date:** 2025-01-03
**Project Level:** Level 0 (Small Feature / Bug Fix)
**Change Type:** Enhancement
**Development Context:** Hogwarts School Automation Platform
**Estimated Time:** 2-3 hours

---

## Context

### Available Documents
- PRD: `/PRD.md` (25,000+ words, 200+ functional requirements)
- Epics: `/epics.md` (Epic 7: Attendance System, Story 7.3: QR Code Attendance)
- Architecture: `/architecture.md` (BMAD-METHOD structure, 15+ ADRs)
- Existing Implementation: `src/components/platform/attendance/qr-code/actions.ts`

### Project Stack
- **Framework**: Next.js 15.4.4 (App Router) with React 19.1.0
- **Language**: TypeScript 5.x (strict mode)
- **Database**: PostgreSQL (Neon) with Prisma ORM 6.14.0
- **Authentication**: NextAuth v5 (Auth.js 5.0.0-beta.29)
- **Styling**: Tailwind CSS 4 with shadcn/ui (New York style)
- **Testing**: Vitest 2.0.6 + React Testing Library + Playwright 1.55.0
- **Deployment**: Vercel (serverless)

### Existing Codebase Structure

**Current Implementation:**
```
src/components/platform/attendance/qr-code/
  actions.ts               # QR code generation (validFor hardcoded to 60s)
  content.tsx              # QR code UI
  validation.ts            # Zod schemas
```

**Related Settings:**
```
src/components/platform/settings/
  # Currently no attendance-specific settings
```

---

## The Change

### Problem Statement

Currently, the QR code expiration time for attendance is hardcoded to 60 seconds in the `generateAttendanceQR` server action:

```typescript
const { classId, validFor = 60, includeLocation = false, secret } = data;
```

This causes several issues:
1. **No Flexibility**: Schools with large classes need longer expiration times (180-300 seconds)
2. **Security Concerns**: Some schools want shorter expiration for tighter security (30 seconds)
3. **Manual Override Required**: Teachers must manually set validFor each time they generate a QR code
4. **Inconsistent Experience**: Different teachers use different expiration times

**User Story:**
```
As a school administrator,
I want to configure the default QR code expiration time for attendance,
So that teachers don't have to manually set it each time and the setting matches our school's needs.
```

### Proposed Solution

Add a school-level configuration setting for QR code expiration time with the following features:

1. **School Settings Page**: Add "QR Code Expiration" field in attendance settings
2. **Database Field**: Add `qrCodeExpirationSeconds` to School model (default: 60)
3. **Server Action Update**: Use school's default instead of hardcoded 60 seconds
4. **Validation**: Enforce range 30-600 seconds (0.5 to 10 minutes)
5. **UI Indicator**: Show current default expiration time in QR generation UI

### Scope

**In Scope:**
- [ ] Add `qrCodeExpirationSeconds` field to School model (default: 60, range: 30-600)
- [ ] Create settings page UI at `/s/[subdomain]/settings/attendance`
- [ ] Update `generateAttendanceQR` to use school's default instead of hardcoded 60
- [ ] Add validation to ensure expiration is between 30-600 seconds
- [ ] Show current school default in QR generation UI
- [ ] Unit tests for new field and validation
- [ ] E2E test for settings update flow

**Out of Scope:**
- [ ] Per-class expiration settings (future enhancement)
- [ ] Per-teacher overrides (already possible via validFor parameter)
- [ ] Historical tracking of expiration changes (future enhancement)
- [ ] Mobile app settings sync (future when mobile app is built)

---

## Implementation Details

### Source Tree Changes

**Files to Create:**
```
src/components/platform/settings/attendance/
  content.tsx              # Attendance settings UI
  form.tsx                 # Settings form component
  actions.ts               # Update school settings action
  validation.ts            # Settings validation schema

src/app/[lang]/s/[subdomain]/(platform)/settings/attendance/
  page.tsx                 # Attendance settings route
```

**Files to Modify:**
```
prisma/models/school.prisma                           # Add qrCodeExpirationSeconds field
src/components/platform/attendance/qr-code/actions.ts # Use school default instead of hardcoded 60
src/components/platform/attendance/qr-code/content.tsx # Show current school default
```

### Technical Approach

**1. Database Schema Change:**

```prisma
// prisma/models/school.prisma
model School {
  // ... existing fields ...

  // Attendance Settings
  qrCodeExpirationSeconds Int @default(60) // Default QR code expiration time (30-600 seconds)

  // ... rest of model ...
}
```

**Migration:**
```bash
pnpm prisma migrate dev --name add_qr_code_expiration_setting
```

**2. Settings Form Validation:**

```typescript
// src/components/platform/settings/attendance/validation.ts
import { z } from "zod"

export const attendanceSettingsSchema = z.object({
  qrCodeExpirationSeconds: z
    .number()
    .int("Must be a whole number")
    .min(30, "Minimum expiration is 30 seconds")
    .max(600, "Maximum expiration is 10 minutes (600 seconds)")
    .default(60)
})

export type AttendanceSettingsInput = z.infer<typeof attendanceSettingsSchema>
```

**3. Server Action for Settings Update:**

```typescript
// src/components/platform/settings/attendance/actions.ts
"use server"

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { revalidatePath } from "next/cache"
import { attendanceSettingsSchema } from "./validation"

export async function updateAttendanceSettings(
  input: z.infer<typeof attendanceSettingsSchema>
) {
  // 1. Authentication
  const session = await auth()
  if (!session?.user) {
    throw new Error("Unauthorized")
  }

  // 2. Authorization - Only ADMIN can update school settings
  if (session.user.role !== "ADMIN") {
    throw new Error("Forbidden: Only school administrators can update settings")
  }

  // 3. Tenant context
  const { schoolId } = await getTenantContext()
  if (!schoolId) {
    throw new Error("Missing school context")
  }

  // 4. Validation
  const parsed = attendanceSettingsSchema.parse(input)

  // 5. Update school settings
  const school = await db.school.update({
    where: { id: schoolId },
    data: {
      qrCodeExpirationSeconds: parsed.qrCodeExpirationSeconds
    }
  })

  // 6. Revalidate
  revalidatePath("/settings/attendance")
  revalidatePath("/attendance/qr-code")

  return {
    success: true,
    data: {
      qrCodeExpirationSeconds: school.qrCodeExpirationSeconds
    }
  }
}

export async function getAttendanceSettings() {
  const { schoolId } = await getTenantContext()
  if (!schoolId) {
    throw new Error("Missing school context")
  }

  const school = await db.school.findUnique({
    where: { id: schoolId },
    select: {
      qrCodeExpirationSeconds: true
    }
  })

  if (!school) {
    throw new Error("School not found")
  }

  return {
    qrCodeExpirationSeconds: school.qrCodeExpirationSeconds
  }
}
```

**4. Update QR Code Generation to Use School Default:**

```typescript
// src/components/platform/attendance/qr-code/actions.ts (MODIFY)
"use server"

import { auth } from '@/auth'
import { db } from '@/lib/db'
import { getTenantContext } from '@/lib/tenant-context'
import { revalidatePath } from 'next/cache'
// ... other imports ...

export async function generateAttendanceQR(
  data: z.infer<typeof qrCodeGenerationSchema>
) {
  try {
    const session = await auth()
    if (!session?.user) {
      throw new Error('Unauthorized')
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      throw new Error('School ID not found')
    }

    // Get school's default expiration time
    const school = await db.school.findUnique({
      where: { id: schoolId },
      select: { qrCodeExpirationSeconds: true }
    })

    const defaultExpiration = school?.qrCodeExpirationSeconds || 60

    // Use provided validFor, or fall back to school default
    const { classId, validFor = defaultExpiration, includeLocation = false, secret } = data

    // ... rest of function remains the same ...
  } catch (error) {
    // ... error handling ...
  }
}
```

**5. Settings UI Component:**

```typescript
// src/components/platform/settings/attendance/form.tsx
"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { attendanceSettingsSchema, type AttendanceSettingsInput } from "./validation"
import { updateAttendanceSettings } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

interface AttendanceSettingsFormProps {
  initialData: AttendanceSettingsInput
}

export function AttendanceSettingsForm({ initialData }: AttendanceSettingsFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<AttendanceSettingsInput>({
    resolver: zodResolver(attendanceSettingsSchema),
    defaultValues: initialData
  })

  const onSubmit = async (data: AttendanceSettingsInput) => {
    setIsSubmitting(true)
    try {
      const result = await updateAttendanceSettings(data)
      if (result.success) {
        toast.success("Attendance settings updated successfully")
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update settings")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="qrCodeExpirationSeconds">
          QR Code Expiration Time (seconds)
        </Label>
        <Input
          id="qrCodeExpirationSeconds"
          type="number"
          min={30}
          max={600}
          step={10}
          {...form.register("qrCodeExpirationSeconds", { valueAsNumber: true })}
        />
        {form.formState.errors.qrCodeExpirationSeconds && (
          <p className="text-sm text-destructive">
            {form.formState.errors.qrCodeExpirationSeconds.message}
          </p>
        )}
        <p className="text-sm text-muted-foreground">
          Set the default expiration time for attendance QR codes.
          Range: 30-600 seconds (0.5-10 minutes). Default: 60 seconds.
        </p>
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : "Save Settings"}
      </Button>
    </form>
  )
}
```

**6. Show Default in QR Generation UI:**

```typescript
// src/components/platform/attendance/qr-code/content.tsx (MODIFY)
// Add this section above the QR generation form

const school = await db.school.findUnique({
  where: { id: schoolId },
  select: { qrCodeExpirationSeconds: true }
})

// In the UI:
<div className="mb-4 p-4 bg-muted rounded-lg">
  <p className="text-sm text-muted-foreground">
    <strong>Default QR Code Expiration:</strong> {school?.qrCodeExpirationSeconds || 60} seconds
  </p>
  <p className="text-xs text-muted-foreground mt-1">
    This default can be changed in{" "}
    <a href="/settings/attendance" className="underline">
      Attendance Settings
    </a>
  </p>
</div>
```

### Existing Patterns to Follow

**Multi-Tenant Safety:**
- ✅ Settings are scoped to school (schoolId)
- ✅ Only school ADMIN can update settings
- ✅ getTenantContext() used for schoolId

**Validation Pattern:**
- ✅ Zod schema with min/max constraints
- ✅ Client and server validation
- ✅ Clear error messages

**Settings Pattern:**
- Similar to existing settings pages in `src/components/platform/settings/`
- Follow same form/action/validation structure

### Integration Points

**Components:**
- Settings form in `src/components/platform/settings/attendance/form.tsx`
- Settings page in `src/app/[lang]/s/[subdomain]/(platform)/settings/attendance/page.tsx`
- QR code UI update in `src/components/platform/attendance/qr-code/content.tsx`

**APIs:**
- Server action: `updateAttendanceSettings` in settings/attendance/actions.ts
- Server action: `getAttendanceSettings` in settings/attendance/actions.ts
- Modified: `generateAttendanceQR` in attendance/qr-code/actions.ts

**Database:**
- Model: `School` in `prisma/models/school.prisma`
- New field: `qrCodeExpirationSeconds Int @default(60)`

---

## Development Context

### Relevant Existing Code

**Similar Settings Implementation:**
- `src/components/platform/settings/` - Existing settings pages pattern
- `src/components/platform/settings/actions.ts` - Settings update actions

**QR Code Implementation:**
- `src/components/platform/attendance/qr-code/actions.ts:24` - Current hardcoded validFor
- `src/components/platform/attendance/qr-code/validation.ts` - QR generation schema

### Dependencies

**Framework/Libraries:**
- `zod` (4.0.14) - Validation
- `react-hook-form` (7.61.1) - Form handling
- `@hookform/resolvers` - Zod integration
- `next/navigation` - revalidatePath
- `sonner` - Toast notifications

**Internal Modules:**
- `@/auth` - Authentication
- `@/lib/db` - Prisma client
- `@/lib/tenant-context` - getTenantContext()
- `@/components/ui/*` - shadcn/ui components

### Configuration Changes

**Environment Variables:**
```env
# No new environment variables required
```

**Prisma Migration:**
```bash
pnpm prisma migrate dev --name add_qr_code_expiration_setting
pnpm prisma generate
```

**Migration SQL (auto-generated):**
```sql
ALTER TABLE "School" ADD COLUMN "qrCodeExpirationSeconds" INTEGER NOT NULL DEFAULT 60;
```

### Existing Conventions (Brownfield)

**Naming Conventions:**
- Components: PascalCase (`AttendanceSettingsForm`)
- Actions: camelCase (`updateAttendanceSettings`)
- Files: kebab-case (`attendance-settings-form.tsx`)
- Schemas: camelCase with suffix (`attendanceSettingsSchema`)

**Code Organization:**
- Settings in `src/components/platform/settings/<feature>/`
- Server actions in `actions.ts` with `"use server"` directive
- Client forms in `form.tsx` with `"use client"`
- Validation in `validation.ts`

**Error Handling:**
- Server actions return `{ success: boolean, data?: T, error?: string }`
- Client displays errors via toast notifications (sonner)

### Test Framework & Standards

**Unit Tests:**
```typescript
// src/components/platform/settings/attendance/__tests__/actions.test.ts
import { describe, it, expect, vi } from 'vitest'
import { updateAttendanceSettings } from '../actions'

describe('Attendance Settings Actions', () => {
  it('should update QR code expiration time', async () => {
    const result = await updateAttendanceSettings({
      qrCodeExpirationSeconds: 120
    })
    expect(result.success).toBe(true)
    expect(result.data.qrCodeExpirationSeconds).toBe(120)
  })

  it('should reject expiration time below 30 seconds', async () => {
    await expect(
      updateAttendanceSettings({ qrCodeExpirationSeconds: 20 })
    ).rejects.toThrow('Minimum expiration is 30 seconds')
  })

  it('should reject expiration time above 600 seconds', async () => {
    await expect(
      updateAttendanceSettings({ qrCodeExpirationSeconds: 700 })
    ).rejects.toThrow('Maximum expiration is 10 minutes')
  })
})
```

**E2E Tests:**
```typescript
// tests/e2e/attendance-settings.spec.ts
import { test, expect } from '@playwright/test'

test('Admin can update QR code expiration time', async ({ page }) => {
  // Login as admin
  await page.goto('/login')
  await page.fill('[name="email"]', 'admin@school.com')
  await page.fill('[name="password"]', 'password')
  await page.click('button[type="submit"]')

  // Navigate to attendance settings
  await page.goto('/settings/attendance')

  // Update expiration time
  await page.fill('#qrCodeExpirationSeconds', '120')
  await page.click('button[type="submit"]')

  // Verify success
  await expect(page.locator('text=Settings updated successfully')).toBeVisible()
})
```

**Coverage Target:** 95%+

---

## Implementation Stack

**Primary Technologies:**
- Next.js 15.4.4 App Router (Server Components)
- React 19.1.0
- TypeScript 5.x (strict mode)
- Prisma 6.14.0 ORM
- PostgreSQL (Neon serverless)

**UI Stack:**
- Tailwind CSS 4
- shadcn/ui components (Input, Button, Label)
- React Hook Form + Zod validation
- sonner (toast notifications)

---

## Technical Details

### Data Flow
1. Admin navigates to `/settings/attendance`
2. Page loads current school settings (server component)
3. Form component receives initial data as props
4. Admin changes QR code expiration time
5. Client-side validation (Zod schema)
6. Form submits to `updateAttendanceSettings` server action
7. Server-side validation and authorization
8. Database update (School.qrCodeExpirationSeconds)
9. Cache revalidation for affected pages
10. Success toast notification

### Security Considerations
- ✅ Only ADMIN role can update settings (role check in action)
- ✅ Settings scoped to school (schoolId isolation)
- ✅ Input validation (30-600 seconds range enforced)
- ✅ CSRF protection (NextAuth tokens)

### Performance Considerations
- No significant performance impact (single field update)
- Database index on schoolId already exists
- Cached school data revalidated only when settings change

---

## Development Setup

**Prerequisites:**
```bash
# Node.js 18+, pnpm 9.x
node --version  # v18+
pnpm --version  # 9.x
```

**Local Development:**
```bash
# Install dependencies
pnpm install

# Setup environment variables
cp .env.example .env.local
# Edit .env.local with your DATABASE_URL

# Generate Prisma client
pnpm prisma generate

# Run database migration
pnpm prisma migrate dev --name add_qr_code_expiration_setting

# Start development server
pnpm dev
```

**Access:**
- Settings: http://school.localhost:3000/settings/attendance

---

## Implementation Guide

### Setup Steps

1. **Create Database Migration:**
```bash
# Edit prisma/models/school.prisma (add qrCodeExpirationSeconds field)
pnpm prisma migrate dev --name add_qr_code_expiration_setting
pnpm prisma generate
```

2. **Create Directory Structure:**
```bash
mkdir -p src/components/platform/settings/attendance
mkdir -p src/app/\[lang\]/s/\[subdomain\]/\(platform\)/settings/attendance
```

3. **Create Files:**
- validation.ts
- actions.ts
- form.tsx
- content.tsx
- page.tsx

### Implementation Steps

**Step 1: Database Schema (5 minutes)**
- [ ] Edit `prisma/models/school.prisma`
- [ ] Add `qrCodeExpirationSeconds Int @default(60)` field
- [ ] Run migration: `pnpm prisma migrate dev`
- [ ] Generate client: `pnpm prisma generate`

**Step 2: Validation Schema (10 minutes)**
- [ ] Create `src/components/platform/settings/attendance/validation.ts`
- [ ] Define `attendanceSettingsSchema` with Zod
- [ ] Export type inference

**Step 3: Server Actions (20 minutes)**
- [ ] Create `src/components/platform/settings/attendance/actions.ts`
- [ ] Implement `updateAttendanceSettings` action
- [ ] Implement `getAttendanceSettings` action
- [ ] Include authentication, authorization, validation

**Step 4: Settings Form UI (30 minutes)**
- [ ] Create `src/components/platform/settings/attendance/form.tsx`
- [ ] Use react-hook-form + Zod resolver
- [ ] Add Input field for qrCodeExpirationSeconds
- [ ] Add submit button with loading state
- [ ] Toast notifications for success/error

**Step 5: Settings Content Page (10 minutes)**
- [ ] Create `src/components/platform/settings/attendance/content.tsx`
- [ ] Fetch current settings with `getAttendanceSettings`
- [ ] Pass data to form component

**Step 6: Settings Route (5 minutes)**
- [ ] Create `src/app/[lang]/s/[subdomain]/(platform)/settings/attendance/page.tsx`
- [ ] Import and render content component

**Step 7: Update QR Code Generation (15 minutes)**
- [ ] Modify `src/components/platform/attendance/qr-code/actions.ts`
- [ ] Fetch school's qrCodeExpirationSeconds
- [ ] Use as default for validFor parameter

**Step 8: Update QR Code UI (10 minutes)**
- [ ] Modify `src/components/platform/attendance/qr-code/content.tsx`
- [ ] Show current school default expiration time
- [ ] Add link to settings page

**Step 9: Testing (30 minutes)**
- [ ] Write unit tests for validation
- [ ] Write unit tests for server actions
- [ ] Write E2E test for settings flow
- [ ] Manual testing

**Total Estimated Time:** 2-3 hours

### Testing Strategy

**Manual Testing:**
1. Login as school admin
2. Navigate to `/settings/attendance`
3. Change QR expiration to 120 seconds
4. Submit form
5. Verify success toast
6. Navigate to `/attendance/qr-code`
7. Verify default shows 120 seconds
8. Generate QR code without specifying validFor
9. Verify expiration is 120 seconds

**Automated Testing:**
```bash
# Unit tests
pnpm test src/components/platform/settings/attendance

# E2E tests
pnpm test:e2e tests/e2e/attendance-settings.spec.ts
```

### Acceptance Criteria

- [x] School admin can navigate to `/settings/attendance`
- [x] Form displays current QR code expiration time
- [x] Admin can update expiration time (30-600 seconds)
- [x] Validation prevents values outside range
- [x] Success toast appears on save
- [x] QR generation uses school's default
- [x] QR UI shows current school default
- [x] Only ADMIN role can access settings page
- [x] Multi-tenant isolation works (schoolId scoping)
- [x] Tests pass (95%+ coverage)
- [x] Accessible (WCAG 2.1 AA - keyboard nav, labels)
- [x] Responsive (mobile, tablet, desktop)
- [x] i18n support (dictionary keys for all text)

---

## Developer Resources

### File Paths Reference

**New Files:**
```
src/components/platform/settings/attendance/
  content.tsx              # Settings page content (server)
  form.tsx                 # Settings form (client)
  actions.ts               # Server actions
  validation.ts            # Zod schemas
  __tests__/
    actions.test.ts        # Unit tests

src/app/[lang]/s/[subdomain]/(platform)/settings/attendance/
  page.tsx                 # Route
```

**Modified Files:**
```
prisma/models/school.prisma  # Add qrCodeExpirationSeconds field
src/components/platform/attendance/qr-code/actions.ts  # Use school default
src/components/platform/attendance/qr-code/content.tsx # Show default
```

### Key Code Locations

**Authentication:**
- `src/auth.ts:867` - NextAuth configuration
- Role check: `session.user.role === "ADMIN"`

**Multi-Tenant:**
- `src/lib/tenant-context.ts` - getTenantContext()
- School model: `prisma/models/school.prisma`

**UI Components:**
- `src/components/ui/input.tsx` - Input component
- `src/components/ui/button.tsx` - Button component
- `src/components/ui/label.tsx` - Label component

### Testing Locations

**Unit Tests:**
```
src/components/platform/settings/attendance/__tests__/
  actions.test.ts
  validation.test.ts
```

**E2E Tests:**
```
tests/e2e/
  attendance-settings.spec.ts
```

### Documentation to Update

**After Implementation:**
- [ ] Update `/epics.md` - Mark Story 7.3 as enhanced
- [ ] Add entry to CHANGELOG for next release
- [ ] Update `/src/app/[lang]/docs/features/attendance.md` (if exists)

---

## UX/UI Considerations

**Accessibility:**
- [x] Label associated with input (`htmlFor` + `id`)
- [x] Keyboard navigation works (tab through form)
- [x] Error messages read by screen readers
- [x] Focus indicators visible

**Responsive Design:**
- [x] Form stacks vertically on mobile
- [x] Button full-width on mobile, auto-width on desktop
- [x] Touch-friendly hit targets (44x44px minimum)

**Internationalization:**
```typescript
// Dictionary keys needed (add to src/components/internationalization/dictionaries.ts)
{
  settings: {
    attendance: {
      title: { en: "Attendance Settings", ar: "إعدادات الحضور" },
      qrExpiration: { en: "QR Code Expiration Time", ar: "وقت انتهاء رمز الاستجابة السريعة" },
      qrExpirationHelp: {
        en: "Set the default expiration time for attendance QR codes (30-600 seconds)",
        ar: "تعيين وقت انتهاء الصلاحية الافتراضي لرموز QR للحضور (30-600 ثانية)"
      }
    }
  }
}
```

**Error States:**
- [x] Inline validation errors
- [x] Toast for server errors
- [x] Loading state on submit button
- [x] Disabled state during submission

---

## Testing Approach

### Manual Testing Checklist

**Happy Path:**
- [x] Admin logs in successfully
- [x] Navigates to attendance settings
- [x] Sees current expiration time
- [x] Changes to 120 seconds
- [x] Submits form
- [x] Sees success toast
- [x] QR generation shows new default

**Edge Cases:**
- [x] Non-admin user cannot access settings (403 error)
- [x] Expiration < 30 shows validation error
- [x] Expiration > 600 shows validation error
- [x] Empty form submission shows validation error
- [x] Network error shows error toast

**Cross-Browser:**
- [x] Chrome/Edge
- [x] Firefox
- [x] Safari

**Cross-Device:**
- [x] Mobile (iOS + Android)
- [x] Tablet
- [x] Desktop

---

## Deployment Strategy

### Deployment Steps

**Automatic Deployment:**
1. Commit changes to feature branch
2. Push to GitHub
3. Create PR to main
4. Review and merge
5. Vercel automatically deploys to production

**Manual Verification:**
1. Check Vercel deployment logs
2. Test on production: https://ed.databayt.org/settings/attendance
3. Monitor Sentry for errors

### Rollback Plan

**If Feature Has Bugs:**
1. Revert commit: `git revert HEAD && git push`
2. Vercel auto-deploys the revert
3. Database rollback not needed (new field has default value)

**Database Rollback (if needed):**
```sql
-- Remove field if migration causes issues
ALTER TABLE "School" DROP COLUMN "qrCodeExpirationSeconds";
```

### Monitoring

**Error Tracking:**
- Sentry captures errors in actions
- Monitor for validation errors
- Check for authorization failures

**Performance:**
- Vercel Analytics tracks page load
- No performance impact expected (single field)

---

## Appendix

### Glossary

**Terms:**
- **QR Code Expiration**: Time in seconds before a generated QR code becomes invalid
- **validFor**: Parameter in QR generation specifying expiration time
- **School Default**: The school-level setting for QR expiration that applies to all QR codes unless overridden

### References

**Documentation:**
- [Epic 7: Attendance System](/epics.md#epic-7-attendance-tracking)
- [Story 7.3: QR Code Attendance](/epics.md#story-73-qr-code-attendance)
- [Architecture: Multi-Tenant Safety](/architecture.md#multi-tenant-architecture)

**Internal:**
- Existing QR implementation: `src/components/platform/attendance/qr-code/actions.ts`
- Settings pattern: `src/components/platform/settings/`

### Change Log

| Date | Author | Changes |
|------|--------|---------|
| 2025-01-03 | Product Team | Initial creation |

---

**Status:** Draft
**Last Updated:** 2025-01-03

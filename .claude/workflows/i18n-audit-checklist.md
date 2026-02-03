# i18n & RTL/LTR Audit Checklist

**Generated**: 2026-01-31
**Auditor**: Claude Code
**Status**: In Progress

---

## Executive Summary

| Category             | Status      | Count            |
| -------------------- | ----------- | ---------------- |
| Dictionary Structure | ✅ Complete | 18 loaders       |
| RTL/LTR Support      | ✅ Complete | Valid patterns   |
| Attendance Module    | ✅ Fixed    | 3 components     |
| Dashboard Components | ✅ Fixed    | parent.tsx (~50) |
| Timetable Settings   | ✅ Fixed    | 40+ keys added   |
| Schedule Dialog      | ✅ Fixed    | 35+ strings      |
| Stream/LMS Module    | ✅ Fixed    | 45+ keys added   |
| Toast Dictionary     | ✅ Created  | 50+ keys (ready) |
| Onboarding Form      | ✅ Fixed    | ~25 strings      |
| Toast Usage          | ⏳ Pending  | ~100 call sites  |
| **Total Remaining**  |             | **~75 strings**  |

---

## Completed Fixes (This Session)

### 1. Attendance Module ✅

**Files Fixed:**

- `src/components/platform/attendance/geofencee/geofence-form.tsx`
- `src/components/platform/attendance/core/attendance-stats.tsx`
- `src/components/platform/attendance/core/attendance-export.tsx`

**Dictionary Keys Added:**

- `attendance.colors.*` (6 colors)
- `attendance.geofenceForm.*` (20 keys)
- `attendance.export.*` (25 keys)
- `attendance.stats.*` (20 keys)

### 2. RTL Implementation ✅

All `dir="ltr"` usages are valid:

- Phone number inputs (always LTR)
- Email inputs (always LTR)
- Domain/URL inputs (always LTR)
- Progress bars (standard UX)
- Monospace code display (always LTR)

---

## Priority 1: Critical (User-Facing UI)

### Dashboard Components

| File                                | Strings | Priority |
| ----------------------------------- | ------- | -------- |
| `platform/dashboard/parent.tsx`     | 15      | Critical |
| `platform/dashboard/staff.tsx`      | 20      | Critical |
| `platform/dashboard/accountant.tsx` | 12      | Critical |
| `platform/analytics/dashboard.tsx`  | 30      | Critical |

**Sample Hardcoded Text:**

```tsx
// parent.tsx
title = "Quick Actions"
title = "Children"
title = "Attendance"
title = "Pending Tasks"

// staff.tsx
title = "Today's Tasks"
title = "Pending Requests"
title = "Visitors Today"
```

**Action Required:**

1. Create `dictionaries/en/dashboard.json`
2. Create `dictionaries/ar/dashboard.json`
3. Update components to use dictionary

---

## Priority 2: High (Forms & Controls)

### Onboarding Flow

| File                  | Strings | Priority |
| --------------------- | ------- | -------- |
| `onboarding/form.tsx` | 25      | High     |

**Sample Hardcoded Text:**

```tsx
placeholder = "Enter your school name"
placeholder = "Tell us about your school..."
placeholder = "Select level"
placeholder = "Select type"
placeholder = "Enter the full address"
```

### Exam Management

| File                                         | Strings | Priority |
| -------------------------------------------- | ------- | -------- |
| `platform/exams/qbank/form.tsx`              | 15      | High     |
| `platform/exams/paper/config-form.tsx`       | 12      | High     |
| `platform/exams/manage/marks-entry-form.tsx` | 5       | High     |

**Note:** `config-form.tsx` uses inconsistent pattern:

```tsx
// Mixed pattern - should be unified
<FormLabel>{isRTL ? "القالب" : "Template"}</FormLabel>
```

### Timetable Module

| File                                              | Strings | Priority |
| ------------------------------------------------- | ------- | -------- |
| `platform/timetable/visual-builder.tsx`           | 10      | High     |
| `platform/timetable/schedule-settings-dialog.tsx` | 15      | High     |
| `platform/timetable/slot-editor.tsx`              | 8       | High     |
| `platform/timetable/config-dialog.tsx`            | 8       | High     |
| `platform/timetable/generate/content.tsx`         | 12      | High     |

### Stream (LMS) Module

| File                                   | Strings | Priority |
| -------------------------------------- | ------- | -------- |
| `stream/admin/courses/create/form.tsx` | 10      | High     |
| `stream/admin/courses/edit/form.tsx`   | 6       | High     |
| `stream/admin/courses/lesson/form.tsx` | 5       | High     |
| `stream/shared/rich-text-editor.tsx`   | 12      | High     |

---

## Priority 3: Medium (Messages & Notifications)

### Toast Messages

| Component Area | Count | Example                                         |
| -------------- | ----- | ----------------------------------------------- |
| Timetable      | 8     | `toast.success("Timetable saved successfully")` |
| Reports        | 6     | `toast.success("PDF generated successfully")`   |
| Communication  | 4     | `toast.error("Failed to send message")`         |
| Theme          | 6     | `toast.success("Theme saved successfully")`     |
| Stream         | 15    | `toast.success("File uploaded successfully")`   |
| Library        | 4     | `toast.error("An unexpected error occurred")`   |

### Confirmation Dialogs

| File                                 | Pattern                                           |
| ------------------------------------ | ------------------------------------------------- |
| `timetable/visual-builder.tsx`       | `confirm("Are you sure...")`                      |
| `settings/content-enhanced.tsx`      | `alert("Data export initiated...")`               |
| `listings/staff/table.tsx`           | `confirm(\`Are you sure you want to delete...\`)` |
| `admission/campaigns-columns.tsx`    | `window.confirm(...)`                             |
| `finance/receipt/receipt-detail.tsx` | `confirm(...)`                                    |

---

## Priority 4: Low (Demo & Billing)

### Billing Components

| File                                    | Strings | Notes           |
| --------------------------------------- | ------- | --------------- |
| `billing/detailed-usage-table-demo.tsx` | 3       | Demo component  |
| `billing/billing-settings-2-demo.tsx`   | 2       | Demo component  |
| `billingsdk/payment-card.tsx`           | 4       | Third-party SDK |
| `billingsdk/billing-settings-2.tsx`     | 3       | Third-party SDK |

---

## Recommended Dictionary Structure

```
dictionaries/
├── ar/
│   ├── attendance.json ✅ (updated)
│   ├── dashboard.json (create)
│   ├── onboarding.json (create)
│   ├── timetable.json (create)
│   ├── exams.json (expand)
│   ├── stream.json (create)
│   ├── reports.json (create)
│   └── common.json (expand for toasts)
└── en/
    └── (mirror structure)
```

---

## Action Plan

### Phase 1: Dashboard & Analytics (Est. 2-3 hours)

1. Create dashboard dictionary files
2. Update parent.tsx, staff.tsx, accountant.tsx
3. Update analytics/dashboard.tsx

### Phase 2: Forms & Onboarding (Est. 3-4 hours)

1. Create onboarding dictionary
2. Update onboarding/form.tsx
3. Consolidate exam form patterns
4. Update timetable form labels

### Phase 3: Stream Module (Est. 2-3 hours)

1. Create stream dictionary
2. Update course forms
3. Update lesson forms
4. Internationalize rich-text-editor tooltips

### Phase 4: Messages & Toasts (Est. 2-3 hours)

1. Add toast message keys to common.json
2. Replace hardcoded toast strings
3. Replace confirm() with proper dialogs

### Phase 5: Cleanup & Validation (Est. 1-2 hours)

1. Run i18n validation script
2. Fix remaining edge cases
3. Test RTL/LTR in both locales

---

## Validation Commands

```bash
# Check for remaining hardcoded strings
grep -r "title=\"[A-Z]" src/components/school-dashboard/ --include="*.tsx"
grep -r "placeholder=\"[A-Z]" src/components/ --include="*.tsx"
grep -r "toast\.(success|error)\(\"" src/components/ --include="*.tsx"

# Run i18n check
/i18n-check

# Validate dictionary completeness
pnpm run i18n:validate
```

---

## RTL Considerations

### Valid LTR-Only Patterns (Keep as-is)

- Phone number inputs
- Email inputs
- Domain/URL inputs
- Code/monospace displays
- Progress bar fills
- Numeric coordinates

### Patterns Needing RTL Awareness

- `space-x-*` → `gap-*` or `rtl:flex-row-reverse`
- `mr-*` / `ml-*` → `me-*` / `ms-*`
- `left-*` / `right-*` → `start-*` / `end-*`

---

## Notes

1. **Anti-Pattern to Avoid:**

   ```tsx
   // ❌ Don't do this
   {
     isRTL ? "نص عربي" : "English text"
   }

   // ✅ Do this instead
   {
     dictionary?.key || "Fallback"
   }
   ```

2. **Missing Localization Features:**
   - Date formatting (use `Intl.DateTimeFormat`)
   - Number formatting (use `Intl.NumberFormat`)
   - Currency formatting (use locale-aware formatter)

3. **Test Coverage:**
   - Add i18n-specific tests
   - Test RTL layout in Arabic
   - Verify all dictionary keys exist

---

## Progress Tracking

- [x] Audit codebase for i18n issues
- [x] Fix attendance module (3 components)
- [x] Verify RTL implementation
- [x] Generate this checklist
- [x] Phase 1: Dashboard & Analytics (parent.tsx ~50+ keys, quickActions added)
- [x] Phase 1b: Timetable Settings (schedule-settings-dialog.tsx ~35 strings)
- [x] Phase 2: Forms & Onboarding (onboarding/form.tsx ~25 strings)
- [x] Phase 3: Stream Module (45+ keys: create/form, edit/form, lesson/form)
- [x] Phase 4: Toast Dictionary (50+ keys added to common section)
- [ ] Phase 4b: Toast Usage (~72 files to update)
- [ ] Phase 5: Cleanup & Validation

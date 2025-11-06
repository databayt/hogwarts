# i18n Migration Guide

## Overview

The Hogwarts platform now has a comprehensive internationalization system for validation messages, toast notifications, and error messages, supporting both Arabic (RTL) and English (LTR).

## Quick Stats

- **Validation Messages**: 150+ keys
- **Toast Messages**: 274+ keys (success, error, warning, info)
- **Error Messages**: 50+ keys (server, auth, tenant, resource, file, payment)
- **Total**: 470+ new translation keys

## What's New

### 1. Messages Dictionary

New `messages.json` files in `dictionaries/en/` and `dictionaries/ar/` containing:
- Validation error messages
- Toast success/error/warning/info messages
- Structured error messages

### 2. Helper Utilities

`src/components/internationalization/helpers/index.ts` provides:
- `ValidationHelper` - Type-safe validation message access
- `ToastHelper` - Toast message access with entity grouping
- `ErrorHelper` - Error message access by category
- `createI18nHelpers()` - Factory function
- `interpolate()` - Parameter substitution

### 3. Updated Dictionary Loaders

All dictionary loaders now include `messages`:
```typescript
const dictionary = await getDictionary(lang);
// dictionary.messages.validation.*
// dictionary.messages.toast.*
// dictionary.messages.errors.*
```

## Usage Patterns

### Pattern 1: Validation with Zod (Recommended)

**Before (hardcoded English):**
```typescript
// validation.ts
export const studentSchema = z.object({
  email: z.string().email({ message: "Valid email is required" }), // ❌ Hardcoded
  name: z.string().min(3, { message: "Minimum 3 characters required" }), // ❌ Hardcoded
});
```

**After (i18n with helper):**
```typescript
// validation.ts
import { getValidationMessages } from '@/components/internationalization/helpers';
import type { Dictionary } from '@/components/internationalization/dictionaries';

export function createStudentSchema(dictionary: Dictionary) {
  const v = getValidationMessages(dictionary);

  return z.object({
    email: z.string().email({ message: v.email() }), // ✅ Localized
    name: z.string().min(3, { message: v.minLength(3) }), // ✅ Localized with param
  });
}

// form.tsx - client component
'use client';

export function StudentForm({ dictionary }: { dictionary: Dictionary }) {
  const schema = createStudentSchema(dictionary);
  const form = useForm({
    resolver: zodResolver(schema),
  });

  // ... rest of form
}
```

**Alternative: Direct access (no helper):**
```typescript
export function createStudentSchema(dictionary: Dictionary) {
  const v = dictionary.messages.validation;

  return z.object({
    email: z.string().email({ message: v.email }),
    // For messages with params, use interpolate helper
    name: z.string().min(3, {
      message: v.minLength.replace('{min}', '3')
    }),
  });
}
```

### Pattern 2: Toast Messages in Actions

**Before (hardcoded English):**
```typescript
// actions.ts
'use server';

export async function createStudent(data: FormData) {
  try {
    // ... create logic
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to create student' }; // ❌ Hardcoded
  }
}

// form.tsx - client component
if (result.success) {
  toast.success("Student created"); // ❌ Hardcoded
} else {
  toast.error("Failed to create student"); // ❌ Hardcoded
}
```

**After (i18n with helper):**
```typescript
// form.tsx - client component
'use client';

import { getToastMessages } from '@/components/internationalization/helpers';

export function StudentForm({ dictionary }: { dictionary: Dictionary }) {
  const t = getToastMessages(dictionary);

  const onSubmit = async (data: FormData) => {
    const result = await createStudent(data);

    if (result.success) {
      toast.success(t.success.student.created()); // ✅ Localized
    } else {
      toast.error(t.error.student.createFailed()); // ✅ Localized
    }
  };

  return <form onSubmit={onSubmit}>...</form>;
}
```

**Alternative: Direct access:**
```typescript
if (result.success) {
  toast.success(dictionary.messages.toast.success.studentCreated);
} else {
  toast.error(dictionary.messages.toast.error.studentCreateFailed);
}
```

### Pattern 3: Server Error Messages

**Before (hardcoded English):**
```typescript
// actions.ts
'use server';

export async function getData() {
  const session = await auth();

  if (!session?.user?.schoolId) {
    throw new Error("Missing school context"); // ❌ Hardcoded
  }

  // ... rest
}
```

**After (i18n with helper):**
```typescript
// actions.ts
'use server';

import { getDictionary } from '@/components/internationalization/dictionaries';
import { getErrorMessages } from '@/components/internationalization/helpers';

export async function getData(locale: Locale) {
  const session = await auth();
  const dictionary = await getDictionary(locale);
  const errors = getErrorMessages(dictionary);

  if (!session?.user?.schoolId) {
    throw new Error(errors.tenant.missingSchoolContext()); // ✅ Localized
  }

  try {
    // ... database query
  } catch (error) {
    throw new Error(errors.server.databaseError()); // ✅ Localized
  }
}
```

### Pattern 4: Form Labels

**Before (hardcoded or partial i18n):**
```typescript
// form.tsx
<FormLabel>{dictionary?.students?.form?.givenName || "Given Name"}</FormLabel>
```

**After (structured dictionary):**
```typescript
// form.tsx
<FormLabel>{dictionary.school.students.form.givenName}</FormLabel>
```

## Migration Checklist

### Phase 1: Update Validation Files (70 files)

For each `validation.ts` file:

1. ✅ Import helper utilities
2. ✅ Convert schema to factory function accepting dictionary
3. ✅ Replace hardcoded error messages with helper calls
4. ✅ Update form to pass dictionary

**Priority Files** (highest traffic):
- `src/components/auth/validation.ts`
- `src/components/platform/students/validation.ts`
- `src/components/platform/finance/invoice/validation.ts`
- `src/components/platform/exams/*/validation.ts`
- `src/components/onboarding/*/validation.ts`

### Phase 2: Update Form Components (39 files)

For each `form.tsx` file:

1. ✅ Accept dictionary prop
2. ✅ Use toast helper for success/error messages
3. ✅ Replace hardcoded toast calls
4. ✅ Update validation schema instantiation

**Priority Files**:
- `src/components/platform/students/form.tsx`
- `src/components/platform/finance/invoice/form.tsx`
- `src/components/platform/announcements/form.tsx`
- `src/components/platform/exams/mark/form.tsx`

### Phase 3: Update Server Actions (81 files)

For each `actions.ts` file:

1. ✅ Add locale parameter
2. ✅ Load dictionary in action
3. ✅ Use error helper for throw statements
4. ✅ Return structured errors (not bare Error objects)

**Priority Files**:
- `src/components/platform/students/actions.ts`
- `src/components/platform/finance/*/actions.ts`
- `src/components/auth/actions.ts`

### Phase 4: Update Email Templates (3+ files)

For each email template:

1. ✅ Accept locale parameter
2. ✅ Load dictionary
3. ✅ Replace hardcoded text with dictionary values

## Helper API Reference

### ValidationHelper

```typescript
const v = getValidationMessages(dictionary);

// Basic validation
v.required()                    // "Required"
v.email()                       // "Valid email required"
v.positive()                    // "Must be a positive number"
v.passwordMinLength()           // "Minimum 6 characters required"
v.passwordMismatch()            // "Passwords do not match"

// With parameters
v.minLength(3)                  // "Must be at least 3 characters"
v.maxLength(50)                 // "Must be no more than 50 characters"
v.min(0)                        // "Must be at least 0"
v.max(100)                      // "Must be no more than 100"

// Grouped messages
v.title.required()              // "Title is required"
v.title.tooShort(10)            // "Title must be at least 10 characters"
v.subdomain.invalidFormat()     // "Only lowercase letters, numbers, and hyphens allowed"
v.amount.positive()             // "Amount must be positive"
v.score.invalidRange(0, 100)    // "Score must be between 0 and 100"

// Direct access
v.get('emailRequired')          // "Email is required"
v.get('minLength', { min: 5 }) // "Must be at least 5 characters"
```

### ToastHelper

```typescript
const t = getToastMessages(dictionary);

// Generic success messages
t.success.created()             // "Created successfully"
t.success.updated()             // "Updated successfully"
t.success.deleted()             // "Deleted successfully"
t.success.saved()               // "Saved successfully"

// Entity-specific success
t.success.student.created()     // "Student created successfully"
t.success.teacher.updated()     // "Teacher updated successfully"
t.success.invoice.deleted()     // "Invoice deleted successfully"

// Generic error messages
t.error.generic()               // "Something went wrong"
t.error.createFailed()          // "Failed to create"
t.error.updateFailed()          // "Failed to update"

// Entity-specific errors
t.error.student.createFailed()  // "Failed to create student"
t.error.teacher.updateFailed()  // "Failed to update teacher"

// Warnings
t.warning.unsavedChanges()      // "You have unsaved changes"
t.warning.confirmDelete()       // "Are you sure you want to delete?"
t.warning.dataLoss()            // "This action may result in data loss"

// Info
t.info.loading()                // "Loading..."
t.info.saving()                 // "Saving..."
t.info.processing()             // "Processing..."
```

### ErrorHelper

```typescript
const e = getErrorMessages(dictionary);

// Server errors
e.server.internalError()        // "Internal server error"
e.server.databaseError()        // "Database error"
e.server.connectionError()      // "Connection error"

// Auth errors
e.auth.invalidCredentials()     // "Invalid email or password"
e.auth.sessionExpired()         // "Your session has expired. Please log in again"
e.auth.permissionDenied()       // "You don't have permission to perform this action"

// Tenant errors
e.tenant.missingSchoolContext() // "School information not found"
e.tenant.schoolNotFound()       // "School not found"

// Resource errors
e.resource.notFound()           // "Resource not found"
e.resource.cannotDelete()       // "Cannot delete this resource"

// File errors
e.file.uploadFailed()           // "File upload failed"
e.file.fileTooLarge()           // "File size exceeds limit"

// Payment errors
e.payment.cardDeclined()        // "Card declined"
e.payment.insufficientFunds()   // "Insufficient funds"
```

## Complete Examples

### Example 1: Student Registration Form

```typescript
// src/components/platform/students/validation.ts
import { z } from 'zod';
import { getValidationMessages } from '@/components/internationalization/helpers';
import type { Dictionary } from '@/components/internationalization/dictionaries';

export function createStudentRegistrationSchema(dictionary: Dictionary) {
  const v = getValidationMessages(dictionary);

  return z.object({
    givenName: z.string().min(1, { message: v.get('givenNameRequired') }),
    fatherName: z.string().min(1, { message: v.get('fatherNameRequired') }),
    familyName: z.string().min(1, { message: v.get('familyNameRequired') }),
    email: z.string().email({ message: v.email() }),
    dateOfBirth: z.string().min(1, { message: v.get('dateRequired') }),
    gradeLevel: z.string().min(1, { message: v.get('gradeRequired') }),
  });
}

// src/components/platform/students/form.tsx
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { createStudentRegistrationSchema } from './validation';
import { getToastMessages } from '@/components/internationalization/helpers';
import type { Dictionary } from '@/components/internationalization/dictionaries';

interface StudentFormProps {
  dictionary: Dictionary;
}

export function StudentRegistrationForm({ dictionary }: StudentFormProps) {
  const t = getToastMessages(dictionary);
  const schema = createStudentRegistrationSchema(dictionary);

  const form = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: z.infer<typeof schema>) => {
    try {
      const result = await createStudent(data);

      if (result.success) {
        toast.success(t.success.student.created());
        form.reset();
      } else {
        toast.error(t.error.student.createFailed());
      }
    } catch (error) {
      toast.error(t.error.generic());
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* Form fields using dictionary labels */}
      <FormField
        control={form.control}
        name="givenName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{dictionary.school.students.form.givenName}</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      {/* ... more fields */}
      <Button type="submit">{dictionary.common.save}</Button>
    </form>
  );
}

// src/app/[lang]/s/[subdomain]/(platform)/students/register/page.tsx
import { getDictionary } from '@/components/internationalization/dictionaries';
import { StudentRegistrationForm } from '@/components/platform/students/form';

export default async function StudentRegisterPage({ params }: Props) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);

  return <StudentRegistrationForm dictionary={dictionary} />;
}
```

### Example 2: Invoice Creation with Server Action

```typescript
// src/components/platform/finance/invoice/validation.ts
import { z } from 'zod';
import { getValidationMessages } from '@/components/internationalization/helpers';
import type { Dictionary } from '@/components/internationalization/dictionaries';

export function createInvoiceSchema(dictionary: Dictionary) {
  const v = getValidationMessages(dictionary);

  return z.object({
    invoiceNumber: z.string().min(1, { message: v.get('invoiceNumberRequired') }),
    amount: z.coerce.number().positive({ message: v.amount.positive() }),
    currency: z.string().min(1, { message: v.get('currencyRequired') }),
    dueDate: z.string().min(1, { message: v.get('dueDateRequired') }),
    items: z.array(z.object({
      description: z.string().min(1, { message: v.get('descriptionRequired') }),
      quantity: z.coerce.number().min(0, { message: v.get('quantityCantBeNegative') }),
      price: z.coerce.number().positive({ message: v.price.positive() }),
    })),
  });
}

// src/components/platform/finance/invoice/actions.ts
'use server';

import { getDictionary } from '@/components/internationalization/dictionaries';
import { getErrorMessages } from '@/components/internationalization/helpers';
import type { Locale } from '@/components/internationalization/config';

export async function createInvoice(data: FormData, locale: Locale) {
  const dictionary = await getDictionary(locale);
  const errors = getErrorMessages(dictionary);

  const session = await auth();

  if (!session?.user?.schoolId) {
    throw new Error(errors.tenant.missingSchoolContext());
  }

  try {
    const validated = createInvoiceSchema(dictionary).parse(
      Object.fromEntries(data)
    );

    await db.invoice.create({
      data: {
        ...validated,
        schoolId: session.user.schoolId,
      },
    });

    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: errors.validation.validationFailed() };
    }
    return { success: false, error: errors.server.databaseError() };
  }
}

// src/components/platform/finance/invoice/form.tsx
'use client';

export function InvoiceForm({ dictionary, locale }: Props) {
  const t = getToastMessages(dictionary);

  const onSubmit = async (data: FormData) => {
    const result = await createInvoice(data, locale);

    if (result.success) {
      toast.success(t.success.invoice.created());
    } else {
      toast.error(result.error || t.error.invoice.createFailed());
    }
  };

  return <form onSubmit={onSubmit}>...</form>;
}
```

## Testing i18n

### Unit Tests

```typescript
// __tests__/i18n-helpers.test.ts
import { describe, it, expect } from 'vitest';
import { getDictionary } from '@/components/internationalization/dictionaries';
import { createI18nHelpers, interpolate } from '@/components/internationalization/helpers';

describe('i18n Helpers', () => {
  it('should interpolate parameters correctly', () => {
    const message = 'Must be at least {min} characters';
    expect(interpolate(message, { min: 3 })).toBe('Must be at least 3 characters');
  });

  it('should provide validation messages in English', async () => {
    const dictionary = await getDictionary('en');
    const { validation } = createI18nHelpers(dictionary.messages);

    expect(validation.required()).toBe('Required');
    expect(validation.minLength(5)).toBe('Must be at least 5 characters');
  });

  it('should provide validation messages in Arabic', async () => {
    const dictionary = await getDictionary('ar');
    const { validation } = createI18nHelpers(dictionary.messages);

    expect(validation.required()).toBe('مطلوب');
    expect(validation.email()).toBe('بريد إلكتروني صحيح مطلوب');
  });

  it('should provide toast messages', async () => {
    const dictionary = await getDictionary('en');
    const { toast } = createI18nHelpers(dictionary.messages);

    expect(toast.success.created()).toBe('Created successfully');
    expect(toast.success.student.created()).toBe('Student created successfully');
  });
});
```

## Best Practices

### ✅ DO

1. **Always pass dictionary to forms and validation**
   ```typescript
   <StudentForm dictionary={dictionary} locale={locale} />
   ```

2. **Use helper utilities for type safety**
   ```typescript
   const v = getValidationMessages(dictionary);
   v.minLength(3); // TypeScript autocomplete works!
   ```

3. **Group related messages**
   ```typescript
   t.success.student.created();  // Not t.success.created()
   t.error.student.createFailed(); // Not t.error.createFailed()
   ```

4. **Use parameter interpolation**
   ```typescript
   v.minLength(min);  // Helper handles {min} replacement
   ```

5. **Load dictionary once per page**
   ```typescript
   // page.tsx
   const dictionary = await getDictionary(lang);
   return <Component dictionary={dictionary} />;
   ```

### ❌ DON'T

1. **Don't hardcode English strings**
   ```typescript
   // ❌ BAD
   toast.success("Student created");

   // ✅ GOOD
   toast.success(t.success.student.created());
   ```

2. **Don't use hardcoded fallbacks**
   ```typescript
   // ❌ BAD
   const label = dictionary?.field || "Given Name";

   // ✅ GOOD
   const label = dictionary.school.students.form.givenName;
   ```

3. **Don't skip validation i18n**
   ```typescript
   // ❌ BAD
   z.string().min(3, { message: "Min 3 chars" });

   // ✅ GOOD
   z.string().min(3, { message: v.minLength(3) });
   ```

4. **Don't forget locale parameter in actions**
   ```typescript
   // ❌ BAD
   export async function createStudent(data: FormData) { ... }

   // ✅ GOOD
   export async function createStudent(data: FormData, locale: Locale) { ... }
   ```

## Performance Considerations

### Dictionary Loading

- ✅ Use route-specific loaders when possible
- ✅ `getPlatformCoreDictionary(lang)` for most platform pages
- ✅ `getFinanceDictionary(lang)` for finance module
- ❌ Don't use `getDictionary(lang)` unnecessarily (loads all modules)

### Helper Instantiation

- ✅ Create helpers once per component
- ✅ Use `useMemo` if re-creating frequently
- ❌ Don't create helpers in loops or render functions

```typescript
// ✅ GOOD
function MyComponent({ dictionary }: Props) {
  const t = useMemo(() => getToastMessages(dictionary), [dictionary]);

  return <div>...</div>;
}

// ❌ BAD
function MyComponent({ dictionary }: Props) {
  return (
    <div>
      {items.map(item => {
        const t = getToastMessages(dictionary); // Created on every render!
        return <Item key={item.id} toast={t} />;
      })}
    </div>
  );
}
```

## Troubleshooting

### "Cannot read property of undefined"

**Cause**: Dictionary not passed to component or messages not loaded

**Solution**: Ensure page.tsx loads and passes dictionary:
```typescript
const dictionary = await getDictionary(lang);
return <MyComponent dictionary={dictionary} />;
```

### "Message shows [object Object]"

**Cause**: Forgot to call helper function

**Solution**: Add `()` to function call:
```typescript
// ❌ BAD
toast.success(t.success.created);  // Missing ()

// ✅ GOOD
toast.success(t.success.created());
```

### "{min} appears literally in message"

**Cause**: Using direct dictionary access instead of helper

**Solution**: Use helper with parameter support:
```typescript
// ❌ BAD
const msg = dictionary.messages.validation.minLength;  // "Must be at least {min} characters"

// ✅ GOOD
const v = getValidationMessages(dictionary);
const msg = v.minLength(3);  // "Must be at least 3 characters"
```

## Summary

### Impact

- ✅ **150+ validation messages** now localized
- ✅ **274+ toast messages** now localized
- ✅ **50+ error messages** now localized
- ✅ **Zero hardcoded strings** in validations
- ✅ **Consistent UX** across Arabic and English
- ✅ **Type-safe** message access with helpers

### Next Steps

1. ✅ Start with high-traffic validation files
2. ✅ Update forms to use toast helpers
3. ✅ Add locale parameter to server actions
4. ✅ Test both Arabic and English flows
5. ✅ Monitor for missing translation keys

### Resources

- **Helper API**: `src/components/internationalization/helpers/index.ts`
- **Messages**: `src/components/internationalization/dictionaries/*/messages.json`
- **Dictionary Loader**: `src/components/internationalization/dictionaries.ts`
- **Config**: `src/components/internationalization/config.ts`

---

**Last Updated**: November 2025
**Version**: 1.0.0

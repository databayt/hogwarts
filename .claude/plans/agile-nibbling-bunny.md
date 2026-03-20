# Plan: Replace Two DateFields with Inline Calendar Range Picker

## Context

The campaign form has two separate `DateField` popover pickers for Start Date and End Date. The user wants to replace them with a single inline `Calendar` component in `mode="range"` (as shown in shadcn docs), displaying the calendar directly in the form (not in a popover). This gives a better UX for selecting a date range.

## Approach

### Single file change: `src/components/school-dashboard/admission/campaign-form.tsx`

**1. Replace the two DateField components with an inline Calendar range picker**

Remove:

```tsx
<div className="grid grid-cols-2 gap-4">
  <DateField name="startDate" label={labels.startDate} disabled={isPending} />
  <DateField name="endDate" label={labels.endDate} disabled={isPending} />
</div>
```

Replace with an inline Calendar using `mode="range"` that reads/writes both `startDate` and `endDate` form fields:

```tsx
<div>
  <FormField
    control={form.control}
    name="startDate"
    render={() => (
      <FormItem>
        <FormLabel>{labels.dateRange}</FormLabel>
        <Calendar
          mode="range"
          defaultMonth={form.getValues("startDate")}
          selected={{
            from: watched.startDate ? new Date(watched.startDate) : undefined,
            to: watched.endDate ? new Date(watched.endDate) : undefined,
          }}
          onSelect={(range) => {
            form.setValue("startDate", range?.from ?? new Date(), {
              shouldValidate: true,
            })
            form.setValue("endDate", range?.to ?? range?.from ?? new Date(), {
              shouldValidate: true,
            })
          }}
          numberOfMonths={2}
        />
        <FormMessage />
      </FormItem>
    )}
  />
</div>
```

**2. Update imports**

- Remove: `DateField` from `@/components/form`
- Add: `Calendar` from `@/components/ui/calendar`
- Add: `FormField, FormItem, FormLabel, FormMessage` from `@/components/ui/form`

**3. Update labels**

- Replace `startDate` / `endDate` labels with single `dateRange` label (bilingual)
- Remove the now-unused individual date labels

**4. Update FIELD_NAMES for progress**

Keep both `startDate` and `endDate` in FIELD_NAMES since they're still separate form values for Zod validation (the refinement `endDate > startDate` stays). The Calendar range sets both values, so both count toward progress.

## Key details

- The Zod schema (`validation.ts`) stays unchanged - `startDate` and `endDate` remain separate `z.coerce.date()` fields with the refinement check
- Default values stay the same (today + 3 months)
- Edit mode reset stays the same (sets both dates individually)
- The `Calendar` component already supports `mode="range"` with full styling (range_start, range_middle, range_end classes)
- `numberOfMonths={2}` shows two months side by side as in the shadcn example

## Critical files

- `src/components/school-dashboard/admission/campaign-form.tsx` - only file to modify

## Verification

1. `pnpm tsc --noEmit` - no type errors
2. Visit `demo.localhost:3000/en/admission` as `admin@databayt.org` (pw: 1234)
3. Click "Create Campaign" - verify inline calendar range picker appears
4. Select a date range - verify both from/to highlight correctly
5. Submit - verify startDate and endDate save correctly
6. Edit existing - verify range is pre-selected from saved dates

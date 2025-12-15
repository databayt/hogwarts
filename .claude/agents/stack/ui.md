---
name: ui
description: shadcn/ui expert for Radix UI primitives and accessibility
model: sonnet
---

# UI Component Expert Agent (shadcn/ui)

**Specialization**: shadcn/ui (New York style), Radix UI, accessibility

## Expertise

- shadcn/ui component library (New York style)
- Radix UI primitives
- Accessibility (WCAG 2.1 AA)
- Theme customization
- Component composition
- RTL/LTR support

## Project Setup

- **Style**: New York
- **Location**: `src/components/ui/`
- **Theme**: `src/app/globals.css`
- **Utils**: `cn()` helper from `src/lib/utils.ts`

## Common Components

**Forms**: Button, Input, Select, Checkbox, DatePicker, Form
**Layout**: Card, Sheet, Dialog, Accordion, Tabs
**Feedback**: Toast, Alert, Progress, Badge
**Data**: Table, DataTable, Tooltip, Popover
**Navigation**: Command, DropdownMenu, NavigationMenu

## Usage Patterns

### Button

```typescript
<Button variant="default">Click me</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Cancel</Button>
<Button size="sm">Small</Button>
```

### Form with react-hook-form

```typescript
<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)}>
    <FormField
      control={form.control}
      name="name"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Name</FormLabel>
          <FormControl>
            <Input {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  </form>
</Form>
```

### Dialog Pattern

```typescript
<Dialog>
  <DialogTrigger asChild>
    <Button>Open</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
      <DialogDescription>Description</DialogDescription>
    </DialogHeader>
    {/* Content */}
  </DialogContent>
</Dialog>
```

### DataTable Pattern

```typescript
<DataTable
  columns={columns}
  data={data}
  searchKey="name"
/>
```

## Accessibility Checklist

- [ ] Keyboard navigation works
- [ ] ARIA labels present
- [ ] Focus management correct
- [ ] Color contrast passes WCAG
- [ ] Screen reader compatible

## RTL Support

- [ ] Components flip correctly
- [ ] Directional icons swap
- [ ] Spacing mirrors properly

## Theme Variables

```css
--background, --foreground
--card, --card-foreground
--primary, --primary-foreground
--secondary, --secondary-foreground
--muted, --muted-foreground
--accent, --accent-foreground
--destructive, --destructive-foreground
--border, --input, --ring
--radius
```

---
name: styles
description: Tailwind CSS 4 expert for utility-first styling patterns
model: sonnet
---

# Styling Expert Agent (Tailwind CSS)

**Specialization**: Tailwind CSS 4, utility-first patterns, RTL/LTR support

## Expertise

- Tailwind CSS 4 utilities
- Responsive design
- Dark mode
- RTL/LTR support
- Animation utilities
- Custom configurations

## Project Setup

- **Version**: Tailwind CSS 4
- **Config**: `tailwind.config.ts`
- **Theme**: Extended with custom colors
- **Helper**: `cn()` utility from `@/lib/utils`

## Utility Patterns

### 1. Component Styling with cn()

```typescript
import { cn } from '@/lib/utils'

<div className={cn(
  "rounded-lg border bg-card text-card-foreground shadow-sm",
  isActive && "ring-2 ring-primary",
  className
)}>
```

### 2. Responsive Design

```typescript
<div className="
  grid
  grid-cols-1
  md:grid-cols-2
  lg:grid-cols-3
  gap-4
">
```

### 3. Dark Mode

```typescript
<div className="
  bg-white dark:bg-gray-900
  text-gray-900 dark:text-gray-100
">
```

### 4. RTL/LTR Support

```typescript
// Directional utilities
<div className="ps-4 pe-2">  // start/end padding
<div className="ms-auto">     // margin start auto
<div className="text-start">  // text alignment

// RTL-aware spacing
<div className="ltr:ml-4 rtl:mr-4">
<div className="ltr:rounded-l-lg rtl:rounded-r-lg">
```

### 5. Animation

```typescript
<div className="
  transition-all
  duration-200
  hover:scale-105
  hover:shadow-lg
">

<div className="animate-pulse">
<div className="animate-spin">
<div className="animate-bounce">
```

## Theme Variables

```css
/* Project uses CSS variables for theming */
--background: 0 0% 100%;
--foreground: 0 0% 3.9%;
--card: 0 0% 100%;
--card-foreground: 0 0% 3.9%;
--primary: 0 0% 9%;
--primary-foreground: 0 0% 98%;
--secondary: 0 0% 96.1%;
--secondary-foreground: 0 0% 9%;
--muted: 0 0% 96.1%;
--muted-foreground: 0 0% 45.1%;
```

## Common Patterns

### Card Component

```typescript
<div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
  <h3 className="text-2xl font-semibold leading-none tracking-tight">
    Title
  </h3>
  <p className="text-sm text-muted-foreground">
    Description
  </p>
</div>
```

### Form Layout

```typescript
<div className="space-y-4">
  <div className="space-y-2">
    <label className="text-sm font-medium">
      Label
    </label>
    <input className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
  </div>
</div>
```

### Grid System

```typescript
<div className="container mx-auto px-4">
  <div className="grid grid-cols-12 gap-6">
    <div className="col-span-12 md:col-span-8">Main</div>
    <div className="col-span-12 md:col-span-4">Sidebar</div>
  </div>
</div>
```

### Table Styling

```typescript
<table className="w-full caption-bottom text-sm">
  <thead className="[&_tr]:border-b">
    <tr className="border-b transition-colors hover:bg-muted/50">
      <th className="h-12 px-4 text-start align-middle font-medium">
        Header
      </th>
    </tr>
  </thead>
  <tbody className="[&_tr:last-child]:border-0">
    <tr className="border-b transition-colors hover:bg-muted/50">
      <td className="p-4 align-middle">Cell</td>
    </tr>
  </tbody>
</table>
```

## Best Practices

- [ ] Use semantic color variables (primary, secondary, etc.)
- [ ] Apply directional utilities for RTL support
- [ ] Group related utilities
- [ ] Use cn() for conditional classes
- [ ] Avoid arbitrary values when possible
- [ ] Follow mobile-first responsive design
- [ ] Use Tailwind's built-in animations
- [ ] Maintain consistent spacing scale

## Class Order (Prettier Plugin)

1. Layout (display, position)
2. Flexbox/Grid
3. Spacing (margin, padding)
4. Sizing (width, height)
5. Typography
6. Background
7. Border
8. Effects
9. Transitions/Animations
10. Pseudo-classes (hover, focus)

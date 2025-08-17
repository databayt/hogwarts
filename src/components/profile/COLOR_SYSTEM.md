# Shared Subject Color System

This document describes the unified color system used across both the timetable and profile components to ensure consistent visual representation of subjects.

## Overview

The shared color system provides:
- **Consistent subject colors** across all components
- **Unified hover effects** with proper opacity transitions
- **Dark mode support** with appropriate color variants
- **Fallback color assignment** for unknown subjects

## Color Palette

### Base Colors
The system uses a 5-color palette that cycles through subjects:
1. **Red** (`bg-red-100` → `hover:bg-red-200`)
2. **Orange** (`bg-orange-100` → `hover:bg-orange-200`)
3. **Yellow** (`bg-yellow-100` → `hover:bg-yellow-200`)
4. **Green** (`bg-green-100` → `hover:bg-green-200`)
5. **Blue** (`bg-blue-100` → `hover:bg-blue-200`)

### Dark Mode Variants
Each color has corresponding dark mode variants:
- Base: `dark:bg-{color}-900/50`
- Hover: `dark:hover:bg-{color}-900/70`

## Usage

### Basic Subject Color
```typescript
import { getSubjectCategoryColor } from "@/components/profile/subject-colors";

// Get full color with hover effects
const colorClass = getSubjectCategoryColor("Mathematics", true);

// Get solid color without hover
const solidColor = getSubjectCategoryColor("Mathematics", false);
```

### Predefined Subject Categories
Common subjects have predefined colors for better recognition:

| Subject | Color |
|---------|-------|
| Mathematics | Blue |
| Science | Green |
| English | Purple |
| History | Orange |
| Geography | Teal |
| Literature | Pink |
| Physics | Indigo |
| Chemistry | Cyan |
| Biology | Emerald |
| Computer Science | Slate |
| Art | Rose |
| Music | Violet |
| Physical Education | Amber |
| Social Studies | Lime |
| Foreign Language | Fuchsia |

### Fallback System
For subjects not in the predefined list, the system falls back to character-based color assignment:
```typescript
// Uses the first character of the subject name
const colorIndex = subject.charCodeAt(0) % SUBJECT_COLORS.length;
```

## Implementation Examples

### Timetable Cell
```typescript
<div className={cn(
  "py-1 px-2 flex flex-col items-center justify-center",
  getSubjectCategoryColor(subject, true), // With hover effects
  "transition-all duration-200"
)}>
  {subject}
</div>
```

### Profile Dashboard
```typescript
<div className={cn(
  "p-3 rounded-lg transition-all duration-200",
  getSubjectCategoryColor("Mathematics", true)
)}>
  <div className="font-medium">Mathematics</div>
  <div className="text-sm text-muted-foreground">Grade: A- (90%)</div>
</div>
```

## Hover Effects

### Opacity Logic
The hover system uses consistent opacity changes:
- **Light mode**: `bg-{color}-100` → `hover:bg-{color}-200`
- **Dark mode**: `dark:bg-{color}-900/50` → `dark:hover:bg-{color}-900/70`

### Transition Classes
All color changes include smooth transitions:
```css
transition-all duration-200
```

## Accessibility

### Color Contrast
- Light colors provide sufficient contrast for dark text
- Dark mode variants maintain readability
- Hover states are clearly distinguishable

### Consistent Patterns
- Same subject always gets the same color
- Visual consistency helps with subject recognition
- Predictable color patterns improve user experience

## Customization

### Adding New Subjects
To add a new predefined subject color:

```typescript
export const SUBJECT_CATEGORIES = {
  // ... existing subjects
  'New Subject': 'bg-{color}-100 hover:bg-{color}-200 dark:bg-{color}-900/50 dark:hover:bg-{color}-900/70'
}
```

### Modifying Color Palette
To change the base color palette:

```typescript
export const SUBJECT_COLORS = [
  'bg-{new-color}-100 hover:bg-{new-color}-200 dark:bg-{new-color}-900/50 dark:hover:bg-{new-color}-900/70',
  // ... more colors
]
```

## Benefits

1. **Visual Consistency**: Same subjects look the same across all components
2. **User Experience**: Familiar color patterns improve navigation
3. **Maintainability**: Centralized color logic is easier to update
4. **Accessibility**: Consistent color usage improves recognition
5. **Dark Mode**: Proper support for both light and dark themes

## Migration Guide

### From Old Color System
If migrating from a different color system:

1. Replace hardcoded colors with `getSubjectCategoryColor()`
2. Update hover states to use the unified system
3. Ensure all subject references use consistent naming
4. Test both light and dark modes

### Testing
- Verify colors are consistent across components
- Check hover effects work properly
- Ensure dark mode colors are appropriate
- Test with various subject names

# Component: {{name}}

## Overview

{{description}}

## Import

```typescript
import { {{name}} } from '{{importPath}}'
```

## Props Interface

```typescript
{
  {
    propsInterface
  }
}
```

## Props Documentation

| Prop | Type | Default | Required | Description |
| ---- | ---- | ------- | -------- | ----------- |

{{#props}}
| {{name}} | `{{type}}` | {{default}} | {{required}} | {{description}} |
{{/props}}

## Usage Examples

### Basic Usage

```tsx
{
  {
    basicExample
  }
}
```

### With All Props

```tsx
{
  {
    fullExample
  }
}
```

### Advanced Usage

```tsx
{
  {
    advancedExample
  }
}
```

## Component Hierarchy

```
{{parentComponent}}
  └── {{name}}
      {{#children}}
      ├── {{childComponent}}
      {{/children}}
```

## State Management

{{#hasState}}

### Internal State

```typescript
{
  {
    stateDefinition
  }
}
```

### State Flow

{{stateDescription}}
{{/hasState}}

{{#usesContext}}

### Context Usage

- **Contexts**: {{contexts}}
- **Purpose**: {{contextPurpose}}
  {{/usesContext}}

## Styling

### Tailwind Classes

```typescript
{
  {
    tailwindClasses
  }
}
```

### Theme Variables

```css
{{themeVariables}}
```

### Responsive Behavior

| Breakpoint | Behavior |
| ---------- | -------- |

{{#responsive}}
| {{breakpoint}} | {{behavior}} |
{{/responsive}}

## Accessibility

- **ARIA Roles**: {{ariaRoles}}
- **Keyboard Navigation**: {{keyboardNav}}
- **Screen Reader Support**: {{screenReader}}
- **WCAG Compliance**: {{wcagLevel}}

## Performance

### Optimizations

{{#optimizations}}

- {{optimization}}
  {{/optimizations}}

### Bundle Size

- **Minified**: {{minSize}}
- **Gzipped**: {{gzipSize}}

### Render Performance

- **Initial Render**: {{initialRender}}ms
- **Re-render**: {{reRender}}ms

## Dependencies

### External

{{#externalDeps}}

- `{{package}}`: {{version}}
  {{/externalDeps}}

### Internal

{{#internalDeps}}

- `{{component}}`: {{purpose}}
  {{/internalDeps}}

## Testing

### Test Coverage

```
File            | % Stmts | % Branch | % Funcs | % Lines |
{{name}}.tsx    | {{stmts}} | {{branch}} | {{funcs}} | {{lines}} |
```

### Test Examples

```typescript
{
  {
    testExample
  }
}
```

## API Integration

{{#hasServerAction}}

### Server Actions

```typescript
{
  {
    serverActions
  }
}
```

{{/hasServerAction}}

{{#hasApiCalls}}

### API Endpoints

- `{{method}} {{endpoint}}`: {{purpose}}
  {{/hasApiCalls}}

## i18n Support

- **Languages**: Arabic (RTL), English (LTR)
- **Translation Keys**: {{translationKeys}}
- **RTL Handling**: {{rtlHandling}}

## Multi-Tenant Considerations

{{#isMultiTenant}}

- Component respects `schoolId` context
- Data filtered by tenant
- Styles may vary by school branding
  {{/isMultiTenant}}

## Migration Guide

{{#hasMigration}}

### From v{{previousVersion}}

```typescript
// Before
{
  {
    migrationBefore
  }
}

// After
{
  {
    migrationAfter
  }
}
```

{{/hasMigration}}

## Known Issues

{{#issues}}

- **#{{issueNumber}}**: {{issueDescription}}
  {{/issues}}

## Related Components

{{#related}}

- [{{component}}](./{{component}}.md): {{relationship}}
  {{/related}}

## Storybook

{{#hasStorybook}}
View in Storybook: [{{name}} Stories]({{storybookUrl}})
{{/hasStorybook}}

## Changelog

| Date | Version | Changes |
| ---- | ------- | ------- |

{{#changelog}}
| {{date}} | {{version}} | {{changes}} |
{{/changelog}}

---

_Generated: {{timestamp}}_
_Source: {{sourceFile}}_
_Last Modified: {{lastModified}}_

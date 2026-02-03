# Feature: {{featureName}}

## 📋 Overview

{{description}}

## 🚀 Quick Start

### Import

```typescript
import { {{mainComponent}} } from '@/components/school-dashboard/{{feature}}/content'
```

### Basic Usage

```tsx
<{{mainComponent}} />
```

## 📁 Structure

```
src/components/platform/{{feature}}/
├── content.tsx         # Main UI composition
├── actions.ts          # Server actions
├── validation.ts       # Zod schemas
├── types.ts           # TypeScript types
├── form.tsx           # Form components
├── column.tsx         # Data table columns
├── card.tsx           # Card components
├── use-{{feature}}.ts # Custom hooks
├── config.ts          # Configuration
└── README.md          # This file
```

## 🔧 Components

### Main Components

| Component | Purpose | Props |
| --------- | ------- | ----- |

{{#components}}
| `{{name}}` | {{purpose}} | {{props}} |
{{/components}}

### Hooks

| Hook | Purpose | Returns |
| ---- | ------- | ------- |

{{#hooks}}
| `{{name}}` | {{purpose}} | {{returns}} |
{{/hooks}}

## 🔌 API

### Server Actions

| Action | Purpose | Parameters | Returns |
| ------ | ------- | ---------- | ------- |

{{#actions}}
| `{{name}}` | {{purpose}} | {{params}} | {{returns}} |
{{/actions}}

### Validation Schemas

```typescript
{
  {
    validationSchemas
  }
}
```

## 💾 Database

### Models

```prisma
{{prismaModels}}
```

### Relationships

```mermaid
graph LR
{{#relationships}}
    {{from}} --> {{to}}
{{/relationships}}
```

## 🌍 Multi-Tenant

- ✅ All queries scoped by `schoolId`
- ✅ Tenant isolation enforced
- ✅ Cross-tenant queries blocked
- ✅ Session validation required

### Example Query

```typescript
const data = await db.{{model}}.findMany({
  where: { schoolId: session.user.schoolId }
})
```

## 🌐 Internationalization

### Supported Languages

- 🇸🇦 Arabic (RTL)
- 🇬🇧 English (LTR)

### Translation Keys

```typescript
{
  {
    translationKeys
  }
}
```

## 🧪 Testing

### Coverage

```
Component       | Statements | Branches | Functions | Lines |
----------------|------------|----------|-----------|-------|
{{feature}}     | {{stmts}}% | {{branch}}% | {{funcs}}% | {{lines}}% |
```

### Running Tests

```bash
# Run all tests
pnpm test {{feature}}

# Run specific test
pnpm test {{feature}}/{{component}}.test.tsx

# With coverage
pnpm test {{feature}} --coverage
```

### Test Structure

```typescript
describe("{{featureName}}", () => {
  it("should handle CRUD operations", () => {})
  it("should validate input", () => {})
  it("should respect multi-tenant scope", () => {})
  it("should handle errors gracefully", () => {})
})
```

## 🔒 Security

### Authentication

- ✅ Session required
- ✅ Role-based access
- ✅ JWT validation

### Authorization

```typescript
const allowedRoles = ["ADMIN", "TEACHER"]
```

### Data Validation

- ✅ Input sanitization
- ✅ Zod schema validation
- ✅ SQL injection prevention
- ✅ XSS protection

## ⚡ Performance

### Optimizations

{{#optimizations}}

- {{optimization}}
  {{/optimizations}}

### Metrics

- **Load Time**: {{loadTime}}ms
- **API Response**: {{apiResponse}}ms
- **Bundle Size**: {{bundleSize}}KB

## 📊 Usage Examples

### Create {{entity}}

```typescript
{
  {
    createExample
  }
}
```

### Read {{entity}}

```typescript
{
  {
    readExample
  }
}
```

### Update {{entity}}

```typescript
{
  {
    updateExample
  }
}
```

### Delete {{entity}}

```typescript
{
  {
    deleteExample
  }
}
```

## 🐛 Known Issues

{{#issues}}

- **Issue #{{number}}**: {{description}}
  - **Status**: {{status}}
  - **Workaround**: {{workaround}}
    {{/issues}}

## 📚 Related Documentation

- [API Documentation](../../../docs/api/{{feature}}.md)
- [Component Storybook]({{storybookUrl}})
- [Database Schema](../../../docs/database/{{model}}.md)
- [Architecture Decision](../../../docs/architecture/{{feature}}-adr.md)

## 🔄 Changelog

### {{version}} - {{date}}

{{#changes}}

- {{change}}
  {{/changes}}

## 👥 Contributing

### Development Workflow

1. Create feature branch: `git checkout -b feature/{{feature}}-enhancement`
2. Write tests first (TDD)
3. Implement feature
4. Ensure 95%+ coverage
5. Submit PR with description

### Code Standards

- ✅ TypeScript strict mode
- ✅ ESLint rules pass
- ✅ Prettier formatted
- ✅ No `any` types
- ✅ Documented functions

## 📞 Support

- **Documentation**: [Docs Site](https://ed.databayt.org/docs)
- **Issues**: [GitHub Issues](https://github.com/org/repo/issues)
- **Discord**: [Community Server](https://discord.gg/...)

---

_Last Updated: {{timestamp}}_
_Auto-Generated: Do not edit manually_

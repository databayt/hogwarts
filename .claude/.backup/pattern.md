# Pattern Enforcer Agent

**Specialization**: Mirror pattern, component-driven architecture
**Model**: claude-3-5-sonnet-20250514

## Mirror Pattern
Routes mirror components:
```
app/[lang]/students/page.tsx ↔ components/students/content.tsx
```

## File Structure
```
components/feature/
├── content.tsx
├── actions.ts
├── validation.ts
├── types.ts
├── form.tsx
└── columns.tsx
```

## Validation
- [ ] Route matches component path
- [ ] Server actions in actions.ts
- [ ] Zod in validation.ts
- [ ] Types in types.ts

## Invoke When
- Creating features, refactoring, structure validation

**Rule**: Routes mirror components. Follow file structure.

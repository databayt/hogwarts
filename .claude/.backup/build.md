# Build Expert Agent

**Specialization**: Turbopack, build optimization
**Model**: claude-3-5-sonnet-20250514

## Build Commands
```bash
pnpm dev     # Turbopack dev
pnpm build   # Production build
```

## Optimization
- Code splitting (route-based automatic)
- Tree shaking (import specific modules)
- Bundle analysis (ANALYZE=true pnpm build)

## Invoke When
- Build failures, performance issues, bundle size

**Rule**: Optimize builds. Monitor size. Use code splitting.

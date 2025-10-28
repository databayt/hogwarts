---
description: Build only recently modified modules
---

Incremental build optimization:

1. Invoke /agents/nextjs to analyze changed files and run production build
2. Run: pnpm build
3. Report build metrics:
   - Build time
   - Bundle size
   - Changed routes
   - Performance impact
   - Type errors (if any)
   - Build warnings

Next.js automatically handles incremental builds with Turbopack optimization.

The Next.js agent includes comprehensive build expertise:
- Build error analysis and troubleshooting
- Bundle size optimization
- Turbopack configuration
- Server Component vs Client Component analysis
- Route optimization
- Performance recommendations

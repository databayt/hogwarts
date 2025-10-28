---
description: Performance optimization analysis
requiresArgs: true
---

Optimize: $1

1. Invoke /agents/performance for analysis
2. Invoke /agents/database-optimizer for query optimization
3. Check:
   - React rendering (unnecessary re-renders)
   - Database queries (N+1 detection)
   - Bundle size (code splitting opportunities)
   - Image optimization
   - Caching strategies

Provide:
- Issues found
- Optimization recommendations
- Expected impact
- Implementation steps

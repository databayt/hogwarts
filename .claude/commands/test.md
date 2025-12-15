---
description: Generate and run tests for file
requiresArgs: true
---

Test file: $1

1. Invoke /agents/test to generate tests if missing
2. Run tests: pnpm test $1
3. Check coverage: pnpm test $1 --coverage
4. Report results

Target: 95%+ coverage with all test types:

- Render tests
- Interaction tests
- Edge cases
- Accessibility tests

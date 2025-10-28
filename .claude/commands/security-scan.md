---
description: Full security vulnerability audit
---

Comprehensive security audit:

1. Invoke /agents/security for OWASP Top 10 check
2. Invoke /agents/auth for authentication review
3. Invoke /agents/multi-tenant for tenant isolation check
4. Run: npm audit
5. Check for exposed secrets: git log -p | grep -E "(api[_-]?key|secret|password)"

Report:
- Critical vulnerabilities
- Medium vulnerabilities
- Recommendations
- False positives to ignore

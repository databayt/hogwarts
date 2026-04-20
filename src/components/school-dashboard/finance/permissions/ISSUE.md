# Permissions -- Readiness & Open Work

> 75% ready · Per-user finance permissions, grant / revoke / copy

## MVP Checklist

- [x] `FinancePermission` model with sub-feature granularity
- [x] Grant / revoke / copy flows
- [x] Tenant isolation + RBAC gating (only ADMIN can manage)
- [x] Error codes (`PERMISSION_GRANT_FAILED`, etc.)
- [ ] Migrate form validations to `ValidationHelper`
- [ ] Test coverage
- [ ] Audit log of permission changes

## Known Issues

### P1

- [ ] No history of who granted what, when -- compliance risk
- [ ] Bulk grant (select multiple users, apply same permission set)

### P2

- [ ] Time-bound grants (e.g., permission expires after 30 days)
- [ ] Role-based permission templates (ACCOUNTANT gets preset Y)

### P3

- [ ] Permission simulation ("what can user X do?")
- [ ] Delegation chains (user can grant subset of their own permissions)

## Test Gaps

- [ ] Grant / revoke state
- [ ] Copy permissions from user A to user B (edge: cycles, self-reference)
- [ ] Permission check enforcement inside each sub-module action

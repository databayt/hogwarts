# Timesheet -- Readiness & Open Work

> 75% ready · Timesheet periods, entries, approval

## MVP Checklist

- [x] Timesheet period CRUD
- [x] Entry creation per employee
- [x] Approval workflow
- [x] Tenant isolation
- [ ] Migrate `validation.ts` to `ValidationHelper`
- [ ] Test coverage
- [ ] Mobile clock-in
- [ ] Geolocation verification

## Known Issues

### P1

- [ ] No mobile-friendly clock-in UI -- desktop only
- [ ] No geolocation verification (staff can clock in off-site)
- [ ] Overtime detection absent -- entries above 8h/day not flagged

### P2

- [ ] Break-time tracking
- [ ] Timesheet export to payroll input file
- [ ] Shift-pattern templates

### P3

- [ ] Biometric / RFID integration
- [ ] Late-arrival notifications to supervisor
- [ ] Timesheet vs attendance cross-reference

## Test Gaps

- [ ] Period create / close state transitions
- [ ] Entry validation (overlap detection, future-date rejection)
- [ ] Approval routing

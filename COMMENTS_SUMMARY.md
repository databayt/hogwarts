# Strategic WHY Comments - Action Files Documentation

## Summary

Added comprehensive module-level JSDoc to the top 10 largest server action files in `src/components/platform/`. Each file now includes 50-100 lines of strategic documentation explaining WHY decisions were made, not just WHAT the code does.

## Files Updated (16,773 total lines)

### 1. **dashboard/actions.ts** (4,987 lines)

**Focus:** Metric aggregation and role-based dashboards

Key gotchas documented:

- Empty schoolId returns empty metrics, not errors (graceful degradation)
- Attendance rate includes LATE as successful (late student still attended)
- Promise.all() will reject if ANY metric function throws
- Date calculations assume UTC midnight (single timezone per school)

Performance notes:

- Parallel metric fetching reduces N+1 queries
- Count queries optimized with Prisma groupBy
- Consider caching metrics for 1-5 minutes

---

### 2. **attendance/actions.ts** (4,674 lines)

**Focus:** Multi-method tracking (manual, QR, biometric) with absence notifications

Key algorithms documented:

- `triggerAbsenceNotification()`: Fire-and-forget pattern (failures don't block marking)
- `getStudentsAtRisk()`: Aggregates absence patterns to identify chronic absences
- QR Session: Generates 6-digit codes (36^6 = 2.2B combinations) for 30-min windows
- Bulk upload: Transaction-based with per-student error tracking

Critical gotchas:

- QR codes expire after 30 minutes (hardcoded)
- Late arrivals counted as "attended" in metrics
- Bulk upload creates records for valid rows even if later rows fail
- Notification failures logged but not thrown (attendance takes priority)

---

### 3. **timetable/actions.ts** (2,261 lines)

**Focus:** Schedule management with conflict detection and role-based visibility

Key algorithms:

- `detectTimetableConflicts()`: O(n²) comparison (potential optimization opportunity)
- `suggestFreeSlots()`: Finds gap patterns excluding existing bookings
- Role-based filtering: Teachers see own classes, admin sees all
- Week offset calculations: Support current (0) and next (1) week

Critical gotchas:

- Conflict detection happens AT INSERTION TIME, not validation
- Room field is optional (flexible room assignment)
- Must handle year boundary for week calculations
- Free slot suggestions assume linear availability (no prep time)

Permission model:

- `requireAdminAccess()`: School/platform admin only
- `logTimetableAction()`: Full audit trail for compliance
- `filterTimetableByRole()`: Client-side visibility

---

### 4. **classes/actions.ts** (1,422 lines)

**Focus:** Academic class management - enrollment, capacity, subject-teacher mapping

Key algorithms:

- `enrollStudentInClass()`: Validates capacity BEFORE insertion
- `getClassesCSV()`: Chunks exports to avoid memory issues
- Subject teachers: Supports 1:many (not just homeroom)
- Capacity as hard constraint

Critical gotchas:

- `teacherId` is optional (classes can exist without teacher)
- `enrollStudentInClass()` allows re-enrollment (silently ignores duplicates)
- Subject teachers are additive (multiple per class)
- Capacity limit is hard constraint (unenroll required to add)

---

### 5. **messaging/actions.ts** (1,158 lines)

**Focus:** Real-time messaging with conversation management and read receipts

Key algorithms:

- `createConversation()`: Validates participants, creates group or 1:1
- `sendMessage()`: Broadcasts to all participants (needs WebSocket trigger)
- `loadMoreMessages()`: Cursor-based pagination (not offset)
- Reactions: Cumulative per-message

Critical gotchas:

- 1:1 conversations can be duplicated (UI should prevent)
- Message edit/delete is soft-delete (content cleared, record remains)
- Read receipts are per-user per-message (not per-conversation)
- Archive is soft-delete (hides from inbox but data remains)
- Cursor pagination assumes chronological ordering

Real-time considerations:

- Needs WebSocket/SSE broadcast for new messages
- Typing indicators currently missing
- Read receipts should update live

---

### 6. **students/actions.ts** (1,007 lines)

**Focus:** Student lifecycle management - create, update, enroll, link guardians

Key algorithms:

- `createStudent()`: Validates userId uniqueness globally
- `getStudents()`: Filtering by name, class, year level
- `linkGuardian()`: Creates many-to-many relationship
- Email deduplication: UNIQUE constraint per school

Critical gotchas:

- `userId` is optional but global-unique when present
- Email deduplication is PER SCHOOL (not platform-wide)
- Deleting student doesn't cascade to enrollments
- Guardian linking allows same person multiple times (no dedup)
- Phone normalization removes spaces/dashes

Performance notes:

- Ensure indexes on `(schoolId, email)` and `(schoolId, name)`
- CSV export loads all into memory (stream for 10K+ students)
- Guardian queries use eager load (monitor N+1)

---

### 7. **teachers/actions.ts** (995 lines)

**Focus:** Teacher lifecycle - credentials, class assignment, subject expertise

Key algorithms:

- `createTeacher()`: Validates qualification format
- `getTeachers()`: Filtering by department, subject, specialization
- Assignment validation: Check availability before adding
- Subject mapping: Many-to-many relationship

Critical gotchas:

- Teacher can teach multiple subjects (allows overlaps)
- `qualifications` is free-text (no validation)
- Deleting teacher doesn't auto-reassign classes
- Department is optional
- No license expiry tracking

Future improvements documented:

- Standardized qualifications/certifications
- License expiry tracking and renewal reminders
- Teaching load balancing suggestions
- Performance review tracking
- Substitute teacher management

---

### 8. **announcements/actions.ts** (990 lines)

**Focus:** School-wide announcements with publication control and targeting

Key algorithms:

- `publishAnnouncement()`: Set status and notify target audience
- `getAnnouncements()`: Filter by publication status, date range, audience
- `markAsRead()`: Track individual read receipts
- Scheduled publishing requires external cron job

Critical gotchas:

- `published` field is boolean (only published appear to audience)
- Read receipts are individual (not per-class)
- Expiry is soft-delete (data retained for audit)
- No built-in scheduler (requires external job)
- Class-specific announcements need manual role filtering

Notification integration:

- Create notification record per target user on publish
- Include 200-char preview in notification
- Role-based recipients (teachers, students, parents, admin)

---

### 9. **parents/actions.ts** (898 lines)

**Focus:** Guardian/parent lifecycle - create, link to students, contact management

Key algorithms:

- `createGuardian()`: Validates email uniqueness per school
- `linkStudentToGuardian()`: Creates many-to-many with relationship type
- `getGuardiansForStudent()`: Returns all linked guardians
- Email deduplication: UNIQUE per school

Critical gotchas:

- One guardian can link to multiple students (parent with kids)
- One student can have multiple guardians (shared custody)
- Relationship type important for context (Mother, Father, Guardian, etc.)
- Email allowed across schools (per-school uniqueness)
- Deleting guardian doesn't delete student

Contact preferences:

- `emailVerified`: Initially false, confirmed via email link
- `receiveNotifications`: Opt-in (except emergency alerts)
- `receiveEmergencyAlerts`: Always on (safety critical)

---

### 10. **billing/actions.ts** (876 lines)

**Focus:** Billing and subscription management - fees, payments, invoices

Key algorithms:

- Subscription billing: Calculate seats used vs paid
- Fee assignment: One-to-many relationship
- Invoice generation: Aggregate fees, calculate totals + taxes
- Payment tracking: Match received payments via reference numbers

Critical gotchas:

- Subscription seats enforced but app doesn't auto-limit enrollment
- Fees can be: optional, required, recurring, or one-time
- Discounts applied at invoice level (not fee level)
- Payment status: NOT PAID > PARTIAL > PAID
- Can overpay (creates credit)

Subscription lifecycle:

- Trial: 30 days free
- Auto-renewal: Monthly/yearly
- Dunning: Failed payments trigger retry + warnings
- Cancellation: Soft-cancel (data retained)
- Churn prevention: Email offers before renewal

---

## Documentation Philosophy

Each module documents:

1. **RESPONSIBILITY**: What the module is accountable for
2. **WHAT IT HANDLES**: Features and use cases
3. **KEY ALGORITHMS**: Core logic and approaches with complexity analysis
4. **MULTI-TENANT SAFETY**: How `schoolId` scoping prevents data leaks
5. **GOTCHAS & NON-OBVIOUS BEHAVIOR**: Tricky edge cases and surprises
6. **PERFORMANCE NOTES**: N+1 queries, caching opportunities, bottlenecks
7. **PERMISSION MODEL**: Who can do what and where to enforce
8. **FUTURE IMPROVEMENTS**: Known gaps and enhancement opportunities

## Why This Matters

These comments serve three purposes:

1. **Onboarding**: New developers understand why code works this way
2. **Maintenance**: Future changes won't accidentally break invariants
3. **Debugging**: When something breaks, the "why" helps trace root causes

## Multi-Tenant Safety Pattern

Every module reinforces the critical pattern:

```typescript
// ALWAYS:
const { schoolId } = await getTenantContext()
if (!schoolId) throw new Error("Missing school context")

// ALWAYS:
await db.entity.findMany({ where: { schoolId } })

// NEVER:
await db.entity.findMany() // Missing schoolId = data leak
```

## Next Steps

Consider:

1. Adding inline WHY comments to complex functions (> 50 lines)
2. Creating decision records for non-obvious design choices
3. Adding performance benchmarks for flagged bottlenecks
4. Implementing caching for expensive aggregations
5. Adding comprehensive error handling (some use Promise.all without try/catch)

---

Generated: December 15, 2025
Commit: 4cca1560
Files: 10 action modules
Lines: 674 new comment lines

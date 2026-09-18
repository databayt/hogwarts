---
epic: 09
sprint: Q3-2026
title: Mobile API Layer
file_type: readme
owner: Abdout
maturity: In Progress
completion: 40
tracker: https://github.com/databayt/hogwarts/issues/315
docs: https://ed.databayt.org/en/docs/mobile-api
last_audited: 2026-09-14
---

# Mobile API Layer

Backend API endpoints serving the Hogwarts Android and iOS mobile apps.

## Architecture

```
Client (Android/iOS)
  → JWT Bearer token + X-School-Id header
  → GET/POST https://ed.databayt.org/api/mobile/{resource}
  → Backend verifies JWT, extracts schoolId from payload
  → Queries Prisma DB scoped by schoolId
  → Returns snake_case JSON
```

### Authentication

All endpoints (except `/api/mobile/auth/*` and `/api/mobile/schools`) require:

- `Authorization: Bearer <jwt>` header
- JWT must contain `schoolId` claim (issued at login)

Shared helper: `lib/authenticate.ts` — extracts and verifies token, returns `{ userId, email, schoolId, role }` or an error:

| Status | Body                             | When                                                              |
| ------ | -------------------------------- | ----------------------------------------------------------------- |
| 401    | `{ error: "Unauthorized" }`      | no bearer token                                                   |
| 401    | `{ error: "Invalid token" }`     | bad signature / expired / a refresh token / user no longer exists |
| 400    | `{ error: "No school context" }` | token has no `schoolId`                                           |
| 403    | `{ error: "suspended" }`         | `User.isSuspended`                                                |
| 401    | `{ error: "Token revoked" }`     | token `tv` ≠ `User.tokenVersion` (after logout / password reset)  |

Suspension and token version are cached per user for 60s (logout clears its own entry). Tokens minted before `tv` existed count as version 0.

Role checks use `lib/roles.ts` → `hasRole(auth, ...roles)`, typed off Prisma `UserRole` (DEVELOPER, ADMIN, TEACHER, STUDENT, GUARDIAN, ACCOUNTANT, STAFF, USER). There is no SUPER_ADMIN; DEVELOPER is the platform role.

### Multi-Tenancy

Every query is scoped by `schoolId` from the JWT payload. The `X-School-Id` header sent by the Android app is a secondary signal — the JWT claim is authoritative.

### Response Format

- Lists: `{ data: [...], total: number, page: number, per_page: number }`
- Details: flat object
- Mutations: `{ id, ...created_fields }` with 201 status
- Errors: `{ error: "message" }` with appropriate HTTP status

All field names use **snake_case** (mobile DTO convention).

---

## Endpoint Inventory

### Auth (pre-existing)

| Method | Path                            | Description                                                                   |
| ------ | ------------------------------- | ----------------------------------------------------------------------------- |
| POST   | `/api/mobile/auth`              | Email/password login                                                          |
| PUT    | `/api/mobile/auth`              | Refresh (`X-Refresh-Token`); 401 on stale `tv`, 403 suspended                 |
| POST   | `/api/mobile/auth/google`       | Google sign-in — see _Social login_ below                                     |
| POST   | `/api/mobile/auth/apple`        | Apple sign-in (identity token verified against Apple JWKS)                    |
| POST   | `/api/mobile/auth/facebook`     | Facebook sign-in                                                              |
| POST   | `/api/mobile/auth/logout`       | Authenticated; bumps `User.tokenVersion` → every token of the user is revoked |
| POST   | `/api/mobile/auth/register`     | Registration                                                                  |
| POST   | `/api/mobile/auth/reset`        | Password reset                                                                |
| POST   | `/api/mobile/auth/verify-otp`   | OTP verification                                                              |
| POST   | `/api/mobile/auth/new-password` | Set new password (also revokes existing tokens)                               |
| GET    | `/api/mobile/schools`           | List schools                                                                  |

**Social login never issues a token without a school.** Body may carry `school_id`. If the identity is already school-scoped → the usual `{ access_token, refresh_token, expires_at, user }`. If `school_id` names a school the verified email already has an account in → tokens for that school account. Otherwise → `200 { needs_school: true, schools: [{ id, name, name_en, logo_url, domain }] }` (the email's schools, same shape as `GET /schools`; empty when the provider gave no email) — retry the same call with `school_id`.

### Dashboard (new)

| Method | Path                             | Description                                  |
| ------ | -------------------------------- | -------------------------------------------- |
| GET    | `/api/mobile/dashboard`          | Role-based summary stats                     |
| GET    | `/api/mobile/dashboard/sections` | The per-role sections under the phone blocks |

Original flat fields stay (`user_name`, `avatar_url`, `role`, `school_name`, `unread_notifications`, `announcements_count`, role stats). Role stats: STUDENT `attendance_percentage, upcoming_exams, today_classes` · TEACHER `total_classes, today_classes` · GUARDIAN `children_count` · ADMIN/DEVELOPER `total_students, total_teachers, total_classes` · ACCOUNTANT `pending_invoices, pending_amount, overdue_invoices, overdue_amount, collected_today` · STAFF `total_students, present_today, upcoming_events`.

Additive (2026-09): `school { id, name, name_en, logo_url, enabled_modules (null = all) }`, `unread_messages`, `events_today` (school events dated today, not cancelled), `next_actions [{ kind, mark, href }]` (web `rankNextActions` over the shared upcoming loader; `href` is a locale-less web path), `quick_actions [{ key, label, description, href, icon }]`, `today_timetable` (STUDENT/TEACHER, else null) `{ day_of_week, date, is_today, closure { title, type } | null, periods [{ period_id, period_name, start_time, end_time, subject, class_name, section_id, teacher, room, is_break, timetable_id, live_class }] }`.

`today_timetable` is not strictly today. It runs the web day card's fall-forward (`timetable/resolve-schedule-day.ts`, shared with `dashboard/today-timetable.tsx`): today, then up to four days ahead, stopping at the FIRST day that has a taught period, skipping days with a declared closure and days whose pattern has no classes. So on a Friday the app shows Sunday, as the web does under its "Next classes" heading. `date` is the day it landed on and `is_today` says whether that is today — derive the day name from `date` client-side, or from `day_of_week` when the reader's zone is far from the server's. A day it fell PAST is never reported, closure included, so `closure` is non-null only in the one case where the walk finds nothing and stays on today — the payload iOS has always read. A school with no periods at all (no term) still returns today with `periods: []`, one read, no walk. Additive (2026-09-18): `is_today`.

`dashboard/sections` is the web's `ResourceUsageSection` + `InvoiceHistorySection` (`dashboard/queries.ts`, shared with `getResourceUsageByRole` / `getInvoicesByRole`): `resource_usage [{ key, name, used, limit, unit, percent }]`, `invoices [{ id, date, description, amount, currency, status: paid|open|void }]`. `key` is the stable camelCase id under `school.dashboard.resourceNames` in the dictionaries (`lessonsThisWeek`, `ungradedWork`, `currentGpa`, `activeUsers`, …) — localize by it, fall back to `name` (the server's English label). `percent` is the number the web's usage table prints last: `Math.round(used / limit * 100)`, unclamped, 0 when `limit` is 0. `date` is ISO; `amount` is a number and `currency` is `USD` (the web prints a `$`). Every role gets 200 with two arrays; a role the web renders no sections for (USER, anything outside the eight dashboard variants) gets two EMPTY arrays rather than the ADMIN fall-through, which would be the whole school's billing. Rows come back empty when the caller has no student/teacher row. DEVELOPER's usage rows are platform-wide by design (`schoolsActive`, `platformUsers`); its invoices are still school-scoped.

### Profile (new)

| Method | Path                  | Description          |
| ------ | --------------------- | -------------------- |
| GET    | `/api/mobile/profile` | Current user profile |
| PUT    | `/api/mobile/profile` | Update profile       |

### Students (new)

| Method | Path                       | Description                             |
| ------ | -------------------------- | --------------------------------------- |
| GET    | `/api/mobile/students`     | List (search, filter by section/status) |
| POST   | `/api/mobile/students`     | Create (admin only)                     |
| GET    | `/api/mobile/students/:id` | Detail                                  |
| PUT    | `/api/mobile/students/:id` | Update (admin only)                     |

### Attendance (new)

| Method | Path                                 | Description                                                                                                                                        |
| ------ | ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/api/mobile/attendance/student/:id` | Student records                                                                                                                                    |
| GET    | `/api/mobile/attendance/class/:id`   | Class roster + attendance for a date                                                                                                               |
| GET    | `/api/mobile/attendance/summary/:id` | Summary (present/absent/late counts)                                                                                                               |
| POST   | `/api/mobile/attendance/mark`        | Mark single student                                                                                                                                |
| POST   | `/api/mobile/attendance/bulk`        | Bulk mark class                                                                                                                                    |
| GET    | `/api/mobile/attendance/clock`       | Own clock state `{ available, kind: staff\|teacher\|null, checked_in_at, checked_out_at, today_hours, week_hours }`; no clock → `available: false` |
| POST   | `/api/mobile/attendance/clock`       | `{ action: in\|out }` → same shape; 403 role, 404 `NO_CLOCK_IDENTITY` / `NOT_CHECKED_IN`                                                           |
| GET    | `/api/mobile/attendance/today`       | ADMIN/STAFF/DEVELOPER day overview (web `/attendance` overview); `limit` (1–20, default 5) for `needs_attention`                                   |

Clock rules are the web clock card's (`attendance/actions/clock-core.ts`): TEACHER/STAFF/ADMIN/DEVELOPER; a StaffMember row clocks into StaffTimesheetEntry, else a Teacher row into the finance TimesheetEntry (DRAFT); both directions idempotent. "Today" is the server's midnight, as on web.

`attendance/today` reads `attendance/queries.ts` (shared with `getTodaysDashboard` + `getFollowUpStudents`) and returns `today { date, day_name, is_school_day }`, `stats { total_students, marked_today, present, absent, late, attendance_rate, classes_total, classes_marked }`, `unmarked_classes [{ id, name, student_count }]` (empty on a non-school day), `needs_attention [{ student_id, student_name, class_name, issue: consecutive_absence|unexcused_pending, severity: critical|warning|info, details, count, date, action_url }]`, `needs_attention_summary { critical, warning, info }`, `recent_activity [{ id, student_name, class_name, status, method, date, time, marked_at }]` (last 10; `time` is a server-local label, prefer `marked_at`).

### Grades (new)

| Method | Path                             | Description                        |
| ------ | -------------------------------- | ---------------------------------- |
| GET    | `/api/mobile/grades/student/:id` | Student results                    |
| GET    | `/api/mobile/grades/summary/:id` | GPA summary + by-subject breakdown |

### Conversations & Messages (new)

| Method | Path                                     | Description                             |
| ------ | ---------------------------------------- | --------------------------------------- |
| GET    | `/api/mobile/conversations`              | List (with unread counts, last message) |
| POST   | `/api/mobile/conversations`              | Create (direct or group)                |
| GET    | `/api/mobile/conversations/:id/messages` | Messages (cursor pagination)            |
| POST   | `/api/mobile/conversations/:id/messages` | Send (with nonce dedup)                 |
| POST   | `/api/mobile/conversations/:id/read`     | Mark read                               |

The conversations list is camelCase (kept as shipped): `{ data: [{ id, type, title, avatarUrl, unreadCount, isPinned, isMuted, whatsappEnabled, participantCount, otherParticipant { id, name, image } | null, updatedAt, lastMessage { id, content, senderId, senderName, contentType: text|image|file|system, status, sentAt } | null }], total }`. `participantCount` counts active participants; `otherParticipant` is set for direct chats only. Additive (2026-09): `participantCount`, `otherParticipant`, `lastMessage.senderId`, `lastMessage.contentType`.

### Notifications (new)

| Method | Path                                 | Description                                                                |
| ------ | ------------------------------------ | -------------------------------------------------------------------------- |
| GET    | `/api/mobile/notifications`          | List (with unread count)                                                   |
| POST   | `/api/mobile/notifications/:id/read` | Mark single read                                                           |
| POST   | `/api/mobile/notifications/read-all` | Mark all read                                                              |
| POST   | `/api/mobile/notifications/register` | `{ device_token, platform: android\|ios }` — one active token per platform |

### Timetable (new)

| Method | Path                            | Description                                |
| ------ | ------------------------------- | ------------------------------------------ |
| GET    | `/api/mobile/timetable/:userId` | Schedule (auto-detects student vs teacher) |

### Exams (new)

| Method | Path                    | Description                       |
| ------ | ----------------------- | --------------------------------- |
| GET    | `/api/mobile/exams`     | List (filter by status, upcoming) |
| GET    | `/api/mobile/exams/:id` | Detail                            |

### Fees (new)

| Method | Path                                  | Description                                                                                                        |
| ------ | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| GET    | `/api/mobile/fees`                    | Legacy FeeRecord rows (`student_id` now ownership-checked)                                                         |
| GET    | `/api/mobile/fees/summary/:studentId` | Legacy summary (ownership-checked)                                                                                 |
| GET    | `/api/mobile/fees/invoices`           | STUDENT/GUARDIAN instalments — `student_id, status, due=true, lang, page, per_page`; + `currency, totals, methods` |
| GET    | `/api/mobile/fees/invoices/:id`       | One instalment + `fee` balance, `payments`, `methods`, `can_pay_online`                                            |
| GET    | `/api/mobile/fees/payments`           | Payment history (SUCCESS + PENDING_VERIFICATION)                                                                   |
| POST   | `/api/mobile/fees/pay`                | `{ fee_assignment_id, gateway?, lang? }` → `{ checkout_url, gateway, amount, currency }` (Stripe/Tap)              |

The family routes read the web `/finance` resolution (`loadFamilyMoney`); `pay` uses the web checkout core. Refusals: 403 `UNAUTHORIZED`, 409 `FEE_FULLY_PAID`, 422 `PAYMENT_GATEWAY_UNAVAILABLE` (manual rails), 502 `PAYMENT_FAILED`.

### Assignments (new)

| Method | Path                                                    | Description                                                                               |
| ------ | ------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| GET    | `/api/mobile/assignments`                               | STUDENT own classes · GUARDIAN `?student_id=` · TEACHER own classes · ADMIN/DEVELOPER all |
| GET    | `/api/mobile/assignments/:id`                           | Detail (+ `submission` for student / guardian `?student_id=`)                             |
| POST   | `/api/mobile/assignments/:id/submissions`               | STUDENT hand-in `{ content?, attachments?: [file_url] }` → 201 submission                 |
| GET    | `/api/mobile/assignments/:id/submissions`               | TEACHER (of the class) / ADMIN — `status, page, per_page`                                 |
| PUT    | `/api/mobile/assignments/:id/submissions/:submissionId` | Grade `{ score, feedback? }`; 400 `SCORE_ABOVE_TOTAL`                                     |

### Report Cards

| Method | Path                               | Description                                                  |
| ------ | ---------------------------------- | ------------------------------------------------------------ |
| GET    | `/api/mobile/report-cards`         | List                                                         |
| GET    | `/api/mobile/report-cards/:id`     | Detail                                                       |
| GET    | `/api/mobile/report-cards/:id/pdf` | 302 to a 15-min signed URL · 404 · 403 · 425 while rendering |

### Offline & Uploads (new)

| Method | Path                         | Description                                                                                                                                          |
| ------ | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| POST   | `/api/mobile/offline/sync`   | Outbox drain `{ items: [{ idempotency_key, kind, payload, created_at }] }` → `{ results: [{ idempotency_key, result, code?, data? }], server_time }` |
| POST   | `/api/mobile/upload/presign` | `{ purpose: attachment\|payment_proof\|video, filename, content_type, size }` → `{ upload_url, file_url, key, expires_in, method, headers }`         |

`idempotency_key` matches `[A-Za-z0-9:_-]{8,128}`, so a key can name what it is (`attendance:{section_id}:{date}`); anything else is a 400 for the whole batch.

### Announcements (new)

| Method | Path                            | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ------ | ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/api/mobile/announcements`     | Exactly the web `/announcements` list for the caller (`resolveViewerAudience` in `listings/announcements/queries.ts`): staff see the whole school list, drafts included; STUDENT/GUARDIAN/USER (and any unknown role) see only published, unexpired notices for the school, their role or their classes. Pinned first, then newest. `page, per_page (≤100), title, lang (ar\|en)`. Additive: `scope, target_role, class_id, is_published, is_pinned, is_featured, lang, created_at, is_read` |
| GET    | `/api/mobile/announcements/:id` | Same audience rule (not an audience → 404); marks read. `lang`. Additive: `updated_at, lang, is_read`                                                                                                                                                                                                                                                                                                                                                                                        |

### Events (new)

| Method | Path                 | Description   |
| ------ | -------------------- | ------------- |
| GET    | `/api/mobile/events` | School events |

### Guardian (new)

| Method | Path                            | Description                |
| ------ | ------------------------------- | -------------------------- |
| GET    | `/api/mobile/guardian/children` | Guardian's linked children |

### Teacher (new)

| Method | Path                                       | Description                                                                                                                                   |
| ------ | ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/api/mobile/teacher/classes`              | Assigned sections + subjects                                                                                                                  |
| GET    | `/api/mobile/teacher/classes/:id/students` | Students in section                                                                                                                           |
| GET    | `/api/mobile/teacher/schedule?day=`        | Own slots `{ data: [{ id, day_of_week, subject_name, section_id, section_name, grade_name, classroom, period_name, start_time, end_time }] }` |

### Admin (new)

| Method | Path                       | Description                |
| ------ | -------------------------- | -------------------------- |
| GET    | `/api/mobile/admin/school` | School info + counts       |
| PUT    | `/api/mobile/admin/school` | Update school              |
| GET    | `/api/mobile/admin/stats`  | Full admin dashboard stats |

### Catalog (pre-existing)

| Method | Path                                 | Description    |
| ------ | ------------------------------------ | -------------- |
| GET    | `/api/mobile/catalog/subjects`       | Course catalog |
| GET    | `/api/mobile/catalog/subjects/:slug` | Course detail  |

### Subjects (pre-existing)

| Method | Path                   | Description               |
| ------ | ---------------------- | ------------------------- |
| GET    | `/api/mobile/subjects` | School's adopted subjects |

---

## Future Work

### Phase 1 — Missing CRUD Endpoints

These endpoints are called by the Android app but don't have backend routes yet:

| Priority | Group              | Endpoints Needed                                                                     |
| -------- | ------------------ | ------------------------------------------------------------------------------------ |
| P1       | Teacher Grades     | `POST /teacher/classes/:id/grades`, `POST /teacher/classes/:id/attendance`           |
| P1       | Teacher Schedule   | `GET /teacher/schedule`, `GET /teacher/classes/:id/assessments`                      |
| P1       | Admin Staff        | `GET /admin/staff`, `GET /admin/staff/:id`                                           |
| P1       | Admin Classes      | `GET /admin/classes`, `GET /admin/classes/:id`, `POST/DELETE .../students/:id`       |
| P2       | Library            | `GET /library/books`, `POST /library/books/:id/borrow`, `GET /library/my-borrowings` |
| P2       | Admission          | `GET/POST /admission/applications`, `POST .../submit`, `POST .../documents`          |
| P2       | ID Card            | `GET /idcard`                                                                        |
| P2       | Lessons/Curriculum | `GET /lessons`, `POST /lessons`, `GET /curriculum`                                   |

### Phase 2 — Advanced Features

| Priority | Group               | Endpoints Needed                                                                       |
| -------- | ------------------- | -------------------------------------------------------------------------------------- |
| P1       | Online Exams        | `GET /exams/:id/online`, `POST /exams/:id/answers`, `GET /exams/:id/results`           |
| P1       | Quiz Game           | `GET /quiz/questions`, `POST /quiz/sessions`, `GET /quiz/leaderboard`                  |
| P2       | Advanced Attendance | `GET /attendance/badges,streaks,interventions,analytics`, `POST /attendance/hall-pass` |
| P2       | WhatsApp Bridge     | `GET /whatsapp/status,qr`, `POST /whatsapp/connect,disconnect`                         |
| P2       | Courses/Enrollment  | `POST /courses/:id/enroll`, `POST /courses/:id/lessons/:id/progress`                   |
| P2       | Events Registration | `POST /events/:id/register`, `GET /events/calendar`                                    |

### Phase 3 — Android App Stubs to Fix

| Component             | Issue                           | Fix                                          |
| --------------------- | ------------------------------- | -------------------------------------------- |
| Mutation Queue        | 5 types queued but never synced | Wire Retrofit calls in `mutation-queue.kt`   |
| SubmitGradeUseCase    | Fabricates fake result          | Inject GradesRepository, call API            |
| QuizViewModel (exams) | Hardcoded 5-question quiz       | Fetch from `/api/mobile/quiz/questions`      |
| KioskModeViewModel    | Full stub, PIN hardcoded        | Wire to attendance API, secure PIN           |
| Student schedule      | Hardcoded in Composable         | Fetch from timetable API                     |
| FCM token             | Never sent to backend           | POST to `/api/mobile/notifications/register` |
| PDF download          | Empty function                  | Implement via DownloadManager                |

---

## iOS Swift App — Applying the Same Pattern

### Current State

The iOS app at `/Users/abdout/swift-app/` has the same architecture (MVVM + Clean, feature-based modules, offline-first) but uses **different endpoint paths** — no `/mobile/` prefix.

### Critical Path Difference

| Feature    | Android (Kotlin)           | iOS (Swift)         |
| ---------- | -------------------------- | ------------------- |
| Students   | `api/mobile/students`      | `api/students`      |
| Attendance | `api/mobile/attendance`    | `api/attendance`    |
| Grades     | `api/mobile/grades`        | `api/grades`        |
| Messages   | `api/mobile/conversations` | `api/conversations` |
| Auth       | `api/mobile/auth`          | `api/auth/signin`   |

### Option A: Update iOS Endpoints (Recommended)

Update the iOS `*-actions.swift` files to use the `/mobile/` prefix, matching the backend routes that already exist. This is the lowest-effort path since:

- The backend routes are built and type-checked
- The Android app already validates them
- Only the URL paths need changing in Swift

### Option B: Create Proxy Routes

Add rewrite rules or alias routes in Next.js middleware to map `/api/students` → `/api/mobile/students` etc. This avoids touching the iOS codebase but adds routing complexity.

### iOS Migration Steps (Option A)

1. **Fix auth endpoints** in `auth-manager.swift`:
   - `POST /auth/signin` → `POST /mobile/auth`
   - `POST /auth/callback/{provider}` → `POST /mobile/auth/{provider}`
   - `GET /auth/session` → decode JWT client-side (already done)
   - `POST /auth/refresh` → `PUT /mobile/auth` with `X-Refresh-Token` header
   - Remove mock login bypass (lines 62-87)

2. **Fix feature endpoints** in each `*-actions.swift`:
   - Add `/mobile/` prefix to all paths
   - Align request/response field names with snake_case convention
   - Add `JSONDecoder.keyDecodingStrategy = .convertFromSnakeCase` to `APIClient`

3. **Fix Codable models** to match backend DTOs:
   - The backend returns snake_case; Swift expects camelCase
   - Either add `.convertFromSnakeCase` to the decoder OR add `CodingKeys` enums

4. **Wire tenant context to API headers**:
   - The iOS app passes `schoolId` as a query parameter
   - The backend reads it from the JWT payload (no query param needed)
   - The iOS `TenantContext` should verify its schoolId matches the JWT

5. **Test with demo accounts**:
   - `admin@balqalam.com` / `1234` → School: نموذج (demo)
   - Backend has: 3,109 users, 58k attendance records, 1,120 timetable slots, 400 exams, 79 conversations

### Agents & Skills

- `agent:nextjs` — API route handlers
- `agent:prisma` — schema for mobile endpoints
- `agent:guardian` — auth + tenant scoping audit
- `skill:/security` — OWASP sweep
- `skill:/test` — endpoint test coverage
- `skill:/check` — quality gate

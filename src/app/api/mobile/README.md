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
last_audited: 2026-05-25
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

Shared helper: `lib/authenticate.ts` — extracts and verifies token, returns `{ userId, email, schoolId, role }` or 401/400 error.

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

| Method | Path                            | Description          |
| ------ | ------------------------------- | -------------------- |
| POST   | `/api/mobile/auth`              | Email/password login |
| PUT    | `/api/mobile/auth`              | Refresh token        |
| POST   | `/api/mobile/auth/google`       | Google OAuth         |
| POST   | `/api/mobile/auth/register`     | Registration         |
| POST   | `/api/mobile/auth/reset`        | Password reset       |
| POST   | `/api/mobile/auth/verify-otp`   | OTP verification     |
| POST   | `/api/mobile/auth/new-password` | Set new password     |
| GET    | `/api/mobile/schools`           | List schools         |

### Dashboard (new)

| Method | Path                    | Description              |
| ------ | ----------------------- | ------------------------ |
| GET    | `/api/mobile/dashboard` | Role-based summary stats |

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

| Method | Path                                 | Description                          |
| ------ | ------------------------------------ | ------------------------------------ |
| GET    | `/api/mobile/attendance/student/:id` | Student records                      |
| GET    | `/api/mobile/attendance/class/:id`   | Class roster + attendance for a date |
| GET    | `/api/mobile/attendance/summary/:id` | Summary (present/absent/late counts) |
| POST   | `/api/mobile/attendance/mark`        | Mark single student                  |
| POST   | `/api/mobile/attendance/bulk`        | Bulk mark class                      |

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

### Notifications (new)

| Method | Path                                 | Description              |
| ------ | ------------------------------------ | ------------------------ |
| GET    | `/api/mobile/notifications`          | List (with unread count) |
| POST   | `/api/mobile/notifications/:id/read` | Mark single read         |
| POST   | `/api/mobile/notifications/read-all` | Mark all read            |

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

| Method | Path                                  | Description     |
| ------ | ------------------------------------- | --------------- |
| GET    | `/api/mobile/fees`                    | Fee records     |
| GET    | `/api/mobile/fees/summary/:studentId` | Payment summary |

### Announcements (new)

| Method | Path                        | Description             |
| ------ | --------------------------- | ----------------------- |
| GET    | `/api/mobile/announcements` | Published announcements |

### Events (new)

| Method | Path                 | Description   |
| ------ | -------------------- | ------------- |
| GET    | `/api/mobile/events` | School events |

### Guardian (new)

| Method | Path                            | Description                |
| ------ | ------------------------------- | -------------------------- |
| GET    | `/api/mobile/guardian/children` | Guardian's linked children |

### Teacher (new)

| Method | Path                                       | Description                  |
| ------ | ------------------------------------------ | ---------------------------- |
| GET    | `/api/mobile/teacher/classes`              | Assigned sections + subjects |
| GET    | `/api/mobile/teacher/classes/:id/students` | Students in section          |

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
| P0       | Invoices           | `GET /invoices`, `GET /invoices/:id`                                                 |
| P0       | Payments           | `POST /payments/process`, `GET /payments/transactions`                               |
| P1       | Report Cards       | `GET /report-cards`, `GET /report-cards/:id`, `GET /report-cards/:id/pdf`            |
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
   - `admin@databayt.org` / `1234` → School: نموذج (demo)
   - Backend has: 3,109 users, 58k attendance records, 1,120 timetable slots, 400 exams, 79 conversations

### Agents & Skills

- `agent:nextjs` — API route handlers
- `agent:prisma` — schema for mobile endpoints
- `agent:guardian` — auth + tenant scoping audit
- `skill:/security` — OWASP sweep
- `skill:/test` — endpoint test coverage
- `skill:/check` — quality gate

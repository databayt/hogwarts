## Attendance — Daily Attendance Tracking

**Admin Control Center for Student Attendance Management**

The Attendance feature empowers school administrators and teachers to track student presence, manage absences, generate reports, and ensure compliance with attendance regulations through comprehensive daily and period-by-period tracking.

### URLs Handled by This Block

| URL                                                         | Page                | Status   |
| ----------------------------------------------------------- | ------------------- | -------- |
| `/[lang]/s/[subdomain]/(platform)/attendance`               | Mark Attendance     | ✅ Ready |
| `/[lang]/s/[subdomain]/(platform)/attendance/history`       | Attendance History  | ✅ Ready |
| `/[lang]/s/[subdomain]/(platform)/attendance/reports`       | Reports & Export    | ✅ Ready |
| `/[lang]/s/[subdomain]/(platform)/attendance/analytics`     | Analytics Dashboard | ✅ Ready |
| `/[lang]/s/[subdomain]/(platform)/attendance/qr-code`       | QR Code Attendance  | ✅ Ready |
| `/[lang]/s/[subdomain]/(platform)/attendance/geofence`      | Geofence Attendance | ✅ Ready |
| `/[lang]/s/[subdomain]/(platform)/attendance/barcode`       | Barcode Scanner     | ✅ Ready |
| `/[lang]/s/[subdomain]/(platform)/attendance/interventions` | Intervention Mgmt   | ✅ Ready |
| `/[lang]/s/[subdomain]/(platform)/attendance/excuses`       | Excuse Management   | ✅ Ready |
| `/[lang]/s/[subdomain]/(platform)/attendance/bulk-upload`   | Bulk Upload         | ✅ Ready |
| `/[lang]/s/[subdomain]/(platform)/attendance/early-warning` | Early Warning       | ✅ Ready |

---

## Attendance Flow Diagrams

### QR Code Attendance Flow

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         QR CODE ATTENDANCE FLOW                          │
└──────────────────────────────────────────────────────────────────────────┘

  TEACHER SIDE                                  STUDENT SIDE
  ════════════                                  ════════════

  ┌─────────────┐
  │   Teacher   │
  │ opens class │
  └──────┬──────┘
         │
         ▼
  ┌─────────────┐
  │ Click "QR   │
  │  Code" tab  │
  └──────┬──────┘
         │
         ▼
  ┌─────────────┐     Creates Session
  │  Generate   │─────────────────────────┐
  │  QR Code    │                         │
  └──────┬──────┘                         │
         │                                ▼
         │                         ┌───────────┐
         │                         │ QRSession │
         │                         │ in DB     │
         │                         │ (30m TTL) │
         │                         └───────────┘
         ▼
  ┌─────────────┐                              ┌─────────────┐
  │  Display QR │                              │   Student   │
  │  on screen  │◄─────── Scans ──────────────│  opens PWA  │
  └──────┬──────┘                              └──────┬──────┘
         │                                            │
         │                                            ▼
         │                                     ┌─────────────┐
         │                                     │ Open Camera │
         │                                     │  & Scan QR  │
         │                                     └──────┬──────┘
         │                                            │
         │                          ┌─────────────────┘
         │                          │
         │                          ▼
         │                   ┌─────────────┐
         │                   │  Validate   │
         │                   │  QR Code    │
         │                   └──────┬──────┘
         │                          │
         │                          ▼
         │                   ┌─────────────┐     ┌────────────┐
         │                   │  Valid &    │ Yes │  Mark as   │
         │                   │  Not Expired├────►│  PRESENT   │
         │                   └──────┬──────┘     └─────┬──────┘
         │                          │ No               │
         │                          ▼                  │
         │                   ┌─────────────┐           │
         │                   │   Show      │           │
         │                   │   Error     │           │
         │                   └─────────────┘           │
         │                                             │
         ▼                                             ▼
  ┌─────────────┐                              ┌─────────────┐
  │ Auto-refresh│                              │  ✓ Success  │
  │  every 30s  │                              │  + Haptic   │
  └─────────────┘                              └─────────────┘
```

### Geofence Attendance Flow

```
┌──────────────────────────────────────────────────────────────────────────┐
│                        GEOFENCE ATTENDANCE FLOW                          │
└──────────────────────────────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────────────────────────┐
  │                        SCHOOL ADMIN SETUP                           │
  │  ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐             │
  │  │ Define  │   │  Set    │   │ Choose  │   │ Activate│             │
  │  │ Zones   │──►│ Radius  │──►│  Type   │──►│  Zone   │             │
  │  │ on Map  │   │ (meters)│   │(School/ │   │         │             │
  │  └─────────┘   └─────────┘   │Library) │   └─────────┘             │
  │                              └─────────┘                            │
  └─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
  ┌─────────────────────────────────────────────────────────────────────┐
  │                         STUDENT MOBILE APP                          │
  │                                                                     │
  │  ┌──────────┐                                                       │
  │  │  Open    │                                                       │
  │  │   PWA    │                                                       │
  │  └────┬─────┘                                                       │
  │       │                                                             │
  │       ▼                                                             │
  │  ┌──────────┐    ┌──────────┐                                       │
  │  │  Start   │───►│ Browser  │                                       │
  │  │ Tracking │    │ Location │                                       │
  │  └──────────┘    │ API      │                                       │
  │                  └────┬─────┘                                       │
  │                       │                                             │
  │                       ▼  (Every 30 seconds)                         │
  │                  ┌──────────┐                                       │
  │                  │  Submit  │                                       │
  │                  │ Location │                                       │
  │                  └────┬─────┘                                       │
  └───────────────────────┼─────────────────────────────────────────────┘
                          │
                          ▼
  ┌─────────────────────────────────────────────────────────────────────┐
  │                          SERVER PROCESSING                          │
  │                                                                     │
  │  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐      │
  │  │ Receive  │───►│ Haversine│───►│ Check if │───►│ Process  │      │
  │  │ Location │    │ Distance │    │  Inside  │    │  Event   │      │
  │  │   API    │    │ Formula  │    │ Geofence │    │          │      │
  │  └──────────┘    └──────────┘    └────┬─────┘    └────┬─────┘      │
  │                                       │               │             │
  │                                       ▼               ▼             │
  │                              ┌────────────────────────────────┐     │
  │                              │       Event Type Detection     │     │
  │                              ├────────────────────────────────┤     │
  │                              │ ENTER - First time inside zone │     │
  │                              │ EXIT  - Left the zone          │     │
  │                              │ INSIDE - Already in zone       │     │
  │                              └───────────────┬────────────────┘     │
  │                                              │                      │
  │                                              ▼                      │
  │                              ┌───────────────────────────────┐      │
  │                              │  Auto-Attendance Trigger      │      │
  │                              │  ─────────────────────────────│      │
  │                              │  IF event = ENTER             │      │
  │                              │  AND zone = SCHOOL_GROUNDS    │      │
  │                              │  AND time between 6-10 AM     │      │
  │                              │  THEN mark PRESENT            │      │
  │                              └───────────────────────────────┘      │
  └─────────────────────────────────────────────────────────────────────┘
```

### Excuse Management Flow

```
┌──────────────────────────────────────────────────────────────────────────┐
│                        EXCUSE MANAGEMENT FLOW                            │
└──────────────────────────────────────────────────────────────────────────┘

  PARENT/GUARDIAN                    SCHOOL                 ADMIN/TEACHER
  ═══════════════                    ══════                 ═════════════

  ┌─────────────┐
  │ Child marked│
  │   absent    │
  └──────┬──────┘
         │
         ▼
  ┌─────────────┐      Submit         ┌──────────────┐
  │ Open parent │─────────────────────►│ Excuse saved │
  │   portal    │      excuse         │ status=PENDING│
  └──────┬──────┘                     └──────┬───────┘
         │                                   │
         │                                   ▼
         │                            ┌──────────────┐
         │                            │ Notification │
         │                            │ sent to admin│
         │                            └──────┬───────┘
         │                                   │
         │                                   ▼
         │                                          ┌─────────────┐
         │                                          │   Review    │
         │                                          │   excuse    │
         │                                          └──────┬──────┘
         │                                                 │
         │                            ┌────────────────────┴────────────────┐
         │                            │                                     │
         │                            ▼                                     ▼
         │                     ┌─────────────┐                       ┌─────────────┐
         │                     │  APPROVED   │                       │  REJECTED   │
         │                     │ status=     │                       │ status=     │
         │                     │ APPROVED    │                       │ REJECTED    │
         │                     └──────┬──────┘                       └──────┬──────┘
         │                            │                                     │
         ▼                            ▼                                     ▼
  ┌─────────────┐              ┌─────────────┐                       ┌─────────────┐
  │ Notification│◄─────────────│ Attendance  │                       │ Notification│
  │   received  │              │ marked      │                       │ with reason │
  └─────────────┘              │ as EXCUSED  │                       └─────────────┘
                               └─────────────┘

  EXCUSE REASONS:
  ├── MEDICAL (requires documentation)
  ├── FAMILY_EMERGENCY
  ├── RELIGIOUS
  ├── SCHOOL_ACTIVITY
  ├── TRANSPORTATION
  ├── WEATHER
  └── OTHER
```

### Intervention Workflow

```
┌──────────────────────────────────────────────────────────────────────────┐
│                        INTERVENTION WORKFLOW                             │
└──────────────────────────────────────────────────────────────────────────┘

  EARLY WARNING                COUNSELOR/STAFF              ADMINISTRATION
  ═════════════                ═══════════════              ══════════════

  ┌─────────────────┐
  │ Student flagged │
  │ as AT_RISK      │
  │ (< 80% attend)  │
  └────────┬────────┘
           │
           ▼
  ┌─────────────────┐      Assign      ┌─────────────────┐
  │ Create          │─────────────────►│ Intervention    │
  │ Intervention    │                  │ SCHEDULED       │
  │ Priority: 1-4   │                  └────────┬────────┘
  └─────────────────┘                           │
                                                ▼
                                       ┌─────────────────┐
                                       │ Execute action: │
                                       │ • Phone call    │
                                       │ • Email         │
                                       │ • Meeting       │
                                       │ • Home visit    │
                                       └────────┬────────┘
                                                │
                          ┌─────────────────────┴─────────────────────┐
                          │                                           │
                          ▼                                           ▼
                  ┌─────────────────┐                         ┌─────────────────┐
                  │   COMPLETED     │                         │   No Response   │
                  │   (Successful)  │                         │   or Ongoing    │
                  └────────┬────────┘                         └────────┬────────┘
                          │                                            │
                          ▼                                            ▼
                  ┌─────────────────┐                         ┌─────────────────┐
                  │ Update outcome  │                         │   ESCALATE      │
                  │ Log results     │                         │ to higher level │
                  │ Set follow-up   │                         └────────┬────────┘
                  └─────────────────┘                                  │
                                                                       ▼
                                                                               ┌─────────────────┐
                                                                               │ Administrator   │
                                                                               │ meeting or      │
                                                                               │ truancy referral│
                                                                               └─────────────────┘

  INTERVENTION TYPES (14):
  ├── PARENT_PHONE_CALL      ├── COUNSELOR_REFERRAL       ├── ACADEMIC_SUPPORT
  ├── PARENT_EMAIL           ├── SOCIAL_WORKER_REFERRAL   ├── MENTORSHIP_ASSIGNMENT
  ├── PARENT_MEETING         ├── ADMINISTRATOR_MEETING    ├── INCENTIVE_PROGRAM
  ├── HOME_VISIT             ├── ATTENDANCE_CONTRACT      └── OTHER
  └── TRUANCY_REFERRAL       └── COMMUNITY_RESOURCE

  PRIORITY LEVELS:
  1 = Low (monitoring)
  2 = Medium (intervention needed)
  3 = High (urgent action)
  4 = Critical (immediate escalation)
```

### PWA Mobile App Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                     PWA MOBILE APP ARCHITECTURE                          │
└──────────────────────────────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────────────────────────┐
  │                         INSTALLATION FLOW                           │
  │                                                                     │
  │  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐      │
  │  │  Open    │───►│ Browser  │───►│  "Add to │───►│  Opens   │      │
  │  │ ed.     │    │ prompts  │    │   Home   │    │standalone│      │
  │  │databayt │    │ install  │    │  Screen" │    │   mode   │      │
  │  │  .org   │    │          │    │          │    │          │      │
  │  └──────────┘    └──────────┘    └──────────┘    └──────────┘      │
  └─────────────────────────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────────────────────────┐
  │                         PWA CAPABILITIES                            │
  │                                                                     │
  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐     │
  │  │ Installable     │  │ Geolocation     │  │ Camera          │     │
  │  │ ───────────────│  │ ───────────────│  │ ───────────────│     │
  │  │ Home screen    │  │ Background      │  │ QR Code        │     │
  │  │ icon & launch  │  │ location track  │  │ scanning       │     │
  │  └─────────────────┘  └─────────────────┘  └─────────────────┘     │
  │                                                                     │
  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐     │
  │  │ Push Notify     │  │ Offline         │  │ Vibration       │     │
  │  │ ───────────────│  │ ───────────────│  │ ───────────────│     │
  │  │ Attendance     │  │ IndexedDB queue │  │ Haptic feedback │     │
  │  │ reminders      │  │ syncs on online │  │ on scan         │     │
  │  └─────────────────┘  └─────────────────┘  └─────────────────┘     │
  └─────────────────────────────────────────────────────────────────────┘
```

---

## Current Implementation Status

**Production-Ready with Advanced Features (Phase 5 Complete)**

### Phase 1 - Core (Complete)

- ✅ Daily attendance marking (present/absent/late/excused/sick/holiday)
- ✅ Class roster view with attendance status
- ✅ Bulk marking for entire class
- ✅ Attendance history with date filtering
- ✅ CSV export with date range filters
- ✅ Multi-tenant isolation (schoolId scoping)
- ✅ Upsert logic (update existing or create new)
- ✅ Class selection for teachers

### Phase 2 - Optimizations (Complete)

- ✅ Error Boundaries - Graceful error handling with recovery options
- ✅ Loading Skeletons - Professional loading states for better UX
- ✅ Empty States - Helpful messages when no data available
- ✅ Attendance Percentage Calculation - Real-time percentage with streak tracking
- ✅ At-Risk Student Detection - Automatic identification of students below threshold
- ✅ Class Attendance Statistics - Real-time class-level metrics
- ✅ Perfect Attendance Tracking - Identify and reward consistent attendance
- ✅ Attendance Trends Analysis - 30-day trend visualization
- ✅ Enhanced Database Schema - Support for QR, barcode, and advanced tracking methods
- ✅ Performance Optimizations - Indexed queries, proper TypeScript types
- ✅ Keyboard Shortcuts - P (present), A (absent), L (late), Ctrl+S (save)

### Phase 3 - Advanced Features (Complete)

- ✅ QR Code Infrastructure - Session management with 30-minute expiration
- ✅ Barcode Infrastructure - Student ID card scanning support
- ✅ Student Identifier System - Multiple identification methods per student
- ✅ Attendance Method Tracking - Track how attendance was marked
- ✅ Check-in/Check-out Times - Precise time tracking for each student
- ✅ Location Support - Optional location data for geofence attendance
- ✅ Confidence Scoring - Accuracy metrics for biometric methods

### Phase 4 - Mobile & Automation (Complete)

- ✅ QR Code Attendance - Full scanner and generator with server-side session management
- ✅ Mobile-Optimized QR Scanner - Fullscreen mode, haptic feedback, audio confirmation
- ✅ Geofence Attendance - Haversine-based location tracking (no PostGIS required)
- ✅ Multi-Zone Management - Create/edit/delete geofences with visual management UI
- ✅ Auto-Attendance Trigger - SCHOOL_GROUNDS zones auto-mark attendance (6-10 AM)
- ✅ Bulk Action Buttons - Mark All Present/Absent/Late with one click
- ✅ PWA Manifest - Installable app with home screen shortcuts
- ✅ Smart Class Selection - Auto-selects current period class from timetable
- ✅ Period Selector Integration - Shows current period indicator
- ✅ Offline Location Queue - IndexedDB queue for offline location tracking

### Phase 5 - Excuse & Intervention System (Complete)

- ✅ Excuse Management - Parent/guardian excuse submission
- ✅ Excuse Review Workflow - Admin approval/rejection with notes
- ✅ Excuse Reasons - 7 categories (Medical, Family Emergency, Religious, etc.)
- ✅ Attachment Support - Medical notes and documentation upload
- ✅ Intervention Tracking - 14 intervention types for chronic absenteeism
- ✅ Intervention Status Flow - SCHEDULED → IN_PROGRESS → COMPLETED/ESCALATED
- ✅ Priority Levels - 4 levels (Low, Medium, High, Critical)
- ✅ Early Warning System - Automatic flagging of at-risk students
- ✅ Follow-up Scheduling - Track follow-up dates and outcomes
- ✅ Bulk Upload - CSV import for historical attendance data
- ✅ Period-by-Period Tracking - Secondary school period-specific attendance

### Phase 6 - Analytics Dashboard (Complete)

- ✅ Analytics Dashboard UI - 8 chart components with 7 tabs
- ✅ Attendance Trends Chart - ComposedChart (bar + line)
- ✅ Method Usage Pie Chart - Distribution of tracking methods
- ✅ Day-wise Pattern Chart - Radar chart for weekly patterns
- ✅ Time Distribution Chart - Area chart for check-in times
- ✅ Class Comparison Chart - Horizontal bar chart
- ✅ Calendar View - Monthly attendance heatmap
- ✅ At-Risk Students Table - Full implementation with alerts

### Planned

- ⏸️ Parent notifications for absences (email/SMS)
- ⏸️ Biometric attendance (fingerprint/face)
- ⏸️ Automated compliance reports (PDF)
- ⏸️ Attendance policy enforcement

---

## Server Actions (48+ Implemented)

### Core Attendance

| Action                   | Description                           |
| ------------------------ | ------------------------------------- |
| `markAttendance`         | Mark attendance for multiple students |
| `markSingleAttendance`   | Mark single student attendance        |
| `getAttendanceList`      | Get class roster with attendance      |
| `getClassesForSelection` | Get classes dropdown data             |
| `getAttendanceStats`     | Get attendance statistics             |
| `getRecentAttendance`    | Get recent attendance records         |

### Analytics & Reports

| Action                    | Description                       |
| ------------------------- | --------------------------------- |
| `getAttendanceTrends`     | Get attendance trends over time   |
| `getMethodUsageStats`     | Get stats by attendance method    |
| `getDayWisePatterns`      | Get day-of-week absence patterns  |
| `getClassComparisonStats` | Compare attendance across classes |
| `getStudentsAtRisk`       | Get students below threshold      |
| `getAttendanceReport`     | Generate detailed report          |
| `getAttendanceReportCsv`  | Export attendance to CSV          |
| `getTodaysDashboard`      | Get today's attendance summary    |
| `getTeacherClassesToday`  | Get teacher's classes for today   |

### QR Code

| Action                | Description                |
| --------------------- | -------------------------- |
| `generateQRSession`   | Create new QR code session |
| `processQRScan`       | Process student QR scan    |
| `getActiveQRSessions` | Get active QR sessions     |

### Barcode & Identifiers

| Action                    | Description                    |
| ------------------------- | ------------------------------ |
| `addStudentIdentifier`    | Add barcode/RFID identifier    |
| `getStudentIdentifiers`   | Get student's identifiers      |
| `findStudentByIdentifier` | Lookup student by barcode/RFID |

### Bulk Operations

| Action                 | Description                    |
| ---------------------- | ------------------------------ |
| `bulkUploadAttendance` | Import attendance from CSV     |
| `getRecentBulkUploads` | Get recent bulk upload history |
| `quickMarkAllPresent`  | Mark all students present      |
| `checkOutStudent`      | Check out single student       |
| `bulkCheckOut`         | Check out multiple students    |

### Early Warning & At-Risk

| Action                          | Description                    |
| ------------------------------- | ------------------------------ |
| `getStudentsByRiskLevel`        | Get students by risk category  |
| `getStudentEarlyWarningDetails` | Detailed at-risk student info  |
| `getFollowUpStudents`           | Get students needing follow-up |

### Excuses

| Action                 | Description                   |
| ---------------------- | ----------------------------- |
| `submitExcuse`         | Parent submits absence excuse |
| `reviewExcuse`         | Admin approves/rejects excuse |
| `getExcusesForStudent` | Get student's excuse history  |
| `getPendingExcuses`    | Get all pending excuses       |
| `getExcuseById`        | Get single excuse details     |
| `getUnexcusedAbsences` | Get absences without excuses  |

### Interventions

| Action                     | Description                        |
| -------------------------- | ---------------------------------- |
| `createIntervention`       | Create new intervention            |
| `updateIntervention`       | Update intervention status         |
| `escalateIntervention`     | Escalate to higher level           |
| `getStudentInterventions`  | Get student's intervention history |
| `getActiveInterventions`   | Get all active interventions       |
| `getAllInterventions`      | Get all interventions with filters |
| `getInterventionStats`     | Get intervention statistics        |
| `getInterventionAssignees` | Get available assignees            |

### Period Tracking

| Action                         | Description                       |
| ------------------------------ | --------------------------------- |
| `getPeriodsForClass`           | Get periods for a class           |
| `getCurrentPeriod`             | Get current period from timetable |
| `markPeriodAttendance`         | Mark period-specific attendance   |
| `getPeriodAttendanceAnalytics` | Period-level analytics            |
| `getStudentDayAttendance`      | Get all periods for student's day |

---

## Database Schema

### Models (17 total)

The attendance system uses 17 interconnected models:

```prisma
// Enums (7)
enum AttendanceStatus { PRESENT, ABSENT, LATE, EXCUSED, SICK, HOLIDAY }
enum AttendanceMethod { MANUAL, GEOFENCE, QR_CODE, BARCODE, RFID, FINGERPRINT, FACE_RECOGNITION, NFC, BLUETOOTH, BULK_UPLOAD }
enum IdentifierType { BARCODE, QR_CODE, RFID_CARD, NFC_TAG, FINGERPRINT, FACE_ID, BLUETOOTH_MAC, STUDENT_ID, MOBILE_DEVICE }
enum ExcuseStatus { PENDING, APPROVED, REJECTED }
enum ExcuseReason { MEDICAL, FAMILY_EMERGENCY, RELIGIOUS, SCHOOL_ACTIVITY, TRANSPORTATION, WEATHER, OTHER }
enum InterventionType { PARENT_PHONE_CALL, PARENT_EMAIL, PARENT_MEETING, HOME_VISIT, COUNSELOR_REFERRAL, SOCIAL_WORKER_REFERRAL, ADMINISTRATOR_MEETING, ATTENDANCE_CONTRACT, TRUANCY_REFERRAL, COMMUNITY_RESOURCE, ACADEMIC_SUPPORT, MENTORSHIP_ASSIGNMENT, INCENTIVE_PROGRAM, OTHER }
enum InterventionStatus { SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED, ESCALATED }

// Models (5)
model Attendance { ... }           // Core attendance records
model StudentIdentifier { ... }    // Barcode/RFID/biometric IDs
model QRCodeSession { ... }        // QR code sessions
model AttendanceExcuse { ... }     // Parent excuse submissions
model AttendanceIntervention { ... } // Intervention tracking
```

### Key Features

- **Multi-tenant isolation**: All models include `schoolId` with indexes
- **Unique constraints**: Prevent duplicate attendance per day/period
- **Soft relationships**: Excuse linked 1:1 with Attendance
- **Flexible periods**: Supports both daily and period-by-period tracking
- **Audit fields**: `createdAt`, `updatedAt`, `markedBy`, `reviewedBy`

---

## Security Considerations

### Multi-Tenant Safety

- ✅ All queries scoped by `schoolId` from session
- ✅ Unique constraints include `schoolId`
- ✅ No cross-tenant data leakage possible
- ✅ Foreign keys cascade on school deletion

### Authentication & Authorization

- ✅ Server actions verify session before operations
- ✅ Role-based access (Admin, Teacher, Parent, Student)
- ✅ Teachers can only mark their assigned classes
- ✅ Parents can only view/submit for their children
- ✅ Students can only view their own attendance

### Data Validation

- ✅ Zod schemas validate all inputs (client + server)
- ✅ Date range limits prevent excessive queries
- ✅ Status enums enforced by Prisma
- ✅ GPS coordinate validation (lat ±90, lon ±180)

### QR Code Security

- ✅ Sessions expire after 30 minutes
- ✅ Unique codes prevent replay attacks
- ✅ `scannedBy` array prevents duplicate scans
- ✅ `maxScans` limit optional per session

---

## Internationalization

### Supported Languages

- Arabic (RTL, default)
- English (LTR)

### Translated Elements

- ✅ Status labels (PRESENT → "حاضر / Present")
- ✅ Method labels (QR_CODE → "رمز QR / QR Code")
- ✅ Excuse reasons (MEDICAL → "طبي / Medical")
- ✅ Intervention types (14 types translated)
- ✅ Form labels and placeholders
- ✅ Error messages
- ✅ Success/failure toasts

### RTL Support

- ✅ Tables flip for RTL layout
- ✅ Form elements align correctly
- ✅ Calendar/date pickers support Arabic locale
- ✅ Charts adapt to reading direction

---

## Time Savings Analysis

| Manual Method            | Time Required | Automated Method  | Time Required | Savings |
| ------------------------ | ------------- | ----------------- | ------------- | ------- |
| Roll call (30 students)  | 5 minutes     | QR Code scan      | 30 seconds    | 90%     |
| Daily attendance marking | 5 minutes     | Geofence auto     | 0 (automatic) | 100%    |
| Finding absent students  | 2 minutes     | Dashboard instant | Instant       | 100%    |
| Compiling weekly report  | 30 minutes    | CSV export        | 1 minute      | 97%     |
| Processing excuses       | 15 minutes    | Digital workflow  | 2 minutes     | 87%     |
| Tracking interventions   | 30 minutes    | Automated system  | 5 minutes     | 83%     |

---

## Admin Workflows

### 1. Mark Daily Attendance for a Class

**Prerequisites:** Students enrolled in classes, current academic term active

1. Navigate to `/attendance`
2. Select date (defaults to today)
3. Select class from dropdown
4. System loads class roster with all enrolled students
5. For each student, mark status (Present/Absent/Late/Excused/Sick/Holiday)
6. Click "Save Attendance"
7. System upserts attendance records
8. Success toast confirms "Attendance marked for X students"

### 2. Review Pending Excuses

1. Navigate to `/attendance/excuses`
2. View list of pending excuses
3. Click excuse to review details
4. View attachments (medical notes, etc.)
5. Approve or reject with notes
6. System updates attendance status if approved

### 3. Manage Interventions

1. Navigate to `/attendance/interventions`
2. View active interventions
3. Update status (In Progress, Completed)
4. Add outcome notes
5. Schedule follow-up if needed
6. Escalate to higher level if required

### 4. Generate Reports

1. Navigate to `/attendance/reports`
2. Select filters (class, date range, status)
3. Preview report
4. Export to CSV or PDF
5. Download for compliance reporting

---

## Dependencies

- React Hook Form for attendance marking forms
- Zod for validation schemas
- TanStack Table for attendance history display
- shadcn/ui components (Select, DatePicker, RadioGroup)
- Next.js server actions for backend operations
- Prisma for database access
- Recharts for analytics visualizations

---

## Technology Stack

See [Platform README](../README.md) for complete stack details:

- **Next.js 15.4+** - App Router with Server Components
- **React 19+** - Server Actions, new hooks
- **TypeScript 5.x** - Strict mode
- **Prisma ORM 6.14+** - PostgreSQL with Neon
- **shadcn/ui** - Accessible components
- **Tailwind CSS 4** - Utility-first styling

---

## Future Enhancements

See `ISSUE.md` for detailed production readiness tracker and remaining items:

- Parent notification system (email/SMS)
- Biometric attendance (fingerprint/face recognition)
- Automated PDF compliance reports
- Attendance policy enforcement rules
- Real-time WebSocket updates

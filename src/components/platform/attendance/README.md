## Attendance — Daily Attendance Tracking

**Admin Control Center for Student Attendance Management**

The Attendance feature empowers school administrators and teachers to track student presence, manage absences, generate reports, and ensure compliance with attendance regulations through comprehensive daily and period-by-period tracking.

### URLs Handled by This Block

| URL                                                     | Page                | Status         |
| ------------------------------------------------------- | ------------------- | -------------- |
| `/[lang]/s/[subdomain]/(platform)/attendance`           | Mark Attendance     | ✅ Ready       |
| `/[lang]/s/[subdomain]/(platform)/attendance/history`   | Attendance History  | ✅ Ready       |
| `/[lang]/s/[subdomain]/(platform)/attendance/reports`   | Reports & Export    | ✅ Ready       |
| `/[lang]/s/[subdomain]/(platform)/attendance/analytics` | Analytics Dashboard | 🚧 In Progress |
| `/[lang]/s/[subdomain]/(platform)/attendance/qr-code`   | QR Code Attendance  | ✅ Ready       |
| `/[lang]/s/[subdomain]/(platform)/attendance/geofence`  | Geofence Attendance | ✅ Ready       |

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
         │                         │ (60s TTL) │
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
  │  every 60s  │                              │  + Haptic   │
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
  │  │ 📱 Installable  │  │ 📍 Geolocation  │  │ 📷 Camera       │     │
  │  │ ───────────────│  │ ───────────────│  │ ───────────────│     │
  │  │ Home screen    │  │ Background      │  │ QR Code        │     │
  │  │ icon & launch  │  │ location track  │  │ scanning       │     │
  │  └─────────────────┘  └─────────────────┘  └─────────────────┘     │
  │                                                                     │
  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐     │
  │  │ 🔔 Push Notify  │  │ 📴 Offline      │  │ 📳 Vibration    │     │
  │  │ ───────────────│  │ ───────────────│  │ ───────────────│     │
  │  │ Attendance     │  │ IndexedDB queue │  │ Haptic feedback │     │
  │  │ reminders      │  │ syncs on online │  │ on scan         │     │
  │  └─────────────────┘  └─────────────────┘  └─────────────────┘     │
  └─────────────────────────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────────────────────────┐
  │                      OFFLINE SYNC MECHANISM                         │
  │                                                                     │
  │       Online                              Offline                   │
  │    ┌──────────┐                        ┌──────────┐                │
  │    │ Location │                        │ Location │                │
  │    │ Submit   │                        │ Submit   │                │
  │    └────┬─────┘                        └────┬─────┘                │
  │         │                                   │                       │
  │         ▼                                   ▼                       │
  │    ┌──────────┐                        ┌──────────┐                │
  │    │ POST to  │                        │ Queue in │                │
  │    │  Server  │                        │ IndexedDB│                │
  │    └────┬─────┘                        └────┬─────┘                │
  │         │                                   │                       │
  │         ▼                                   │  (When back online)   │
  │    ┌──────────┐                             │                       │
  │    │ ✓ Saved  │◄────────────────────────────┘                       │
  │    │ Instantly│    Batch sync                                       │
  │    └──────────┘                                                     │
  └─────────────────────────────────────────────────────────────────────┘
```

---

## Mobile App (PWA) Usage Guide

### For Students

**Installing the App:**

1. Open `https://[school].databayt.org` on your phone
2. Browser will prompt "Add to Home Screen"
3. Tap "Add" to install
4. App appears on home screen like a native app

**QR Code Attendance:**

1. Open the PWA app
2. Navigate to Attendance → QR Scanner
3. Tap "Start Camera" (grant permission if asked)
4. Point camera at teacher's QR code
5. Wait for success vibration and green checkmark
6. Attendance marked automatically

**Geofence Attendance:**

1. Open Attendance → Geofence Tracking
2. Tap "Start Tracking" (grant location permission)
3. Keep the app running in background
4. When you enter school grounds between 6-10 AM, attendance is auto-marked
5. You can stop tracking when you leave school

### For Teachers

**Generating QR Codes:**

1. Open Attendance page
2. Select your class
3. Click "QR Code" tab
4. QR code appears on screen (auto-refreshes every 60s)
5. Students scan to mark attendance

**Managing Geofences:**

1. Open Attendance → Geofence
2. Click "Create Geofence"
3. Set center point (click on map or enter coordinates)
4. Set radius in meters
5. Choose type (School Grounds, Classroom, Library, etc.)
6. Activate the geofence
7. Students entering will trigger auto-attendance

### Manifest Configuration

The PWA is configured in `src/app/manifest.ts`:

```typescript
{
  name: "Hogwarts School Management",
  short_name: "Hogwarts",
  start_url: "/",
  display: "standalone",
  theme_color: "#3b82f6",
  shortcuts: [
    { name: "Mark Attendance", url: "/attendance" },
    { name: "Scan QR Code", url: "/attendance/qr-code" }
  ]
}
```

---

## Time Savings Analysis

| Manual Method            | Time Required | Automated Method  | Time Required | Savings |
| ------------------------ | ------------- | ----------------- | ------------- | ------- |
| Roll call (30 students)  | 5 minutes     | QR Code scan      | 30 seconds    | 90%     |
| Daily attendance marking | 5 minutes     | Geofence auto     | 0 (automatic) | 100%    |
| Finding absent students  | 2 minutes     | Dashboard instant | Instant       | 100%    |
| Compiling weekly report  | 30 minutes    | CSV export        | 1 minute      | 97%     |

### What Admins Can Do

**Core Capabilities:**

- ✅ Mark daily attendance for all classes
- 📊 View attendance reports and statistics
- 🔍 Search attendance records by student, class, date range
- 📅 Period-by-period attendance tracking
- 📁 Export attendance data to CSV for compliance
- 📈 Track attendance trends and patterns
- 🚨 Identify students with low attendance
- 📧 Generate absence reports for parents
- 🔄 Bulk attendance marking for entire class

### What Teachers Can Do

- ✅ Mark attendance for their assigned classes
- ✅ View class attendance roster for the day
- ✅ Update attendance marks (present/absent/late)
- ✅ View attendance history for their classes
- ✅ Export class attendance reports
- ✅ Identify students with frequent absences
- ❌ Cannot view other teachers' class attendance

### What Students Can View

- ✅ View their own attendance record
- ✅ See attendance percentage
- ✅ View absence history
- ❌ Cannot view other students' attendance

### What Parents Can View

- ✅ View their child's attendance record
- ✅ See daily attendance status
- ✅ View absence summaries
- ✅ Receive absence notifications
- ❌ Cannot view other students

### Current Implementation Status

**Production-Ready with Advanced Features ✅**

**Completed (Phase 1 - Core):**

- ✅ Daily attendance marking (present/absent/late/excused/sick/holiday)
- ✅ Class roster view with attendance status
- ✅ Bulk marking for entire class
- ✅ Attendance history with date filtering
- ✅ CSV export with date range filters
- ✅ Multi-tenant isolation (schoolId scoping)
- ✅ Upsert logic (update existing or create new)
- ✅ Class selection for teachers

**Completed (Phase 2 - Optimizations):**

- ✅ **Error Boundaries** - Graceful error handling with recovery options
- ✅ **Loading Skeletons** - Professional loading states for better UX
- ✅ **Empty States** - Helpful messages when no data available
- ✅ **Attendance Percentage Calculation** - Real-time percentage with streak tracking
- ✅ **At-Risk Student Detection** - Automatic identification of students below threshold
- ✅ **Class Attendance Statistics** - Real-time class-level metrics
- ✅ **Perfect Attendance Tracking** - Identify and reward consistent attendance
- ✅ **Attendance Trends Analysis** - 30-day trend visualization
- ✅ **Enhanced Database Schema** - Support for QR, barcode, and advanced tracking methods
- ✅ **Performance Optimizations** - Indexed queries, proper TypeScript types
- ✅ **Keyboard Shortcuts** - P (present), A (absent), L (late), Ctrl+S (save)

**Completed (Phase 3 - Advanced Features):**

- ✅ **QR Code Infrastructure** - Session management with expiration
- ✅ **Barcode Infrastructure** - Student ID card scanning support
- ✅ **Student Identifier System** - Multiple identification methods per student
- ✅ **Attendance Method Tracking** - Track how attendance was marked (manual/QR/barcode)
- ✅ **Check-in/Check-out Times** - Precise time tracking for each student
- ✅ **Location Support** - Optional location data for geofence attendance
- ✅ **Confidence Scoring** - Accuracy metrics for biometric methods

**Completed (Phase 4 - Mobile & Automation):**

- ✅ **QR Code Attendance** - Full scanner and generator with server-side session management
- ✅ **Mobile-Optimized QR Scanner** - Fullscreen mode, haptic feedback, audio confirmation
- ✅ **Geofence Attendance** - Haversine-based location tracking (no PostGIS required)
- ✅ **Multi-Zone Management** - Create/edit/delete geofences with visual management UI
- ✅ **Auto-Attendance Trigger** - SCHOOL_GROUNDS zones auto-mark attendance (6-10 AM)
- ✅ **Bulk Action Buttons** - Mark All Present/Absent/Late with one click
- ✅ **PWA Manifest** - Installable app with home screen shortcuts
- ✅ **Smart Class Selection** - Auto-selects current period class from timetable
- ✅ **Period Selector Integration** - Shows current period indicator
- ✅ **Offline Location Queue** - IndexedDB queue for offline location tracking

**In Progress:**

- 🚧 Analytics Dashboard - Real-time charts and graphs

**Planned:**

- ⏸️ Parent notifications for absences
- ⏸️ Biometric attendance (fingerprint/face)
- ⏸️ Automated compliance reports
- ⏸️ Attendance policy enforcement

---

## Admin Workflows

### 1. Mark Daily Attendance for a Class

**Prerequisites:** Students enrolled in classes, current academic term active

1. Navigate to `/attendance`
2. Select date (defaults to today)
3. Select class from dropdown
4. System loads class roster with all enrolled students
5. For each student, mark status:
   - **Present** ✅ (default)
   - **Absent** ❌
   - **Late** ⏰
6. Click "Save Attendance"
7. System upserts attendance records
8. Success toast confirms "Attendance marked for X students"
9. Data saved to database with schoolId, classId, studentId, date, status

### 2. Bulk Mark Entire Class

**Quick marking for routine attendance:**

**Mark All Present:**

1. Open attendance marking page
2. Select class and date
3. Click "Mark All Present" button
4. System sets all students to PRESENT status
5. Click "Save"
6. All students marked as present at once

**Mark All Absent (Special Cases):**

- Use case: Field trip where entire class is absent from school
- Use case: Class cancelled, all marked absent
- Follow same flow with "Mark All Absent" button

### 3. Update Attendance After Initial Marking

**Scenario:** Student arrives late or was marked incorrectly

1. Navigate to attendance page
2. Select the same date and class
3. System loads existing attendance marks
4. Update student status (e.g., change Absent → Late)
5. Click "Save Attendance"
6. System upserts (updates existing record)
7. Updated status reflected in reports

### 4. View Attendance History

**Class Attendance History:**

1. Navigate to class detail page
2. Click "Attendance" tab
3. View attendance records by date:
   - Date picker or date range selector
   - Calendar view showing attendance per day
   - Color coding: Green (present), Red (absent), Yellow (late)
4. Click specific date to see detailed roster

**Student Attendance History:**

1. Navigate to student detail page
2. Click "Attendance" tab
3. View attendance timeline:
   - List view: Date, Class, Status
   - Calendar view: Month overview
   - Statistics: X days present, Y days absent, Z days late
4. Calculate attendance percentage

### 5. Search and Filter Attendance Records

**By Student:**

1. Navigate to `/attendance/reports`
2. Select "Student" filter
3. Choose student from dropdown
4. Select date range (e.g., last 30 days)
5. View student's attendance across all classes
6. Export to CSV

**By Class:**

1. Select "Class" filter
2. Choose class from dropdown
3. Select date range
4. View all students' attendance for that class
5. See summary: X% attendance rate

**By Status:**

1. Select "Status" filter → Choose "Absent" or "Late"
2. Select date range
3. View all absence or tardy records
4. Identify patterns (e.g., Mondays have high absences)

**By Date Range:**

1. Set start and end dates
2. Optionally combine with class/student filters
3. Generate comprehensive report
4. Export results

### 6. Export Attendance Reports (CSV)

**For Compliance and Analysis:**

1. Navigate to `/attendance/reports`
2. Configure export filters:
   - Class (optional)
   - Student (optional)
   - Status (optional)
   - Date range (from/to)
   - Limit (default 1000 records, max 5000)
3. Click "Export to CSV"
4. System generates CSV with columns:
   - date (YYYY-MM-DD)
   - studentId
   - classId
   - status (PRESENT/ABSENT/LATE)
5. Download file
6. Use for:
   - School compliance reporting
   - Government attendance submissions
   - Parent reports
   - Data analysis

**CSV Format:**

```csv
date,studentId,classId,status
2025-10-10,student123,class456,PRESENT
2025-10-10,student124,class456,ABSENT
2025-10-10,student125,class456,LATE
```

### 7. Identify Students with Low Attendance

**Proactive Intervention:**

1. Navigate to attendance analytics dashboard
2. View "Low Attendance" widget
3. System shows students with < 80% attendance (configurable threshold)
4. Click student to view detailed absence history
5. See patterns:
   - Frequent Monday absences
   - Consecutive absences (potential concern)
   - Specific class absences
6. Generate report for counselor or administration
7. Initiate parent contact or intervention

### 8. Generate Monthly Attendance Report

**End-of-Month Reporting:**

1. Navigate to `/attendance/reports`
2. Select "Monthly Report"
3. Choose month and year
4. Select scope:
   - Entire school
   - Specific grade level
   - Specific class
5. System calculates:
   - Total school days in month
   - Average attendance percentage
   - Total absences and tardies
   - Students with perfect attendance
   - Students with concerning absence rates
6. Export to PDF or CSV
7. Submit to school board or government agency

### 9. Period-by-Period Attendance (Advanced)

**For Secondary Schools:**

1. Navigate to timetable-integrated attendance
2. Select date and period (e.g., Period 1, Period 2)
3. System loads class scheduled for that period
4. Mark attendance for that specific period
5. Track attendance per subject, not just daily
6. Use cases:
   - Student leaves early (present morning, absent afternoon)
   - Student arrives late (absent Period 1, present Period 2+)
   - More accurate tracking for secondary schools

### 10. Handle Special Attendance Cases

**Excused Absences (Future Enhancement):**

- Medical appointment
- Family emergency
- School-approved activity
- Religious observance

**Unexcused Absences:**

- No reason provided
- Parent did not notify school
- Truancy cases

**Workflow:**

1. Mark as absent initially
2. Parent provides excuse (via portal or phone)
3. Admin updates absence reason
4. System tracks excused vs. unexcused
5. Reports differentiate between types

---

## Integration with Other Features

### Links to Students

- Attendance records reference studentId
- Student profile shows attendance history
- Attendance percentage calculated per student
- Low attendance flags on student record
- Alerts generated for excessive absences

### Links to Classes

- Attendance marked per class per day
- Class roster used for attendance marking
- Class attendance statistics (% present per day)
- Homeroom teacher sees class attendance summary

### Links to Teachers

- Teachers mark attendance for their classes
- Teacher dashboard shows attendance tasks
- Attendance marking integrated with class schedule
- Teachers can view historical attendance

### Links to Timetable

- Period-by-period attendance uses timetable data
- Current period's class auto-selected for marking
- Attendance knows which class is active now
- Schedule conflicts affect attendance workflow

### Links to Parents

- Parents view child's attendance via parent portal
- Automated absence notifications sent to parents
- Parents can submit excuse notes digitally
- Monthly attendance summaries emailed

### Links to Dashboard

- Admin dashboard shows:
  - Today's attendance percentage (school-wide)
  - Classes with unmarked attendance
  - Students absent today
- Teacher dashboard shows:
  - Attendance tasks for today
  - Classes needing attendance marking

### Links to Announcements

- Send announcement to all students absent today
- Notify parents of absent students
- Alerts for patterns (e.g., flu outbreak)

---

## Technical Implementation

### Files and Responsibilities

- **`content.tsx`**: Server component that renders attendance marking interface
- **`table.tsx`**: Client table showing attendance records with filters
- **`columns.tsx`**: Column definitions for attendance history table
- **`actions.ts`**: Server actions for marking, fetching, and exporting attendance
- **`validation.ts`**: Zod schemas for attendance marking input

### Server Actions

**`markAttendance(input)`**

- Input: `{ classId, date, records: [{ studentId, status }] }`
- Validates with `markAttendanceSchema`
- Upserts attendance records (update if exists, create if new)
- Uses unique constraint: `schoolId_studentId_classId_date`
- Revalidates `/dashboard/attendance` path
- Returns `{ success: true }`

**`getAttendanceList(input)`**

- Input: `{ classId, date }`
- Fetches StudentClass enrollments for roster
- Fetches existing attendance marks for date
- Joins data: student info + attendance status
- Returns: `{ rows: [{ studentId, name, status }] }`
- Default status: "present" if no record exists

**`getClassesForSelection()`**

- Fetches all classes for current school
- Returns: `{ classes: [{ id, name }] }`
- Used in class dropdown selector

**`getAttendanceReportCsv(input)`**

- Input: `{ classId?, studentId?, status?, from?, to?, limit? }`
- Filters attendance records by parameters
- Supports date range filtering
- Limits to max 5000 records for performance
- Returns CSV string: `date,studentId,classId,status`
- Used for compliance reporting and data export

### Database Schema

```prisma
model Attendance {
  id           String           @id @default(cuid())
  schoolId     String
  studentId    String
  classId      String
  date         DateTime         @db.Date
  status       AttendanceStatus
  notes        String?
  markedBy     String?          // Teacher ID who marked attendance
  markedAt     DateTime         @default(now())
  method       AttendanceMethod @default(MANUAL) // How attendance was marked
  deviceId     String?          // Device used for marking
  checkInTime  DateTime?        // Exact check-in time
  checkOutTime DateTime?        // Exact check-out time
  location     Json?            // Location data if applicable
  confidence   Float?           // Accuracy/confidence score for biometric

  school  School  @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  student Student @relation(fields: [studentId], references: [id], onDelete: Cascade)
  class   Class   @relation(fields: [classId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([schoolId, studentId, classId, date])
  @@index([date])
  @@index([status])
  @@index([studentId])
  @@index([classId])
  @@index([method])
  @@map("attendances")
}

enum AttendanceStatus {
  PRESENT
  ABSENT
  LATE
  EXCUSED
  SICK
  HOLIDAY
}

enum AttendanceMethod {
  MANUAL
  GEOFENCE
  QR_CODE
  BARCODE
  RFID
  FINGERPRINT
  FACE_RECOGNITION
  NFC
  BLUETOOTH
  BULK_UPLOAD
}

model StudentIdentifier {
  id         String         @id @default(cuid())
  schoolId   String
  studentId  String
  type       IdentifierType
  value      String         // Card number, barcode, QR data
  isActive   Boolean        @default(true)
  lastUsedAt DateTime?
  usageCount Int            @default(0)

  school  School  @relation(fields: [schoolId], references: [id])
  student Student @relation(fields: [studentId], references: [id])

  @@unique([schoolId, type, value])
  @@index([studentId])
  @@index([type])
  @@map("student_identifiers")
}

model QRCodeSession {
  id          String   @id @default(cuid())
  schoolId    String
  classId     String
  code        String   @unique
  payload     Json     // Encrypted payload data
  generatedBy String   // User ID who generated
  expiresAt   DateTime
  isActive    Boolean  @default(true)
  scanCount   Int      @default(0)
  scannedBy   Json     @default("[]") // Array of student IDs

  school School @relation(fields: [schoolId], references: [id])
  class  Class  @relation(fields: [classId], references: [id])

  @@index([classId])
  @@index([expiresAt])
  @@index([isActive])
  @@map("qr_code_sessions")
}
```

### Data Flow (Server-Source-of-Truth)

1. Teacher selects class and date → `getAttendanceList()` fetches roster
2. Server returns enrolled students + existing attendance marks
3. Client displays roster with status radio buttons
4. Teacher updates statuses → Submits form → `markAttendance()`
5. Server upserts attendance records, scoped by `schoolId`
6. `revalidatePath()` triggers re-fetch
7. Updated attendance shown in table

### Multi-Tenant Safety

- All queries include `schoolId` from `getTenantContext()`
- Unique constraint scoped by school: `@@unique([schoolId, studentId, classId, date])`
- Prevents cross-tenant data access
- CSV export filtered by `schoolId`

### Validation

**Client-Side:**

- Class selection required
- Date required and valid
- Status must be "present", "absent", or "late"

**Server-Side:**

- `markAttendanceSchema` validates input shape
- Status mapped to uppercase enum: PRESENT, ABSENT, LATE
- Date converted to Date object
- All records validated before upsert

### Current Behavior

- **Default Status**: Students default to "present" if not marked
- **Upsert Logic**: Updating attendance for same day overwrites previous mark
- **Bulk Marking**: Frontend can send all students in single request
- **Date Handling**: Dates normalized to midnight UTC to avoid timezone issues
- **Status Options**: Three statuses (present/absent/late), extensible for future codes

---

## Usage

The component is used in the platform dashboard at `/dashboard/attendance` and automatically handles:

- Multi-tenant data isolation (schoolId scoping)
- Class roster loading with enrollment data
- Attendance status persistence and updates
- CSV export for compliance reporting
- Date range filtering for reports
- Optimistic UI updates

---

## Dependencies

- React Hook Form for attendance marking forms
- Zod for validation schemas
- TanStack Table for attendance history display
- shadcn/ui components (Select, DatePicker, RadioGroup)
- Next.js server actions for backend operations
- Prisma for database access

---

## Technology Stack & Dependencies

This feature is built with the following technologies (see [Platform README](../README.md) for complete stack details):

### Core Framework

- **Next.js 15.4+** - App Router with Server Components ([Docs](https://nextjs.org/docs))
- **React 19+** - Server Actions, new hooks (`useActionState`, `useFormStatus`) ([Docs](https://react.dev))
- **TypeScript** - Strict mode for type safety

### Database & ORM

- **Neon PostgreSQL** - Serverless database with autoscaling ([Docs](https://neon.tech/docs/introduction))
- **Prisma ORM 6.14+** - Type-safe queries and migrations ([Docs](https://www.prisma.io/docs))

### Forms & Validation

- **React Hook Form 7.61+** - Performant form state management ([Docs](https://react-hook-form.com))
- **Zod 4.0+** - Runtime schema validation (client + server) ([Docs](https://zod.dev))

### UI Components

- **shadcn/ui** - Accessible components built on Radix UI ([Docs](https://ui.shadcn.com/docs))
- **TanStack Table 8.21+** - Headless table with sorting/filtering ([Docs](https://tanstack.com/table))
- **Tailwind CSS 4** - Utility-first styling ([Docs](https://tailwindcss.com/docs))

### Server Actions Pattern

All mutations follow the standard server action pattern:

```typescript
"use server"
export async function performAction(input: FormData) {
  const { schoolId } = await getTenantContext()
  const validated = schema.parse(input)
  await db.model.create({ data: { ...validated, schoolId } })
  revalidatePath("/feature-path")
  return { success: true }
}
```

### Key Features

- **Multi-Tenant Isolation**: All queries scoped by `schoolId`
- **Type Safety**: End-to-end TypeScript with Prisma + Zod inference
- **Server-Side Operations**: Mutations via Next.js Server Actions
- **URL State Management**: Filters and pagination synced to URL (where applicable)
- **Accessibility**: ARIA labels, keyboard navigation, semantic HTML

For complete technology documentation, see [Platform Technology Stack](../README.md#technology-stack--documentation).

---

## Future Enhancements

See `ISSUE.md` for detailed production readiness tracker and enhancement roadmap.

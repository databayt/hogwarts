# Timesheet Management

Time tracking and attendance system for hourly staff with payroll integration.

## Overview

The Timesheet module tracks working hours for hourly-paid staff, substitute teachers, and part-time employees. It calculates overtime, integrates with payroll, and provides time tracking analytics.

## Key Features

### 1. Time Entry

- Clock in/out functionality
- Manual time entry
- Break time tracking
- Location-based check-in (GPS)
- QR code scanning

### 2. Timesheet Management

- Weekly/bi-weekly timesheets
- Approval workflow
- Overtime calculation
- Holiday/weekend rates
- Time-off tracking

### 3. Overtime Rules

- Configurable overtime thresholds
- Premium pay rates (1.5x, 2x)
- Automatic overtime detection
- Overtime approval required

### 4. Reporting & Analytics

- Hours worked by employee
- Overtime reports
- Department-wise hours
- Cost analysis
- Trend analysis

## Data Models

### Timesheet

```typescript
{
  id: string
  userId: string
  periodStart: Date
  periodEnd: Date
  totalHours: Decimal
  regularHours: Decimal
  overtimeHours: Decimal
  breakHours: Decimal
  status: "DRAFT" | "SUBMITTED" | "APPROVED" | "PAID"
  submittedAt?: Date
  approvedBy?: string
  approvedAt?: Date
}
```

### TimeEntry

```typescript
{
  id: string
  timesheetId: string
  date: Date
  clockIn: Date
  clockOut: Date
  breakMinutes: number
  totalHours: Decimal
  notes?: string
  location?: {
    latitude: number
    longitude: number
  }
  isOvertime: boolean
}
```

### OvertimeRule

```typescript
{
  regularHoursPerWeek: 40
  overtimeMultiplier: 1.5 // 1.5x regular rate
  doubleTimeMultiplier: 2.0 // After 12 hours/day or 60 hours/week
  weekendMultiplier: 1.5 // Weekend work
  holidayMultiplier: 2.0 // Holiday work
}
```

## Server Actions

### Time Entry

#### `clockInWithRBAC(userId, location?)`

Records clock-in time.

**Example:**

```typescript
const result = await clockInWithRBAC(userId, {
  latitude: 40.7128,
  longitude: -74.006,
})
```

#### `clockOutWithRBAC(userId)`

Records clock-out time and calculates hours worked.

**Example:**

```typescript
const result = await clockOutWithRBAC(userId)

if (result.success && result.data) {
  console.log(`Worked ${result.data.totalHours} hours today`)
  if (result.data.isOvertime) {
    console.log("⚠️ Overtime detected!")
  }
}
```

#### `createManualTimeEntryWithRBAC(data)`

Creates a manual time entry (for corrections).

**Permissions Required:** `timesheet:create`

**Example:**

```typescript
await createManualTimeEntryWithRBAC({
  userId: "staff_123",
  date: new Date("2024-11-15"),
  clockIn: new Date("2024-11-15T08:00:00"),
  clockOut: new Date("2024-11-15T17:00:00"),
  breakMinutes: 60,
  notes: "Forgot to clock in - verified by manager",
})
```

### Timesheet Management

#### `submitTimesheetWithRBAC(timesheetId)`

Submits timesheet for approval.

**Example:**

```typescript
const result = await submitTimesheetWithRBAC(timesheetId)

if (result.success) {
  console.log("Timesheet submitted for approval")
  // Manager notified automatically
}
```

#### `approveTimesheetWithRBAC(timesheetId)`

Approves a submitted timesheet.

**Permissions Required:** `timesheet:approve`

**Example:**

```typescript
const result = await approveTimesheetWithRBAC(timesheetId)

if (result.success) {
  console.log("Timesheet approved - ready for payroll")
  // Automatically included in next payroll run
}
```

### Reporting

#### `getTimesheetSummaryWithRBAC(userId, startDate, endDate)`

Gets timesheet summary for a period.

**Returns:**

```typescript
{
  totalDays: number
  totalHours: number
  regularHours: number
  overtimeHours: number
  averageHoursPerDay: number
  daysWorked: number
  estimatedPay: number
}
```

## Overtime Calculation

### Daily Overtime

```
Regular Hours: 0-8 hours/day at regular rate
Overtime: 8-12 hours/day at 1.5x rate
Double Time: 12+ hours/day at 2x rate

Example:
Worked 10 hours:
- 8 hours × $20/hr = $160
- 2 hours × $30/hr (1.5x) = $60
Total: $220
```

### Weekly Overtime

```
Regular Hours: 0-40 hours/week
Overtime: 40+ hours/week at 1.5x rate

Example:
Worked 45 hours in a week:
- 40 hours × $20/hr = $800
- 5 hours × $30/hr (1.5x) = $150
Total: $950
```

### Weekend/Holiday Rates

```
Weekend: All hours at 1.5x rate
Holiday: All hours at 2.0x rate

Example (working Sunday, 8 hours):
- 8 hours × $30/hr (1.5x) = $240
```

## Workflow

### Weekly Timesheet Cycle

```
1. Monday: New timesheet period starts
2. Daily: Staff clock in/out
3. Friday: Review hours worked
4. Saturday: Submit timesheet
5. Sunday-Monday: Manager approval
6. Tuesday: Approved timesheets to payroll
7. Friday: Payment processed
```

### Time Entry Process

```
1. Staff arrives at work
2. Clock in via app/web/QR code
3. System records time and location
4. Work during the day
5. Take breaks (optional tracking)
6. Clock out at end of shift
7. System calculates total hours
8. Overtime flagged if applicable
```

## Integration

- **Payroll Module**: Approved timesheets automatically included in payroll
- **Salary Module**: Hourly rates from salary structure
- **Budget Module**: Tracks labor costs against budget
- **Accounts Module**: Journal entries for labor costs

## RBAC

| Role           | View      | Create   | Edit     | Approve   | View All |
| -------------- | --------- | -------- | -------- | --------- | -------- |
| **ADMIN**      | ✅        | ✅       | ✅       | ✅        | ✅       |
| **ACCOUNTANT** | ✅        | ✅       | ✅       | ✅        | ✅       |
| **MANAGER**    | ✅ (team) | ❌       | ❌       | ✅ (team) | ❌       |
| **TEACHER**    | ✅ (own)  | ✅ (own) | ✅ (own) | ❌        | ❌       |
| **STAFF**      | ✅ (own)  | ✅ (own) | ✅ (own) | ❌        | ❌       |

## Best Practices

### 1. Accurate Time Entry

- Clock in/out at exact times
- Record breaks honestly
- Submit timesheets on time
- Notify manager of errors immediately

### 2. Overtime Management

- Get pre-approval for overtime
- Monitor hours throughout week
- Alert staff approaching overtime
- Review overtime regularly

### 3. Approval Process

- Review timesheets within 24 hours
- Verify hours match schedules
- Question unusual entries
- Approve by Tuesday for Friday payroll

### 4. Compliance

- Follow labor laws (FLSA)
- Track all worked hours
- Maintain 7-year records
- Regular policy reviews

### 5. Technology Use

- Use mobile app for clock in/out
- Enable GPS for field staff
- Set up geofencing for automatic clock-in
- Use biometric verification if needed

## Reports

1. **Hours Worked Report**: Total hours by employee
2. **Overtime Report**: Overtime hours and cost
3. **Attendance Report**: Days worked vs scheduled
4. **Department Labor Cost**: Labor cost by department
5. **Timesheet Compliance**: Late/missing timesheets

## Troubleshooting

### Forgot to Clock Out

**Solution:** Manager can add clock-out time manually with note

### Incorrect Hours

**Solution:** Edit time entry before submission; after submission requires manager approval

### Overtime Not Calculated

**Solution:** Verify overtime rules configured; check if employee eligible for overtime

## Future Enhancements

1. **Facial Recognition**: Prevent buddy punching
2. **AI Scheduling**: Optimize schedules based on historical data
3. **Mobile App**: Native iOS/Android apps
4. **Shift Swapping**: Allow staff to swap shifts
5. **Predictive Analytics**: Forecast labor needs

## Related Files

- `actions.ts` - Server actions
- `clock-in-out.tsx` - Clock in/out interface
- `timesheet-form.tsx` - Timesheet entry form
- `overtime-calculator.ts` - Overtime calculation logic

## Support

For questions: hr@school.edu
For technical issues: support@school.edu

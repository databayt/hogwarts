# Payroll Management

Comprehensive payroll processing system with progressive tax calculations, benefits, deductions, and compliance features.

## Overview

The Payroll module automates salary calculations, tax withholding, benefits administration, and payslip generation for all school staff.

## Key Features

### 1. Salary Structure Management

- Define base salary, allowances, and benefits
- Configure pre-tax and post-tax deductions
- Track employer contributions
- Support for multiple pay frequencies (monthly, bi-weekly)

### 2. Progressive Tax Calculation

- **5 Tax Brackets** with cumulative calculations
- **Social Security Tax** (6.2% up to $160,200 wage base)
- **Medicare Tax** (1.45% + 0.9% additional for high earners)
- **Employer Contributions** (7.65% for Social Security + Medicare)

### 3. Payroll Processing

- Batch process payroll for multiple employees
- Calculate gross/net salaries automatically
- Generate payslips with detailed breakdown
- Approval workflow before finalization

### 4. Payslip Generation

- Professional PDF payslips
- Detailed earnings and deductions breakdown
- Year-to-date totals
- Digital delivery via email

### 5. Benefits & Deductions

- Health insurance
- Retirement contributions (401k, pension)
- Life insurance
- Loan repayments
- Advance salary deductions
- Flexible deduction types (fixed amount or percentage)

## Tax System

### Progressive Tax Brackets (2024)

| Income Range       | Tax Rate | Fixed Amount |
| ------------------ | -------- | ------------ |
| $0 - $10,000       | 0%       | $0           |
| $10,001 - $30,000  | 10%      | $0           |
| $30,001 - $60,000  | 15%      | $2,000       |
| $60,001 - $100,000 | 20%      | $6,500       |
| $100,001+          | 25%      | $14,500      |

**Example Calculation for $75,000 salary:**

```
Bracket 1: $10,000 × 0% = $0
Bracket 2: $20,000 × 10% = $2,000
Bracket 3: $30,000 × 15% = $4,500
Bracket 4: $15,000 × 20% = $3,000
Total Income Tax: $2,000 + $4,500 + $3,000 = $9,500
```

### Social Security Tax

- **Rate:** 6.2% for both employee and employer
- **Wage Base:** $160,200 (2024 limit)
- **Maximum:** $9,932.40 per year

**Example for $75,000 salary:**

```
Social Security = $75,000 × 6.2% = $4,650
```

### Medicare Tax

- **Standard Rate:** 1.45% (no wage limit)
- **Additional Medicare Tax:** 0.9% for income >$200,000

**Example for $75,000 salary:**

```
Medicare = $75,000 × 1.45% = $1,087.50
```

### Employer Contributions

- **Social Security:** 6.2%
- **Medicare:** 1.45%
- **Total:** 7.65%

## Data Models

### SalaryStructure

```typescript
{
  id: string
  userId: string          // Staff member
  baseSalary: Decimal
  effectiveFrom: Date
  effectiveTo?: Date
  payFrequency: "MONTHLY" | "BI_WEEKLY" | "WEEKLY"
  benefits: Benefit[]
  deductions: Deduction[]
  isActive: boolean
}
```

### Benefit

```typescript
{
  type: "ALLOWANCE" | "BONUS" | "COMMISSION" | "OTHER"
  name: string
  amount: number
  isRecurring: boolean
  isTaxable: boolean
}
```

### Deduction

```typescript
{
  type: "PERCENTAGE" | "FIXED"
  name: string
  value: number // Percentage (e.g., 5) or fixed amount
  isPreTax: boolean // Deduct before or after tax
  isRecurring: boolean
}
```

### PayrollRun

```typescript
{
  id: string
  periodStart: Date
  periodEnd: Date
  paymentDate: Date
  totalEmployees: number
  totalGrossSalary: Decimal
  totalNetSalary: Decimal
  totalTax: Decimal
  totalEmployerContributions: Decimal
  status: "DRAFT" | "PROCESSED" | "PAID"
  processedBy: string
  processedAt?: Date
}
```

### PayrollItem

```typescript
{
  id: string
  payrollRunId: string
  userId: string
  baseSalary: Decimal
  grossSalary: Decimal
  incomeTax: Decimal
  socialSecurity: Decimal
  medicare: Decimal
  totalTax: Decimal
  totalDeductions: Decimal
  netSalary: Decimal
  employerContributions: Decimal
  benefits: Json
  deductions: Json
  status: "PENDING" | "APPROVED" | "PAID"
}
```

## Server Actions

### Salary Structure Management

#### `createSalaryStructureWithRBAC(data)`

Creates a new salary structure for a staff member.

**Permissions Required:** `payroll:create`

**Example:**

```typescript
const result = await createSalaryStructureWithRBAC({
  userId: "user_123",
  baseSalary: 60000,
  effectiveFrom: new Date("2024-01-01"),
  payFrequency: "MONTHLY",
  benefits: [
    {
      type: "ALLOWANCE",
      name: "Housing Allowance",
      amount: 10000,
      isRecurring: true,
      isTaxable: true,
    },
    {
      type: "ALLOWANCE",
      name: "Transportation",
      amount: 5000,
      isRecurring: true,
      isTaxable: true,
    },
  ],
  deductions: [
    {
      type: "PERCENTAGE",
      name: "401k Contribution",
      value: 5, // 5% of gross
      isPreTax: true,
      isRecurring: true,
    },
    {
      type: "FIXED",
      name: "Health Insurance",
      value: 500,
      isPreTax: true,
      isRecurring: true,
    },
  ],
})
```

#### `updateSalaryStructureWithRBAC(id, data)`

Updates an existing salary structure.

**Permissions Required:** `payroll:edit`

#### `deactivateSalaryStructureWithRBAC(id)`

Deactivates a salary structure (sets effectiveTo to today).

**Permissions Required:** `payroll:delete`

### Payroll Processing

#### `processPayrollRunWithRBAC(data)`

Processes payroll for all active employees in a period.

**Permissions Required:** `payroll:process`

**Example:**

```typescript
const result = await processPayrollRunWithRBAC({
  periodStart: new Date("2024-11-01"),
  periodEnd: new Date("2024-11-30"),
  paymentDate: new Date("2024-12-01"),
  includeInactive: false,
})

if (result.success && result.data) {
  console.log(`Processed ${result.data.totalEmployees} employees`)
  console.log(`Total payout: $${result.data.totalNetSalary}`)
}
```

**Process:**

1. Fetches all active salary structures
2. Calculates taxes for each employee
3. Applies benefits and deductions
4. Creates PayrollRun record
5. Creates PayrollItem for each employee
6. Sets status to DRAFT (requires approval)

#### `approvePayrollRunWithRBAC(id)`

Approves a payroll run, changing status to PROCESSED.

**Permissions Required:** `payroll:approve`

**Example:**

```typescript
const result = await approvePayrollRunWithRBAC(payrollRunId)

if (result.success) {
  // Payroll is now ready for payment
  console.log("Payroll approved and ready for disbursement")
}
```

#### `markPayrollRunAsPaidWithRBAC(id)`

Marks payroll run as PAID after actual payment.

**Permissions Required:** `payroll:process`

### Payslip Generation

#### `generatePayslipWithRBAC(payrollItemId)`

Generates a detailed payslip for an employee.

**Returns:**

```typescript
{
  employee: {
    id: string
    name: string
    email: string
    employeeId?: string
  }
  period: {
    start: Date
    end: Date
    paymentDate: Date
  }
  earnings: {
    baseSalary: number
    benefits: Benefit[]
    totalEarnings: number
  }
  deductions: {
    preTax: Deduction[]
    incomeTax: number
    socialSecurity: number
    medicare: number
    postTax: Deduction[]
    totalDeductions: number
  }
  summary: {
    grossSalary: number
    totalTax: number
    netSalary: number
    employerContributions: number
  }
  yearToDate: {
    grossEarnings: number
    totalTax: number
    netPay: number
  }
}
```

**Example:**

```typescript
const result = await generatePayslipWithRBAC(payrollItemId)

if (result.success && result.data) {
  const payslip = result.data

  // Send payslip via email
  await sendPayslipEmail(payslip.employee.email, payslip)

  // Or generate PDF
  const pdf = await generatePayslipPDF(payslip)
}
```

## Payroll Calculation Logic

### Step-by-Step Calculation

For an employee with:

- Base Salary: $60,000/year ($5,000/month)
- Housing Allowance: $10,000/year ($833.33/month)
- 401k: 5% pre-tax
- Health Insurance: $500/month pre-tax

**1. Calculate Gross Salary**

```
Gross = Base + Benefits
Gross = $5,000 + $833.33 = $5,833.33
```

**2. Apply Pre-Tax Deductions**

```
401k = $5,833.33 × 5% = $291.67
Health Insurance = $500
Total Pre-Tax = $291.67 + $500 = $791.67

Taxable Income = $5,833.33 - $791.67 = $5,041.66
```

**3. Calculate Income Tax** (Annual: $60,500)

```
Bracket 1: $10,000 × 0% = $0
Bracket 2: $20,000 × 10% = $2,000
Bracket 3: $30,000 × 15% = $4,500
Bracket 4: $500 × 20% = $100
Total Annual Tax = $6,600
Monthly Tax = $6,600 / 12 = $550
```

**4. Calculate Social Security**

```
Social Security = $5,041.66 × 6.2% = $312.58
```

**5. Calculate Medicare**

```
Medicare = $5,041.66 × 1.45% = $73.10
```

**6. Calculate Net Salary**

```
Net = Taxable Income - Taxes
Net = $5,041.66 - $550 - $312.58 - $73.10 = $4,105.98
```

**7. Calculate Employer Contributions**

```
Employer = $5,041.66 × 7.65% = $385.69
```

**Summary:**

- Gross: $5,833.33
- Pre-Tax Deductions: $791.67
- Taxes: $935.68
- **Net Pay: $4,105.98**
- Employer Cost: $385.69

## Workflow

### 1. Setup Phase

```
1. Create salary structures for all staff
2. Define benefits and deductions
3. Configure tax settings (if needed)
4. Assign roles for payroll processing
```

### 2. Monthly Processing

```
1. Review active salary structures
2. Process payroll run (Draft status)
3. Review calculated amounts
4. Make adjustments if needed
5. Approve payroll run
6. Generate payslips
7. Disburse payments
8. Mark as PAID
```

### 3. Year-End

```
1. Generate W-2 forms
2. Calculate year-to-date totals
3. File tax reports
4. Archive payroll data
5. Review salary structures for next year
```

## Integration with Other Modules

### Budget Module

- Payroll deducts from "Salaries & Benefits" allocation
- Commits budget for recurring salaries
- Alerts if payroll exceeds budget

### Accounts Module

- Creates journal entries for each payroll run
- Debits salary expense accounts
- Credits cash/bank accounts
- Tracks employer contributions

### Banking Module

- Initiates bank transfers for salary payments
- Tracks payment status
- Reconciles payroll transactions

## RBAC (Role-Based Access Control)

### Permissions

| Role           | View     | Create | Edit | Delete | Process | Approve |
| -------------- | -------- | ------ | ---- | ------ | ------- | ------- |
| **ADMIN**      | ✅       | ✅     | ✅   | ✅     | ✅      | ✅      |
| **ACCOUNTANT** | ✅       | ✅     | ✅   | ✅     | ✅      | ✅      |
| **TEACHER**    | ✅ (own) | ❌     | ❌   | ❌     | ❌      | ❌      |
| **STAFF**      | ✅ (own) | ❌     | ❌   | ❌     | ❌      | ❌      |
| **STUDENT**    | ❌       | ❌     | ❌   | ❌     | ❌      | ❌      |
| **GUARDIAN**   | ❌       | ❌     | ❌   | ❌     | ❌      | ❌      |

**Note:** Teachers and staff can only view their own salary and payslips.

## Best Practices

### 1. Salary Structure Management

- Review and update annually
- Document all changes
- Communicate changes to affected staff
- Maintain salary confidentiality

### 2. Payroll Processing

- Process payroll 3-5 days before payment date
- Always review calculations before approval
- Keep backup of all payroll data
- Test calculations with sample data first

### 3. Tax Compliance

- Update tax brackets annually
- File tax reports on time
- Keep W-2 records for 7 years
- Consult tax professional for complex cases

### 4. Benefits & Deductions

- Get written consent for all deductions
- Review benefits annually
- Cap deductions at 25% of gross (legal requirement)
- Track unused benefits (vacation, sick leave)

### 5. Security

- Limit access to payroll data (need-to-know basis)
- Use audit logs for all changes
- Encrypt sensitive payroll information
- Regular security audits

## Reports & Analytics

### Standard Reports

1. **Payroll Summary Report**
   - Total employees
   - Total gross/net salaries
   - Total taxes withheld
   - Employer contributions

2. **Individual Payslips**
   - Detailed earnings breakdown
   - All deductions itemized
   - Year-to-date totals
   - Professional format

3. **Tax Report**
   - Income tax by employee
   - Social Security contributions
   - Medicare contributions
   - Employer tax obligations

4. **Department-wise Payroll**
   - Payroll by department
   - Average salary per department
   - Headcount per department

5. **Year-to-Date Summary**
   - Total earnings per employee
   - Total taxes paid
   - Net pay received

### Compliance Reports

- W-2 forms (annual)
- 941 forms (quarterly)
- FUTA/SUTA reports
- Benefits summary

## Troubleshooting

### Tax Calculation Incorrect

**Issue:** Tax amounts don't match expectations

**Solution:**

- Verify tax brackets are up-to-date
- Check pre-tax deductions are applied first
- Ensure Social Security wage base is correct
- Review additional Medicare tax threshold

### Payslip Generation Fails

**Issue:** Cannot generate payslip PDF

**Solution:**

- Verify payroll item exists and is approved
- Check all required fields are populated
- Ensure PDF generation library is installed
- Review server logs for specific errors

### Negative Net Salary

**Issue:** Net salary is negative or very low

**Solution:**

- Check total deductions don't exceed limits
- Verify benefit amounts are correct
- Review loan deductions
- Cap deductions at 25% of gross

## Future Enhancements

1. **Direct Deposit**: ACH integration for automatic payments
2. **Benefits Portal**: Self-service benefits enrollment
3. **Leave Management**: Track paid time off and impact on salary
4. **Overtime Calculation**: Automatic overtime pay calculations
5. **Multi-Currency**: Support for international staff

## Related Files

- `actions-enhanced.ts` - Server actions with RBAC
- `content.tsx` - UI components
- `validation.ts` - Zod schemas
- `types.ts` - TypeScript types
- `lib/tax-calculator.ts` - Tax calculation logic

## Support

For questions or issues with the Payroll module, contact the HR/Finance team or check the main finance documentation.

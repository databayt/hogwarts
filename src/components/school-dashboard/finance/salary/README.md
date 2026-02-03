# Salary Structure Management

Salary structure definition and management system for all staff members.

## Overview

The Salary module manages salary structures, pay scales, allowances, and benefits for teaching and non-teaching staff. It integrates with the Payroll module for salary processing.

## Key Features

### 1. Salary Structure Definition

- Base salary configuration
- Grade/scale definitions
- Allowances (housing, transportation, etc.)
- Benefits packages
- Performance-based increments

### 2. Salary Components

- **Base Salary**: Fixed monthly/annual salary
- **Allowances**: Additional fixed amounts
- **Bonuses**: Performance/annual bonuses
- **Benefits**: Health insurance, retirement, etc.
- **Deductions**: Loans, advances, taxes

### 3. Pay Scales

- Define salary bands by position
- Annual increment structures
- Merit-based adjustments
- Cost of living adjustments (COLA)

### 4. Salary History

- Track all salary changes
- Effective date management
- Approval workflow
- Audit trail

## Data Models

### SalaryStructure

```typescript
{
  id: string
  userId: string
  position: string
  grade?: string
  baseSalary: Decimal
  allowances: Allowance[]
  benefits: Benefit[]
  effectiveFrom: Date
  effectiveTo?: Date
  isActive: boolean
  approvedBy?: string
  approvedAt?: Date
}
```

### Allowance

```typescript
{
  type: "HOUSING" | "TRANSPORTATION" | "MEAL" | "COMMUNICATION" | "OTHER"
  name: string
  amount: Decimal
  isPercentage: boolean
  isTaxable: boolean
}
```

### Benefit

```typescript
{
  type: "HEALTH" | "RETIREMENT" | "LIFE_INSURANCE" | "OTHER"
  name: string
  value: Decimal
  employerContribution: Decimal
  employeeContribution: Decimal
}
```

### SalaryScale

```typescript
{
  id: string
  position: string
  grade: string
  minSalary: Decimal
  maxSalary: Decimal
  currency: string
  annualIncrement: Decimal
  effectiveFrom: Date
}
```

## Common Salary Components

### Allowances

| Type               | Typical Amount      | Taxable |
| ------------------ | ------------------- | ------- |
| **Housing**        | 20-30% of base      | Yes     |
| **Transportation** | 10-15% of base      | Yes     |
| **Communication**  | Fixed ($50-$100)    | Yes     |
| **Meal**           | Fixed ($100-$200)   | Yes     |
| **Education**      | Fixed ($500-$2,000) | No      |

### Benefits

| Type                  | Employer % | Employee % |
| --------------------- | ---------- | ---------- |
| **Health Insurance**  | 80%        | 20%        |
| **Retirement (401k)** | 3-6% match | Variable   |
| **Life Insurance**    | 100%       | 0%         |
| **Dental**            | 50%        | 50%        |

## Server Actions

### Salary Structure Management

#### `createSalaryStructureWithRBAC(data)`

**Permissions Required:** `salary:create`

**Example:**

```typescript
const result = await createSalaryStructureWithRBAC({
  userId: "teacher_123",
  position: "Senior Teacher",
  grade: "T3",
  baseSalary: 5000,
  allowances: [
    {
      type: "HOUSING",
      name: "Housing Allowance",
      amount: 1500,
      isTaxable: true,
    },
    { type: "TRANSPORTATION", name: "Transport", amount: 500, isTaxable: true },
  ],
  benefits: [
    {
      type: "HEALTH",
      name: "Health Insurance",
      value: 500,
      employerContribution: 400,
      employeeContribution: 100,
    },
  ],
  effectiveFrom: new Date("2024-09-01"),
})
```

#### `updateSalaryStructureWithRBAC(id, data)`

Updates salary structure (creates new version with effectiveFrom date).

#### `approveSalaryChangeWithRBAC(id)`

Approves a salary change (requires approval permission).

### Salary Scale Management

#### `createSalaryScaleWithRBAC(data)`

Defines a salary scale for a position.

**Example:**

```typescript
await createSalaryScaleWithRBAC({
  position: "Teacher",
  grade: "T1",
  minSalary: 3000,
  maxSalary: 4000,
  annualIncrement: 150,
  effectiveFrom: new Date("2024-01-01"),
})
```

### Salary Calculations

#### `calculateTotalCompensationWithRBAC(userId)`

Calculates total compensation including salary, allowances, and benefits.

**Returns:**

```typescript
{
  baseSalary: number
  totalAllowances: number
  totalBenefits: number
  grossCompensation: number
  employerCost: number
}
```

## Salary Revision Process

```
1. HR initiates salary review
2. Performance evaluation conducted
3. Salary increase recommended
4. Budget approval required
5. HR creates new salary structure
6. Approval workflow (HR → Finance → Principal)
7. Salary structure activated
8. Staff notified of change
9. Updated in next payroll cycle
```

## Integration

- **Payroll Module**: Fetches active salary structures for payroll processing
- **Budget Module**: Salary costs deduct from salary budget allocation
- **Accounts Module**: Salary expense journal entries

## RBAC

| Role           | View     | Create | Edit | Approve |
| -------------- | -------- | ------ | ---- | ------- |
| **ADMIN**      | ✅       | ✅     | ✅   | ✅      |
| **ACCOUNTANT** | ✅       | ✅     | ✅   | ✅      |
| **TEACHER**    | ✅ (own) | ❌     | ❌   | ❌      |
| **STAFF**      | ✅ (own) | ❌     | ❌   | ❌      |

## Best Practices

1. **Annual Reviews**: Review all salaries annually
2. **Market Benchmarking**: Compare with market rates
3. **Transparent Scales**: Publish salary scales
4. **Merit-Based**: Link increases to performance
5. **Budget Planning**: Plan salary budget in advance

## Support

For questions: hr@school.edu or finance@school.edu

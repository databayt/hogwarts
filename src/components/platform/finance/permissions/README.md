# Finance Permissions Management

Comprehensive permission management system for the finance module with granular access control.

## Overview

The Permission Management UI provides admins with a powerful interface to manage finance permissions for users. It supports:

- **Granular Permissions**: Control access at the module and action level
- **Role-Based Defaults**: ADMIN, ACCOUNTANT, and DEVELOPER roles have full access by default
- **Custom Permissions**: Grant specific permissions to any user
- **Bulk Operations**: Grant/revoke multiple permissions at once
- **Permission Copying**: Copy permissions from one user to another
- **Two View Modes**: View permissions by user or by module

## Features

### 1. User View
- Lists all users in the school with their permissions
- Shows role badges and custom permissions
- Search by name or email
- Filter by role or module
- Quick access to edit permissions or copy to another user

### 2. Module View
- Groups permissions by finance module
- Shows which users have access to each module
- Displays specific actions each user can perform
- Easy to see permission distribution across modules

### 3. Permission Editing
- Visual checkbox interface for all module-action combinations
- Real-time preview of changes
- Bulk grant/revoke with validation
- Automatic conflict detection

### 4. Permission Copying
- Copy all permissions from one user to another
- Useful for onboarding new staff with similar roles
- Preview permissions before copying

## Finance Modules

The system supports 12 finance modules:

| Module | Description |
|--------|-------------|
| **invoice** | Invoice generation and management |
| **receipt** | Receipt generation and tracking |
| **banking** | Bank accounts and reconciliation |
| **fees** | Student fees and payment plans |
| **salary** | Salary structures and benefits |
| **payroll** | Payroll processing and tax calculations |
| **timesheet** | Time tracking for staff |
| **wallet** | Digital wallet management |
| **budget** | Budget planning and variance analysis |
| **expenses** | Expense tracking and approval |
| **accounts** | Chart of accounts and journal entries |
| **reports** | Financial reporting and analytics |

## Finance Actions

7 actions can be performed on each module:

| Action | Description |
|--------|-------------|
| **view** | View data (read-only access) |
| **create** | Create new records |
| **edit** | Modify existing records |
| **delete** | Remove records |
| **approve** | Approve/reject submissions |
| **process** | Process transactions (e.g., run payroll) |
| **export** | Export data to files |

## Permission Hierarchy

The system uses a hybrid permission model:

### 1. Role-Based (Base Layer)
- **ADMIN**: Full access to all modules and actions
- **ACCOUNTANT**: Full access to all modules and actions
- **DEVELOPER**: Platform admin with full access
- **Other roles**: No default access (requires granular permissions)

### 2. Granular Permissions (Fine-Tuning)
- Custom permissions stored in `FinancePermission` model
- Allow specific users to perform specific actions on specific modules
- Example: A teacher can view payroll (to see their salary) but cannot process payroll

## Usage Examples

### Example 1: Grant Invoice Access to Teacher
```typescript
// A teacher needs to view and create invoices for their classes
await grantPermission(teacherId, "invoice", "view")
await grantPermission(teacherId, "invoice", "create")
```

### Example 2: Bulk Grant Report Access
```typescript
// Grant multiple staff members view and export access to reports
await bulkGrantPermissions(userId, [
  { module: "reports", action: "view" },
  { module: "reports", action: "export" },
])
```

### Example 3: Copy Permissions to New Accountant
```typescript
// Copy all permissions from existing accountant to new hire
await copyPermissions(existingAccountantId, newAccountantId)
```

### Example 4: Revoke Expense Approval
```typescript
// Remove approval permission from a user
await revokePermission(userId, "expenses", "approve")
```

## Server Actions

### Data Fetching

#### `getAllUsersWithPermissions()`
Fetches all users in the school with their finance permissions.

**Returns:**
```typescript
{
  success: boolean
  data?: UserPermissionSummary[]
  error?: string
}
```

**Example:**
```typescript
const result = await getAllUsersWithPermissions()
if (result.success && result.data) {
  for (const user of result.data) {
    console.log(user.userName, user.permissions)
  }
}
```

#### `getPermissionsByModule()`
Fetches permissions grouped by module.

**Returns:**
```typescript
{
  success: boolean
  data?: ModulePermissionSummary[]
  error?: string
}
```

### Permission Management

#### `grantPermission(userId, module, action)`
Grants a single permission to a user.

**Parameters:**
- `userId` - Target user ID
- `module` - Finance module (e.g., "invoice", "payroll")
- `action` - Action to grant (e.g., "view", "create")

**Returns:**
```typescript
{ success: boolean; error?: string }
```

#### `revokePermission(userId, module, action)`
Revokes a single permission from a user.

**Parameters:**
- `userId` - Target user ID
- `module` - Finance module
- `action` - Action to revoke

**Returns:**
```typescript
{ success: boolean; error?: string }
```

#### `bulkGrantPermissions(userId, permissions)`
Grants multiple permissions to a user at once.

**Parameters:**
- `userId` - Target user ID
- `permissions` - Array of `{ module, action }` objects

**Returns:**
```typescript
{
  success: boolean
  granted: number
  failed: number
  error?: string
}
```

**Example:**
```typescript
const result = await bulkGrantPermissions(userId, [
  { module: "invoice", action: "view" },
  { module: "invoice", action: "create" },
  { module: "reports", action: "view" },
])

console.log(`Granted ${result.granted} permissions, ${result.failed} failed`)
```

#### `bulkRevokePermissions(userId, permissions)`
Revokes multiple permissions from a user at once.

**Parameters:**
- `userId` - Target user ID
- `permissions` - Array of `{ module, action }` objects

**Returns:**
```typescript
{
  success: boolean
  revoked: number
  failed: number
  error?: string
}
```

#### `copyPermissions(fromUserId, toUserId)`
Copies all permissions from one user to another.

**Parameters:**
- `fromUserId` - Source user ID
- `toUserId` - Target user ID

**Returns:**
```typescript
{
  success: boolean
  copied: number
  error?: string
}
```

**Example:**
```typescript
// Copy permissions from senior accountant to new accountant
const result = await copyPermissions(seniorAccountantId, newAccountantId)
console.log(`Copied ${result.copied} permissions`)
```

## Security

### Authorization Checks
- Only users with `approve` permission on a module can manage permissions for that module
- All operations verify the user belongs to the same school as the target user
- DEVELOPER role bypasses school checks (platform admin)

### Multi-Tenant Safety
- All queries are scoped by `schoolId`
- Users cannot grant permissions to users in other schools
- Cross-tenant permission checks return `false`

### Audit Trail
- All permission grants/revokes are logged in `FinancePermission` model
- `createdAt` timestamp tracks when permission was granted
- Admin can see who granted permissions (via session)

## UI Components

### PermissionManagementContent
Main component that orchestrates the permission management interface.

**Features:**
- Two-tab layout (Users / Modules)
- Search and filtering
- Real-time data updates
- Loading states and error handling

### UserPermissionCard
Displays a single user with their permissions.

**Actions:**
- Edit Permissions (opens dialog)
- Copy Permissions (opens dialog)

### ModulePermissionCard
Displays a single module with users who have access.

**Shows:**
- Module name and description
- User count with custom permissions
- Table of users with their actions

### EditPermissionsDialog
Dialog for editing a user's permissions.

**Features:**
- Checkbox grid (12 modules × 7 actions = 84 checkboxes)
- Real-time state management
- Diff calculation (grants vs revokes)
- Optimistic updates

### CopyPermissionsDialog
Dialog for copying permissions between users.

**Features:**
- User selector dropdown
- Permission preview
- Validation before copying

## Database Schema

```prisma
model FinancePermission {
  id        String   @id @default(cuid())
  schoolId  String
  userId    String
  module    String   // "invoice", "payroll", etc.
  action    String   // "view", "create", etc.
  createdAt DateTime @default(now())

  school School @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([schoolId, userId, module, action])
  @@index([schoolId, userId])
  @@index([schoolId, module])
  @@map("finance_permissions")
}
```

## Integration with Finance Sub-Blocks

All finance sub-blocks use the centralized permission helper:

```typescript
import { checkCurrentUserPermission } from "@/components/platform/finance/lib/permissions"

export async function createInvoice(data: FormData) {
  const { schoolId } = await getTenantContext()

  // Check permission
  const canCreate = await checkCurrentUserPermission(
    schoolId,
    "invoice",
    "create"
  )

  if (!canCreate) {
    return { success: false, error: "Unauthorized" }
  }

  // ... create invoice
}
```

## Best Practices

### 1. Use Role-Based Defaults First
Don't create custom permissions for ADMIN or ACCOUNTANT roles - they already have full access.

### 2. Grant Minimal Permissions
Follow the principle of least privilege. Grant only the permissions users need.

### 3. Review Permissions Regularly
Periodically audit permissions to ensure they're still appropriate.

### 4. Document Custom Permissions
When granting unusual permissions, document why in your team's internal notes.

### 5. Use Bulk Operations
When onboarding new users with similar roles, use bulk grant or copy permissions.

### 6. Test Permission Changes
After granting/revoking permissions, verify the user can/cannot perform the expected actions.

## Troubleshooting

### User Can't Access Module
1. Check user's role - is it ADMIN, ACCOUNTANT, or DEVELOPER?
2. If not, check custom permissions in the UI
3. Verify user belongs to the correct school
4. Check if permission was recently revoked

### Permission Grant Fails
1. Verify current user has `approve` permission on that module
2. Check target user belongs to same school
3. Look for database errors in server logs
4. Ensure unique constraint isn't violated (permission already exists)

### Bulk Operation Partial Failure
1. Check `granted/failed` counts in response
2. Look at server logs for specific errors
3. Retry failed permissions individually
4. Verify database connectivity

## Performance Considerations

### Caching
- Permissions are checked on every server action
- Consider caching permission checks in production
- Use Redis or similar for distributed caching

### Database Indexes
- `@@index([schoolId, userId])` - Fast lookups by user
- `@@index([schoolId, module])` - Fast lookups by module
- `@@unique([schoolId, userId, module, action])` - Prevents duplicates

### Batch Operations
- Use `bulkGrant` and `bulkRevoke` instead of individual operations
- Reduces database round trips
- More efficient for large permission sets

## Future Enhancements

1. **Permission Templates**: Pre-defined permission sets (e.g., "Accountant", "Finance Manager")
2. **Time-Based Permissions**: Grant temporary access that auto-expires
3. **Delegation**: Allow users to delegate their permissions temporarily
4. **Approval Workflow**: Require admin approval for permission changes
5. **Permission History**: Track all changes with full audit trail
6. **Export/Import**: Bulk permission management via CSV/Excel

## Related Files

- `actions.ts` - Server actions for permission management
- `content.tsx` - Main UI component
- `lib/permissions.ts` - Centralized permission helper
- `prisma/models/finance.prisma` - Database schema

## Support

For issues or questions about the Permission Management system:
1. Check this README first
2. Review code comments in `actions.ts` and `content.tsx`
3. Search for similar permission patterns in other modules
4. Contact the platform development team

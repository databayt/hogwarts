/**
 * Finance Module Role-Based Access Control (RBAC)
 * Centralized permission management for all finance sub-modules
 */

import { auth } from "@/auth"
import { db } from "@/lib/db"

// Permission Actions
export const FinanceActions = {
  VIEW: 'view',
  VIEW_OWN: 'view_own',
  VIEW_ALL: 'view_all',
  CREATE: 'create',
  EDIT: 'edit',
  DELETE: 'delete',
  APPROVE: 'approve',
  PROCESS: 'process',
  EXPORT: 'export',
  RECONCILE: 'reconcile',
  SUBMIT: 'submit',
  MANAGE: 'manage'
} as const

export type FinanceAction = typeof FinanceActions[keyof typeof FinanceActions]

// Finance Modules
export const FinanceModules = {
  DASHBOARD: 'dashboard',
  ACCOUNTS: 'accounts',
  INVOICE: 'invoice',
  RECEIPT: 'receipt',
  BANKING: 'banking',
  FEES: 'fees',
  SALARY: 'salary',
  PAYROLL: 'payroll',
  TIMESHEET: 'timesheet',
  WALLET: 'wallet',
  BUDGET: 'budget',
  EXPENSES: 'expenses',
  REPORTS: 'reports',
  PERMISSIONS: 'permissions',
  SETTINGS: 'settings'
} as const

export type FinanceModule = typeof FinanceModules[keyof typeof FinanceModules]

// Role-based permission matrix
export const financePermissions: Record<string, Record<FinanceModule, FinanceAction[]>> = {
  // Platform Admin - Full access to everything
  DEVELOPER: {
    dashboard: ['view_all', 'manage'],
    accounts: ['view_all', 'create', 'edit', 'delete', 'manage'],
    invoice: ['view_all', 'create', 'edit', 'delete', 'approve', 'export'],
    receipt: ['view_all', 'create', 'edit', 'delete', 'export'],
    banking: ['view_all', 'create', 'edit', 'delete', 'reconcile', 'manage'],
    fees: ['view_all', 'create', 'edit', 'delete', 'approve', 'manage'],
    salary: ['view_all', 'create', 'edit', 'delete', 'approve', 'manage'],
    payroll: ['view_all', 'create', 'edit', 'delete', 'process', 'approve', 'export'],
    timesheet: ['view_all', 'create', 'edit', 'delete', 'approve'],
    wallet: ['view_all', 'create', 'edit', 'delete', 'manage'],
    budget: ['view_all', 'create', 'edit', 'delete', 'approve', 'manage'],
    expenses: ['view_all', 'create', 'edit', 'delete', 'approve', 'export'],
    reports: ['view_all', 'create', 'export', 'manage'],
    permissions: ['view_all', 'create', 'edit', 'delete', 'manage'],
    settings: ['view_all', 'edit', 'manage']
  },

  // School Admin - Full access within their school
  ADMIN: {
    dashboard: ['view_all', 'manage'],
    accounts: ['view_all', 'manage'],
    invoice: ['view_all', 'create', 'edit', 'delete', 'approve', 'export'],
    receipt: ['view_all', 'create', 'edit', 'export'],
    banking: ['view_all', 'create', 'edit', 'reconcile', 'manage'],
    fees: ['view_all', 'create', 'edit', 'delete', 'approve', 'manage'],
    salary: ['view_all', 'create', 'edit', 'approve', 'manage'],
    payroll: ['view_all', 'approve', 'export'],
    timesheet: ['view_all', 'approve'],
    wallet: ['view_all', 'create', 'edit', 'manage'],
    budget: ['view_all', 'create', 'edit', 'approve', 'manage'],
    expenses: ['view_all', 'approve', 'export'],
    reports: ['view_all', 'create', 'export'],
    permissions: ['view_all', 'create', 'edit', 'delete'],
    settings: ['view_all', 'edit', 'manage']
  },

  // Accountant - Financial operations
  ACCOUNTANT: {
    dashboard: ['view_all'],
    accounts: ['view_all', 'create', 'edit'],
    invoice: ['view_all', 'create', 'edit', 'approve', 'export'],
    receipt: ['view_all', 'create', 'edit', 'export'],
    banking: ['view_all', 'create', 'edit', 'reconcile'],
    fees: ['view_all', 'create', 'edit', 'approve'],
    salary: ['view_all', 'create', 'edit'],
    payroll: ['view_all', 'create', 'edit', 'process', 'export'],
    timesheet: ['view_all', 'approve'],
    wallet: ['view_all', 'create', 'edit'],
    budget: ['view_all', 'create', 'edit'],
    expenses: ['view_all', 'create', 'edit', 'approve', 'export'],
    reports: ['view_all', 'create', 'export'],
    permissions: ['view'],
    settings: ['view']
  },

  // Teacher - Limited access
  TEACHER: {
    dashboard: ['view_own'],
    accounts: [],
    invoice: ['view_own'],
    receipt: ['view_own'],
    banking: [],
    fees: ['view'],
    salary: ['view_own'],
    payroll: ['view_own'],
    timesheet: ['view_own', 'submit'],
    wallet: ['view_own'],
    budget: ['view'],
    expenses: ['view_own', 'submit'],
    reports: ['view_own'],
    permissions: [],
    settings: []
  },

  // Student - Very limited access
  STUDENT: {
    dashboard: ['view_own'],
    accounts: [],
    invoice: ['view_own'],
    receipt: ['view_own'],
    banking: [],
    fees: ['view_own'],
    salary: [],
    payroll: [],
    timesheet: [],
    wallet: ['view_own'],
    budget: [],
    expenses: [],
    reports: [],
    permissions: [],
    settings: []
  },

  // Guardian/Parent - Child's financial data
  GUARDIAN: {
    dashboard: ['view_own'],
    accounts: [],
    invoice: ['view_own'],
    receipt: ['view_own'],
    banking: [],
    fees: ['view_own'],
    salary: [],
    payroll: [],
    timesheet: [],
    wallet: ['view_own', 'create'], // Can top-up wallet
    budget: [],
    expenses: [],
    reports: ['view_own'],
    permissions: [],
    settings: []
  },

  // Staff - Similar to teacher
  STAFF: {
    dashboard: ['view_own'],
    accounts: [],
    invoice: ['view_own'],
    receipt: ['view_own'],
    banking: [],
    fees: [],
    salary: ['view_own'],
    payroll: ['view_own'],
    timesheet: ['view_own', 'submit'],
    wallet: [],
    budget: ['view'],
    expenses: ['view_own', 'submit'],
    reports: ['view_own'],
    permissions: [],
    settings: []
  },

  // Default User - Minimal access
  USER: {
    dashboard: ['view_own'],
    accounts: [],
    invoice: [],
    receipt: [],
    banking: [],
    fees: [],
    salary: [],
    payroll: [],
    timesheet: [],
    wallet: [],
    budget: [],
    expenses: [],
    reports: [],
    permissions: [],
    settings: []
  }
}

/**
 * Check if a user has permission for a specific action on a module
 */
export async function hasFinancePermission(
  module: FinanceModule,
  action: FinanceAction,
  userId?: string
): Promise<boolean> {
  const session = await auth()
  if (!session?.user) return false

  const userRole = session.user.role || 'USER'
  const schoolId = session.user.schoolId

  // Platform admins (DEVELOPER) have all permissions
  if (userRole === 'DEVELOPER') return true

  // Check role-based permissions
  const rolePermissions = financePermissions[userRole]?.[module] || []
  const hasRolePermission = rolePermissions.includes(action)

  // If role has permission, check for any custom overrides in database
  if (hasRolePermission && schoolId) {
    // Check if there are any custom permission overrides
    const customPermission = await db.financePermission.findUnique({
      where: {
        schoolId_userId_module_action: {
          schoolId,
          userId: userId || session.user.id!,
          module,
          action
        }
      }
    })

    // If there's a custom permission, it overrides the role permission
    if (customPermission) {
      return true // Custom permissions are always grants, not denials
    }
  }

  return hasRolePermission
}

/**
 * Get all permissions for a user
 */
export async function getUserFinancePermissions(userId?: string) {
  const session = await auth()
  if (!session?.user) return {}

  const userRole = session.user.role || 'USER'
  const schoolId = session.user.schoolId

  // Start with role-based permissions
  const permissions = { ...financePermissions[userRole] }

  // Add custom permissions from database if user has a school
  if (schoolId) {
    const customPermissions = await db.financePermission.findMany({
      where: {
        schoolId,
        userId: userId || session.user.id!
      }
    })

    // Merge custom permissions
    customPermissions.forEach(perm => {
      const module = perm.module as FinanceModule
      const action = perm.action as FinanceAction

      if (!permissions[module]) {
        permissions[module] = []
      }
      if (!permissions[module].includes(action)) {
        permissions[module].push(action)
      }
    })
  }

  return permissions
}

/**
 * Check if user can view own data only
 */
export function isOwnDataOnly(role: string, module: FinanceModule): boolean {
  const permissions = financePermissions[role]?.[module] || []
  return permissions.includes('view_own') && !permissions.includes('view_all')
}

/**
 * Filter data based on user's role and permissions
 */
export async function filterFinanceDataByRole<T extends { userId?: string; studentId?: string; teacherId?: string }>(
  data: T[],
  module: FinanceModule
): Promise<T[]> {
  const session = await auth()
  if (!session?.user) return []

  const userRole = session.user.role || 'USER'
  const userId = session.user.id

  // Platform admins and school admins see everything
  if (['DEVELOPER', 'ADMIN', 'ACCOUNTANT'].includes(userRole)) {
    return data
  }

  // Check if user can only view own data
  if (isOwnDataOnly(userRole, module)) {
    return data.filter(item => {
      // Check various ID fields that might indicate ownership
      if (item.userId && item.userId === userId) return true
      if (item.studentId && userRole === 'STUDENT') {
        // TODO: Check if studentId matches current user's student record
        return true
      }
      if (item.teacherId && userRole === 'TEACHER') {
        // TODO: Check if teacherId matches current user's teacher record
        return true
      }
      return false
    })
  }

  // Default: return all data if user has view permission
  const hasViewPermission = await hasFinancePermission(module, 'view')
  return hasViewPermission ? data : []
}

/**
 * Get quick actions available for a user's role
 */
export function getQuickActionsForFinanceRole(role: string) {
  const actions: Array<{
    id: string;
    label: string;
    icon: string;
    href: string;
    module: string;
    action: string;
  }> = []

  // Define all possible quick actions
  const allActions = {
    createInvoice: {
      id: 'create-invoice',
      label: 'Create Invoice',
      icon: 'FileText',
      href: '/finance/invoice/create',
      module: FinanceModules.INVOICE,
      action: FinanceActions.CREATE
    },
    recordPayment: {
      id: 'record-payment',
      label: 'Record Payment',
      icon: 'DollarSign',
      href: '/finance/fees/payment',
      module: FinanceModules.FEES,
      action: FinanceActions.CREATE
    },
    submitExpense: {
      id: 'submit-expense',
      label: 'Submit Expense',
      icon: 'Receipt',
      href: '/finance/expenses/create',
      module: FinanceModules.EXPENSES,
      action: FinanceActions.SUBMIT
    },
    runPayroll: {
      id: 'run-payroll',
      label: 'Run Payroll',
      icon: 'Users',
      href: '/finance/payroll/run',
      module: FinanceModules.PAYROLL,
      action: FinanceActions.PROCESS
    },
    viewReports: {
      id: 'view-reports',
      label: 'Financial Reports',
      icon: 'BarChart',
      href: '/finance/reports',
      module: FinanceModules.REPORTS,
      action: FinanceActions.VIEW
    },
    bankReconciliation: {
      id: 'bank-reconciliation',
      label: 'Bank Reconciliation',
      icon: 'Building',
      href: '/finance/banking/reconciliation',
      module: FinanceModules.BANKING,
      action: FinanceActions.RECONCILE
    },
    manageWallet: {
      id: 'manage-wallet',
      label: 'Manage Wallet',
      icon: 'Wallet',
      href: '/finance/wallet',
      module: FinanceModules.WALLET,
      action: FinanceActions.VIEW_OWN
    },
    viewDashboard: {
      id: 'view-lab',
      label: 'Dashboard',
      icon: 'TrendingUp',
      href: '/finance/lab',
      module: FinanceModules.DASHBOARD,
      action: FinanceActions.VIEW
    }
  }

  // Filter actions based on role permissions
  const rolePermissions = financePermissions[role] || {}

  Object.values(allActions).forEach(action => {
    const modulePermissions = rolePermissions[action.module] || []
    if (modulePermissions.includes(action.action)) {
      actions.push(action)
    }
  })

  return actions
}

/**
 * Format permission for display
 */
export function formatPermissionLabel(action: FinanceAction): string {
  const labels: Record<FinanceAction, string> = {
    view: 'View',
    view_own: 'View Own',
    view_all: 'View All',
    create: 'Create',
    edit: 'Edit',
    delete: 'Delete',
    approve: 'Approve',
    process: 'Process',
    export: 'Export',
    reconcile: 'Reconcile',
    submit: 'Submit',
    manage: 'Manage'
  }
  return labels[action] || action
}

/**
 * Format module name for display
 */
export function formatModuleLabel(module: FinanceModule): string {
  const labels: Record<FinanceModule, string> = {
    dashboard: 'Dashboard',
    accounts: 'Chart of Accounts',
    invoice: 'Invoice Management',
    receipt: 'Receipt Tracking',
    banking: 'Banking',
    fees: 'Fee Management',
    salary: 'Salary Structure',
    payroll: 'Payroll Processing',
    timesheet: 'Timesheet',
    wallet: 'Digital Wallet',
    budget: 'Budget Management',
    expenses: 'Expense Tracking',
    reports: 'Financial Reports',
    permissions: 'Permissions',
    settings: 'Settings'
  }
  return labels[module] || module
}
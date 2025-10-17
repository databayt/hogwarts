import { UserRole } from '@prisma/client'

/**
 * Banking Module Permission Matrix
 * Defines which roles can perform which banking operations
 */

export const BANKING_PERMISSIONS = {
  // View permissions
  VIEW_OWN_ACCOUNTS: [
    UserRole.DEVELOPER,
    UserRole.ADMIN,
    UserRole.ACCOUNTANT,
    UserRole.TEACHER,
    UserRole.STAFF,
  ],
  VIEW_ALL_ACCOUNTS: [
    UserRole.DEVELOPER,
    UserRole.ADMIN,
    UserRole.ACCOUNTANT,
  ],

  // Account management
  CONNECT_BANK_ACCOUNT: [
    UserRole.DEVELOPER,
    UserRole.ADMIN,
    UserRole.ACCOUNTANT,
  ],
  DISCONNECT_BANK_ACCOUNT: [
    UserRole.DEVELOPER,
    UserRole.ADMIN,
    UserRole.ACCOUNTANT,
  ],

  // Transaction permissions
  VIEW_OWN_TRANSACTIONS: [
    UserRole.DEVELOPER,
    UserRole.ADMIN,
    UserRole.ACCOUNTANT,
    UserRole.TEACHER,
    UserRole.STAFF,
  ],
  VIEW_ALL_TRANSACTIONS: [
    UserRole.DEVELOPER,
    UserRole.ADMIN,
    UserRole.ACCOUNTANT,
  ],
  SYNC_TRANSACTIONS: [
    UserRole.DEVELOPER,
    UserRole.ADMIN,
    UserRole.ACCOUNTANT,
  ],

  // Transfer permissions
  CREATE_TRANSFER: [
    UserRole.DEVELOPER,
    UserRole.ADMIN,
    UserRole.ACCOUNTANT,
  ],
  VIEW_TRANSFER_HISTORY: [
    UserRole.DEVELOPER,
    UserRole.ADMIN,
    UserRole.ACCOUNTANT,
    UserRole.TEACHER,
    UserRole.STAFF,
  ],
  APPROVE_TRANSFER: [
    UserRole.DEVELOPER,
    UserRole.ADMIN,
  ],

  // Export permissions
  EXPORT_TRANSACTIONS: [
    UserRole.DEVELOPER,
    UserRole.ADMIN,
    UserRole.ACCOUNTANT,
  ],
  EXPORT_REPORTS: [
    UserRole.DEVELOPER,
    UserRole.ADMIN,
    UserRole.ACCOUNTANT,
  ],
} as const

export type BankingPermission = keyof typeof BANKING_PERMISSIONS

/**
 * Check if a user role has a specific banking permission
 */
export function hasPermission(
  userRole: UserRole | undefined,
  permission: BankingPermission
): boolean {
  if (!userRole) return false
  return BANKING_PERMISSIONS[permission].includes(userRole)
}

/**
 * Get all permissions for a specific role
 */
export function getPermissionsForRole(role: UserRole): BankingPermission[] {
  return Object.entries(BANKING_PERMISSIONS)
    .filter(([_, allowedRoles]) => allowedRoles.includes(role))
    .map(([permission]) => permission as BankingPermission)
}

/**
 * Check if user can view specific bank account
 */
export function canViewAccount(
  userRole: UserRole | undefined,
  accountUserId: string,
  currentUserId: string
): boolean {
  if (!userRole) return false

  // Admins and accountants can view all accounts
  if (hasPermission(userRole, 'VIEW_ALL_ACCOUNTS')) {
    return true
  }

  // Other roles can only view their own accounts
  if (hasPermission(userRole, 'VIEW_OWN_ACCOUNTS')) {
    return accountUserId === currentUserId
  }

  return false
}

/**
 * Check if user can perform transfer
 */
export function canPerformTransfer(
  userRole: UserRole | undefined,
  fromAccountUserId: string,
  currentUserId: string
): boolean {
  if (!userRole) return false

  // Check if user has transfer permission
  if (!hasPermission(userRole, 'CREATE_TRANSFER')) {
    return false
  }

  // Admins can transfer from any account
  if (userRole === UserRole.ADMIN || userRole === UserRole.DEVELOPER) {
    return true
  }

  // Accountants can only transfer from school accounts (not implemented yet)
  // For now, accountants can transfer from any account in their school
  if (userRole === UserRole.ACCOUNTANT) {
    return true
  }

  return false
}

/**
 * Check if user can manage bank connections
 */
export function canManageBankConnections(userRole: UserRole | undefined): boolean {
  return hasPermission(userRole, 'CONNECT_BANK_ACCOUNT')
}

/**
 * Middleware for checking permissions in server actions
 */
export async function checkBankingPermission(
  userRole: UserRole | undefined,
  permission: BankingPermission
): Promise<void> {
  if (!hasPermission(userRole, permission)) {
    throw new Error(`Insufficient permissions. Required: ${permission}`)
  }
}
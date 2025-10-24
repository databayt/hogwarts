/**
 * Authentication Types
 * Centralized type definitions for authentication and user management
 * Following project standards: no `any` types, strict mode TypeScript
 */

/**
 * User roles in the multi-tenant school management system
 */
export enum UserRole {
  DEVELOPER = "DEVELOPER",    // Platform admin with no schoolId
  ADMIN = "ADMIN",            // School administrator
  TEACHER = "TEACHER",        // Teaching staff
  STUDENT = "STUDENT",        // Enrolled students
  GUARDIAN = "GUARDIAN",      // Student parents/guardians
  ACCOUNTANT = "ACCOUNTANT",  // School finance staff
  STAFF = "STAFF",            // General school staff
  PRINCIPAL = "PRINCIPAL",    // School principal (added based on dashboards)
  USER = "USER"               // Default role for new users
}

/**
 * Extended user type that includes properties added by auth callbacks
 * This interface represents the user object available in sessions
 */
export interface AuthUser {
  id: string;
  email?: string | null;
  username?: string | null;
  image?: string | null;
  role: UserRole | string;  // Using string union to be flexible with existing code
  schoolId?: string | null;
  emailVerified?: Date | null;
  isPlatformAdmin?: boolean;
  name?: string | null;
}

/**
 * Type guard to check if a user has a specific role
 */
export function hasRole(user: AuthUser | null, role: UserRole): boolean {
  return user?.role === role;
}

/**
 * Type guard to check if a user is a platform admin (DEVELOPER role)
 */
export function isPlatformAdmin(user: AuthUser | null): boolean {
  return user?.isPlatformAdmin === true || user?.role === UserRole.DEVELOPER;
}

/**
 * Type guard to check if a user belongs to a school
 */
export function belongsToSchool(user: AuthUser | null): boolean {
  return Boolean(user?.schoolId);
}

/**
 * Dashboard-specific user props interface
 * Used for passing user data to dashboard components
 */
export interface DashboardUserProps {
  user: AuthUser;
  dictionary?: any; // Replace with proper Dictionary type when available
}
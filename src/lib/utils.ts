import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// --- Tenant helpers ---
import { auth } from "@/auth"
import type { UserRole } from "@prisma/client"

export type TenantContext = {
  schoolId: string | null
  requestId: string | null
  role: UserRole | null
  isPlatformAdmin: boolean
}

export async function getTenantContext(): Promise<TenantContext> {
  const session = await auth()
  const schoolId = session?.user?.schoolId ?? null
  const role = (session?.user?.role as UserRole | undefined) ?? null
  const isPlatformAdmin = role === "DEVELOPER"
  // In a full implementation, inject a real requestId via middleware or headers
  const requestId = null
  return { schoolId, requestId, role, isPlatformAdmin }
}

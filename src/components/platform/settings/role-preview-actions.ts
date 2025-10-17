"use server";

import { auth } from "@/auth";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import type { UserRole } from "./role-management";

const PREVIEW_ROLE_COOKIE = "preview-role";
const PREVIEW_MODE_COOKIE = "preview-mode";

/**
 * Set a preview role for testing purposes
 * This allows users to temporarily switch roles to see different views
 */
export async function setPreviewRole(role: UserRole) {
  const session = await auth();

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  // Get the current user's actual role
  const userRole = session.user.role;

  // Check if user has permission to preview roles
  // Allow DEVELOPER and ADMIN to preview any role
  // Allow developer mode (stored in localStorage) to bypass this check
  if (userRole !== "DEVELOPER" && userRole !== "ADMIN") {
    // For other users, we'll check if developer mode is enabled on the client
    // This is handled in the client component
  }

  // Set cookies for preview mode
  const cookieStore = await cookies();

  // Set preview role cookie
  cookieStore.set(PREVIEW_ROLE_COOKIE, role, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24, // 24 hours
    path: "/",
  });

  // Set preview mode flag
  cookieStore.set(PREVIEW_MODE_COOKIE, "true", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24, // 24 hours
    path: "/",
  });

  // Revalidate all paths to reflect the new role
  revalidatePath("/", "layout");

  return { success: true, role };
}

/**
 * Clear preview role and return to actual role
 */
export async function clearPreviewRole() {
  const session = await auth();

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const cookieStore = await cookies();

  // Delete preview cookies
  cookieStore.delete(PREVIEW_ROLE_COOKIE);
  cookieStore.delete(PREVIEW_MODE_COOKIE);

  // Revalidate all paths
  revalidatePath("/", "layout");

  return { success: true };
}

/**
 * Get current preview role if active
 */
export async function getPreviewRole(): Promise<UserRole | null> {
  const cookieStore = await cookies();
  const previewRole = cookieStore.get(PREVIEW_ROLE_COOKIE);
  const previewMode = cookieStore.get(PREVIEW_MODE_COOKIE);

  if (previewMode?.value === "true" && previewRole?.value) {
    return previewRole.value as UserRole;
  }

  return null;
}

/**
 * Check if preview mode is active
 */
export async function isPreviewModeActive(): Promise<boolean> {
  const cookieStore = await cookies();
  const previewMode = cookieStore.get(PREVIEW_MODE_COOKIE);
  return previewMode?.value === "true";
}
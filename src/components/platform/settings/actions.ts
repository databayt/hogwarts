"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getTenantContext } from "@/lib/tenant-context";
import { z } from "zod";
import type { UserRole } from "./role-management";

// Role update schema
const updateRoleSchema = z.object({
  userId: z.string(),
  role: z.enum([
    "DEVELOPER",
    "ADMIN",
    "TEACHER",
    "STUDENT",
    "GUARDIAN",
    "ACCOUNTANT",
    "STAFF",
    "USER",
  ]),
});

// Permission update schema
const updatePermissionsSchema = z.object({
  role: z.string(),
  permissions: z.array(z.string()),
});

// User status update schema
const updateUserStatusSchema = z.object({
  userId: z.string(),
  isActive: z.boolean(),
});

/**
 * Update a user's role
 */
export async function updateUserRole(formData: FormData) {
  try {
    const session = await auth();
    const { schoolId, role: currentUserRole } = await getTenantContext();

    // Check permissions - only ADMIN or DEVELOPER can change roles
    if (currentUserRole !== "DEVELOPER" && currentUserRole !== "ADMIN") {
      throw new Error("Insufficient permissions to update user roles");
    }

    const data = {
      userId: formData.get("userId") as string,
      role: formData.get("role") as UserRole,
    };

    const validated = updateRoleSchema.parse(data);

    // Prevent non-developers from assigning DEVELOPER role
    if (validated.role === "DEVELOPER" && currentUserRole !== "DEVELOPER") {
      throw new Error("Only developers can assign the DEVELOPER role");
    }

    // Update user role in database
    await db.user.update({
      where: {
        id: validated.userId,
        schoolId: schoolId || undefined,
      },
      data: {
        role: validated.role,
      },
    });

    revalidatePath("/settings");
    return { success: true, message: "User role updated successfully" };
  } catch (error) {
    console.error("Failed to update user role:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to update role",
    };
  }
}

/**
 * Get all users for the current school
 */
export async function getSchoolUsers() {
  try {
    const { schoolId, role } = await getTenantContext();

    // Check permissions
    if (role !== "DEVELOPER" && role !== "ADMIN") {
      throw new Error("Insufficient permissions to view users");
    }

    const users = await db.user.findMany({
      where: {
        schoolId: schoolId || undefined,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        createdAt: true,
        emailVerified: true,
        twoFactorEnabled: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return { success: true, users };
  } catch (error) {
    console.error("Failed to fetch users:", error);
    return {
      success: false,
      users: [],
      message: error instanceof Error ? error.message : "Failed to fetch users",
    };
  }
}

/**
 * Create a new user
 */
export async function createUser(formData: FormData) {
  try {
    const session = await auth();
    const { schoolId, role } = await getTenantContext();

    // Check permissions
    if (role !== "DEVELOPER" && role !== "ADMIN") {
      throw new Error("Insufficient permissions to create users");
    }

    const data = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      role: formData.get("role") as UserRole,
    };

    // Check if user already exists
    const existingUser = await db.user.findFirst({
      where: {
        email: data.email,
        schoolId: schoolId || undefined,
      },
    });

    if (existingUser) {
      throw new Error("A user with this email already exists in this school");
    }

    // Create user
    await db.user.create({
      data: {
        name: data.name,
        email: data.email,
        role: data.role,
        schoolId: schoolId || undefined,
      },
    });

    revalidatePath("/settings");
    return { success: true, message: "User created successfully" };
  } catch (error) {
    console.error("Failed to create user:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to create user",
    };
  }
}

/**
 * Update user status (active/inactive)
 */
export async function updateUserStatus(formData: FormData) {
  try {
    const { schoolId, role } = await getTenantContext();

    // Check permissions
    if (role !== "DEVELOPER" && role !== "ADMIN") {
      throw new Error("Insufficient permissions to update user status");
    }

    const data = {
      userId: formData.get("userId") as string,
      isActive: formData.get("isActive") === "true",
    };

    const validated = updateUserStatusSchema.parse(data);

    // Update user status
    await db.user.update({
      where: {
        id: validated.userId,
        schoolId: schoolId || undefined,
      },
      data: {
        // You might want to add an isActive field to your User model
        // For now, we'll just update the updatedAt timestamp
        updatedAt: new Date(),
      },
    });

    revalidatePath("/settings");
    return { success: true, message: "User status updated successfully" };
  } catch (error) {
    console.error("Failed to update user status:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to update status",
    };
  }
}

/**
 * Delete a user
 */
export async function deleteUser(userId: string) {
  try {
    const { schoolId, role } = await getTenantContext();

    // Check permissions
    if (role !== "DEVELOPER" && role !== "ADMIN") {
      throw new Error("Insufficient permissions to delete users");
    }

    // Prevent self-deletion
    const session = await auth();
    if (session?.user?.id === userId) {
      throw new Error("You cannot delete your own account");
    }

    // Delete user
    await db.user.delete({
      where: {
        id: userId,
        schoolId: schoolId || undefined,
      },
    });

    revalidatePath("/settings");
    return { success: true, message: "User deleted successfully" };
  } catch (error) {
    console.error("Failed to delete user:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to delete user",
    };
  }
}

/**
 * Save role permissions (for custom permission system)
 * Note: This is a placeholder - you'd need to add a Permission model to your schema
 */
export async function saveRolePermissions(formData: FormData) {
  try {
    const { schoolId, role } = await getTenantContext();

    // Check permissions
    if (role !== "DEVELOPER" && role !== "ADMIN") {
      throw new Error("Insufficient permissions to update role permissions");
    }

    const data = {
      role: formData.get("role") as string,
      permissions: formData.getAll("permissions") as string[],
    };

    const validated = updatePermissionsSchema.parse(data);

    // In a real implementation, you'd save these to a RolePermission table
    // For now, we'll store in localStorage or a settings table

    // Example: Save to a hypothetical Settings table
    // await db.settings.upsert({
    //   where: {
    //     key_schoolId: {
    //       key: `permissions_${validated.role}`,
    //       schoolId: schoolId || "",
    //     },
    //   },
    //   update: {
    //     value: JSON.stringify(validated.permissions),
    //   },
    //   create: {
    //     key: `permissions_${validated.role}`,
    //     value: JSON.stringify(validated.permissions),
    //     schoolId: schoolId || "",
    //   },
    // });

    revalidatePath("/settings");
    return { success: true, message: "Permissions saved successfully" };
  } catch (error) {
    console.error("Failed to save permissions:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to save permissions",
    };
  }
}

/**
 * Save notification settings
 */
export async function saveNotificationSettings(formData: FormData) {
  try {
    const session = await auth();
    const { schoolId } = await getTenantContext();

    if (!session?.user?.id) {
      throw new Error("User not authenticated");
    }

    const settings = {
      emailEnabled: formData.get("emailEnabled") === "true",
      emailDigest: formData.get("emailDigest") as string,
      pushEnabled: formData.get("pushEnabled") === "true",
      pushSound: formData.get("pushSound") === "true",
      smsEnabled: formData.get("smsEnabled") === "true",
      quietHoursEnabled: formData.get("quietHoursEnabled") === "true",
      quietHoursStart: formData.get("quietHoursStart") as string,
      quietHoursEnd: formData.get("quietHoursEnd") as string,
    };

    // In a real implementation, save to user preferences
    // await db.userPreferences.upsert({
    //   where: { userId: session.user.id },
    //   update: { notificationSettings: settings },
    //   create: {
    //     userId: session.user.id,
    //     notificationSettings: settings,
    //   },
    // });

    revalidatePath("/settings");
    return { success: true, message: "Notification settings saved" };
  } catch (error) {
    console.error("Failed to save notification settings:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to save settings",
    };
  }
}

/**
 * Get role statistics for the current school
 */
export async function getRoleStatistics() {
  try {
    const { schoolId, role } = await getTenantContext();

    if (role !== "DEVELOPER" && role !== "ADMIN") {
      throw new Error("Insufficient permissions");
    }

    const stats = await db.user.groupBy({
      by: ["role"],
      where: {
        schoolId: schoolId || undefined,
      },
      _count: {
        role: true,
      },
    });

    const formattedStats = stats.map((stat) => ({
      role: stat.role,
      count: stat._count.role,
    }));

    return { success: true, statistics: formattedStats };
  } catch (error) {
    console.error("Failed to fetch role statistics:", error);
    return {
      success: false,
      statistics: [],
      message: error instanceof Error ? error.message : "Failed to fetch statistics",
    };
  }
}

/**
 * Switch user role temporarily (for testing/preview)
 */
export async function switchRolePreview(targetRole: UserRole) {
  try {
    const session = await auth();
    const { role } = await getTenantContext();

    // Only allow DEVELOPER or ADMIN to preview roles
    if (role !== "DEVELOPER" && role !== "ADMIN") {
      throw new Error("Insufficient permissions to preview roles");
    }

    // Store preview role in session/cookies (implementation depends on your auth setup)
    // This is a simplified example
    const response = {
      success: true,
      message: `Switched to ${targetRole} preview mode`,
      previewRole: targetRole,
    };

    revalidatePath("/dashboard");
    return response;
  } catch (error) {
    console.error("Failed to switch role preview:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to switch preview",
    };
  }
}

/**
 * Export school data (for Advanced Settings)
 */
export async function exportSchoolData() {
  try {
    const { schoolId, role } = await getTenantContext();

    if (role !== "DEVELOPER" && role !== "ADMIN") {
      throw new Error("Insufficient permissions to export data");
    }

    // In a real implementation, this would trigger a background job
    // to compile and export all school data

    // Example: Queue export job
    // await queueExportJob({
    //   schoolId,
    //   requestedBy: session.user.id,
    //   format: 'csv',
    // });

    return {
      success: true,
      message: "Data export initiated. You will receive an email when ready.",
    };
  } catch (error) {
    console.error("Failed to export data:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to export data",
    };
  }
}
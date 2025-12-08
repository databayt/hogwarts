"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getTenantContext } from "@/lib/tenant-context";
import { teacherCreateSchema, teacherUpdateSchema, getTeachersSchema } from "@/components/platform/teachers/validation";
import { arrayToCSV } from "@/lib/csv-export";

// ============================================================================
// Types
// ============================================================================

export type ActionResponse<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

// ============================================================================
// Constants
// ============================================================================

const TEACHERS_PATH = "/teachers";

// ============================================================================
// Mutations
// ============================================================================

/**
 * Create a new teacher
 * @param input - Teacher data
 * @returns Action response with teacher ID
 */
export async function createTeacher(
  input: z.infer<typeof teacherCreateSchema>
): Promise<ActionResponse<{ id: string }>> {
  try {
    // Get tenant context
    const { schoolId } = await getTenantContext();
    if (!schoolId) {
      return { success: false, error: "Missing school context" };
    }

    // Parse and validate input
    const parsed = teacherCreateSchema.parse(input);

    // Create teacher
    const row = await (db as any).teacher.create({
      data: {
        schoolId,
        givenName: parsed.givenName,
        surname: parsed.surname,
        gender: parsed.gender,
        emailAddress: parsed.emailAddress,
      },
    });

    // Revalidate cache
    revalidatePath(TEACHERS_PATH);

    return { success: true, data: { id: row.id as string } };
  } catch (error) {
    console.error("[createTeacher] Error:", error, {
      input,
      timestamp: new Date().toISOString(),
    });

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.issues.map(e => e.message).join(", ")}`
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create teacher"
    };
  }
}

/**
 * Update an existing teacher
 * @param input - Teacher update data
 * @returns Action response
 */
export async function updateTeacher(
  input: z.infer<typeof teacherUpdateSchema>
): Promise<ActionResponse<void>> {
  try {
    // Get tenant context
    const { schoolId } = await getTenantContext();
    if (!schoolId) {
      return { success: false, error: "Missing school context" };
    }

    // Parse and validate input
    const parsed = teacherUpdateSchema.parse(input);
    const { id, ...rest } = parsed;

    // Build update data object
    const data: Record<string, unknown> = {};
    if (typeof rest.givenName !== "undefined") data.givenName = rest.givenName;
    if (typeof rest.surname !== "undefined") data.surname = rest.surname;
    if (typeof rest.gender !== "undefined") data.gender = rest.gender;
    if (typeof rest.emailAddress !== "undefined") data.emailAddress = rest.emailAddress;

    // Update teacher (using updateMany for tenant safety)
    await (db as any).teacher.updateMany({ where: { id, schoolId }, data });

    // Revalidate cache
    revalidatePath(TEACHERS_PATH);

    return { success: true, data: undefined };
  } catch (error) {
    console.error("[updateTeacher] Error:", error, {
      input,
      timestamp: new Date().toISOString(),
    });

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.issues.map(e => e.message).join(", ")}`
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update teacher"
    };
  }
}

/**
 * Delete a teacher
 * @param input - Teacher ID
 * @returns Action response
 */
export async function deleteTeacher(
  input: { id: string }
): Promise<ActionResponse<void>> {
  try {
    // Get tenant context
    const { schoolId } = await getTenantContext();
    if (!schoolId) {
      return { success: false, error: "Missing school context" };
    }

    // Parse and validate input
    const { id } = z.object({ id: z.string().min(1) }).parse(input);

    // Delete teacher (using deleteMany for tenant safety)
    await (db as any).teacher.deleteMany({ where: { id, schoolId } });

    // Revalidate cache
    revalidatePath(TEACHERS_PATH);

    return { success: true, data: undefined };
  } catch (error) {
    console.error("[deleteTeacher] Error:", error, {
      input,
      timestamp: new Date().toISOString(),
    });

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.issues.map(e => e.message).join(", ")}`
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete teacher"
    };
  }
}

// ============================================================================
// Queries
// ============================================================================

/**
 * Get a single teacher by ID
 * @param input - Teacher ID
 * @returns Action response with teacher data
 */
export async function getTeacher(
  input: { id: string }
): Promise<ActionResponse<Record<string, unknown> | null>> {
  try {
    // Get tenant context
    const { schoolId } = await getTenantContext();
    if (!schoolId) {
      return { success: false, error: "Missing school context" };
    }

    // Parse and validate input
    const { id } = z.object({ id: z.string().min(1) }).parse(input);

    // Check if teacher model exists
    if (!(db as any).teacher) {
      return { success: true, data: null };
    }

    // Fetch teacher
    const teacher = await (db as any).teacher.findFirst({
      where: { id, schoolId },
      select: {
        id: true,
        schoolId: true,
        givenName: true,
        surname: true,
        gender: true,
        emailAddress: true,
        userId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return { success: true, data: teacher as null | Record<string, unknown> };
  } catch (error) {
    console.error("[getTeacher] Error:", error, {
      input,
      timestamp: new Date().toISOString(),
    });

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.issues.map(e => e.message).join(", ")}`
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch teacher"
    };
  }
}

/**
 * Get teachers list with filtering and pagination
 * @param input - Query parameters
 * @returns Action response with teachers and total count
 */
export async function getTeachers(
  input: Partial<z.infer<typeof getTeachersSchema>>
): Promise<ActionResponse<{ rows: Array<{ id: string; name: string; emailAddress: string; status: string; createdAt: string }>; total: number }>> {
  try {
    // Get tenant context
    const { schoolId } = await getTenantContext();
    if (!schoolId) {
      return { success: false, error: "Missing school context" };
    }

    // Parse and validate input
    const sp = getTeachersSchema.parse(input ?? {});

    // Check if teacher model exists
    if (!(db as any).teacher) {
      return { success: true, data: { rows: [], total: 0 } };
    }

    // Build where clause
    const where: any = {
      schoolId,
      ...(sp.name
        ? {
            OR: [
              { givenName: { contains: sp.name, mode: "insensitive" } },
              { surname: { contains: sp.name, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(sp.emailAddress
        ? { emailAddress: { contains: sp.emailAddress, mode: "insensitive" } }
        : {}),
      ...(sp.status
        ? sp.status === "active"
          ? { NOT: { userId: null } }
          : sp.status === "inactive"
            ? { userId: null }
            : {}
          : {}),
    };

    // Build pagination
    const skip = (sp.page - 1) * sp.perPage;
    const take = sp.perPage;

    // Build order by clause
    const orderBy = sp.sort && Array.isArray(sp.sort) && sp.sort.length
      ? sp.sort.map((s) => ({ [s.id]: s.desc ? "desc" : "asc" }))
      : [{ createdAt: "desc" }];

    // Execute queries in parallel
    const [rows, count] = await Promise.all([
      (db as any).teacher.findMany({ where, orderBy, skip, take }),
      (db as any).teacher.count({ where }),
    ]);

    // Map results
    const mapped = (rows as Array<any>).map((t) => ({
      id: t.id as string,
      userId: t.userId as string | null,
      name: [t.givenName, t.surname].filter(Boolean).join(" "),
      emailAddress: t.emailAddress || "-",
      status: t.userId ? "active" : "inactive",
      createdAt: (t.createdAt as Date).toISOString(),
    }));

    return { success: true, data: { rows: mapped, total: count as number } };
  } catch (error) {
    console.error("[getTeachers] Error:", error, {
      input,
      timestamp: new Date().toISOString(),
    });

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.issues.map(e => e.message).join(", ")}`
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch teachers"
    };
  }
}

/**
 * Export teachers to CSV format
 * @param input - Query parameters
 * @returns CSV string
 */
export async function getTeachersCSV(
  input?: Partial<z.infer<typeof getTeachersSchema>>
): Promise<ActionResponse<string>> {
  try {
    // Get tenant context
    const { schoolId } = await getTenantContext();
    if (!schoolId) {
      return { success: false, error: "Missing school context" };
    }

    // Parse and validate input
    const sp = getTeachersSchema.parse(input ?? {});

    // Check if teacher model exists
    if (!(db as any).teacher) {
      return { success: true, data: "" };
    }

    // Build where clause with filters
    const where: any = {
      schoolId,
      ...(sp.name
        ? {
            OR: [
              { givenName: { contains: sp.name, mode: "insensitive" } },
              { surname: { contains: sp.name, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(sp.emailAddress
        ? { emailAddress: { contains: sp.emailAddress, mode: "insensitive" } }
        : {}),
      ...(sp.status
        ? sp.status === "active"
          ? { NOT: { userId: null } }
          : sp.status === "inactive"
            ? { userId: null }
            : {}
          : {}),
    };

    // Fetch ALL teachers matching filters (no pagination for export)
    const teachers = await (db as any).teacher.findMany({
      where,
      include: {
        user: {
          select: {
            email: true,
          },
        },
        teacherDepartments: {
          include: {
            department: {
              select: {
                departmentName: true,
              },
            },
          },
          take: 1, // Get primary department
        },
        teacherPhoneNumbers: {
          where: {
            isPrimary: true,
          },
          select: {
            phoneNumber: true,
          },
          take: 1,
        },
      },
      orderBy: [{ givenName: "asc" }, { surname: "asc" }],
    });

    // Transform data for CSV export
    const exportData = teachers.map((teacher: any) => ({
      teacherId: teacher.id,
      employeeId: teacher.employeeId || "",
      givenName: teacher.givenName || "",
      surname: teacher.surname || "",
      fullName: [teacher.givenName, teacher.surname].filter(Boolean).join(" "),
      gender: teacher.gender || "",
      email: teacher.emailAddress || "",
      userEmail: teacher.user?.email || "",
      phone:
        teacher.teacherPhoneNumbers && teacher.teacherPhoneNumbers.length > 0
          ? teacher.teacherPhoneNumbers[0].phoneNumber
          : "",
      department:
        teacher.teacherDepartments && teacher.teacherDepartments.length > 0
          ? teacher.teacherDepartments[0].department.departmentName
          : "",
      status: teacher.userId ? "Active" : "Inactive",
      createdAt: new Date(teacher.createdAt).toISOString().split("T")[0],
    }));

    // Define CSV columns
    const columns = [
      { key: "teacherId", label: "Teacher ID" },
      { key: "employeeId", label: "Employee ID" },
      { key: "givenName", label: "First Name" },
      { key: "surname", label: "Last Name" },
      { key: "fullName", label: "Full Name" },
      { key: "gender", label: "Gender" },
      { key: "email", label: "Primary Email" },
      { key: "userEmail", label: "User Account Email" },
      { key: "phone", label: "Phone" },
      { key: "department", label: "Department" },
      { key: "status", label: "Status" },
      { key: "createdAt", label: "Created Date" },
    ];

    const csv = arrayToCSV(exportData, { columns });
    return { success: true, data: csv };
  } catch (error) {
    console.error("[getTeachersCSV] Error:", error, {
      input,
      timestamp: new Date().toISOString(),
    });

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.issues.map(e => e.message).join(", ")}`
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to export teachers"
    };
  }
}

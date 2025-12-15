/**
 * Parents (Guardians) Server Actions Module
 *
 * RESPONSIBILITY: Guardian/parent lifecycle management - create, update, link to students, manage contact info
 *
 * WHAT IT HANDLES:
 * - Guardian records: Create, update, delete basic info (name, email, phone, relationship)
 * - Student linking: Create parent-child relationships (many-to-many)
 * - Contact management: Primary/secondary contact flags, emergency contact status
 * - Bulk operations: Export guardian lists, import guardian data
 * - Access delegation: Control what data guardians can view (their children only)
 * - Notification preferences: Email/SMS opt-in settings
 *
 * KEY ALGORITHMS:
 * 1. createGuardian(): Validates email uniqueness per school, phone normalization
 * 2. linkStudentToGuardian(): Creates many-to-many relationship with relationship type
 * 3. getGuardiansForStudent(): Returns all guardians linked to a student
 * 4. Email deduplication: UNIQUE constraint scoped by schoolId
 *
 * MULTI-TENANT SAFETY (CRITICAL):
 * - ALL guardian records must have schoolId
 * - Linking only possible between guardian and student in same school
 * - Email uniqueness constraint per school: @@unique([email, schoolId])
 * - Access control: Guardians see only their linked children (enforced in UI)
 * - Notifications filtered by school when guardian has children in multiple schools
 *
 * GOTCHAS & NON-OBVIOUS BEHAVIOR:
 * 1. One guardian can be linked to multiple students (parent with multiple children)
 * 2. One student can have multiple guardians (shared custody, multiple parents)
 * 3. Relationship type tracks role (Mother, Father, Guardian, etc.) - important for context
 * 4. Email may belong to guardian in multiple schools (per-school uniqueness)
 * 5. Deleting guardian doesn't delete student - just breaks relationship
 *
 * GUARDIAN TYPES:
 * - Relationship enum: MOTHER, FATHER, GUARDIAN, AUNT, UNCLE, GRANDPARENT, etc.
 * - Used for: Proper address, role clarity, emergency contact priority
 * - Consider: Add custom relationship type option
 *
 * CONTACT PREFERENCES:
 * - emailVerified: Boolean flag (initially false, confirmed via email link)
 * - receiveNotifications: Opt-in for announcements, grades, attendance
 * - receiveEmergencyAlerts: Always on (cannot opt-out for safety)
 * - Phone number: Optional, normalized format (remove spaces/dashes)
 *
 * PERFORMANCE NOTES:
 * - getGuardiansForStudent(): Uses include (eager load) - O(1) per student
 * - Email lookup can be bottleneck - ensure index on (schoolId, email)
 * - Bulk export loads all guardians - streaming recommended for 10K+ records
 * - Student-guardian queries use joins - monitor for N+1 if accessed frequently
 *
 * PERMISSION NOTES:
 * - Guardians can view own profile and linked children
 * - Teachers can view guardians of students in their classes
 * - School admin can view all guardians
 * - Platform admin can view across schools (with override)
 * - Guardians cannot modify other guardian records
 *
 * FUTURE IMPROVEMENTS:
 * - Add guardian photo/profile image support
 * - Implement email verification workflow (confirmation link)
 * - Add SMS notification support (phone number validation)
 * - Support multiple email addresses per guardian
 * - Add guardian organization (private, state, etc.)
 * - Implement custody/access restrictions (e.g., father can't pick up child)
 * - Add occupational information (employer, job title)
 * - Support secondary emergency contacts (not parent)
 * - Implement guardian access logs (track guardian logins, views)
 * - Add two-factor authentication for guardian accounts
 * - Support bulk guardian import/export from CSV
 */

"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getTenantContext } from "@/lib/tenant-context";
import {
  parentCreateSchema,
  parentUpdateSchema,
  getParentsSchema,
  linkGuardianSchema,
  createGuardianAndLinkSchema,
  updateGuardianLinkSchema,
  unlinkGuardianSchema,
} from "@/components/platform/parents/validation";

// ============================================================================
// Types
// ============================================================================

export type ActionResponse<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

type ParentSelectResult = {
  id: string;
  schoolId: string;
  givenName: string;
  surname: string;
  emailAddress: string | null;
  teacherId: string | null;
  userId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type ParentListResult = {
  id: string;
  userId: string | null;
  name: string;
  emailAddress: string;
  status: string;
  createdAt: string;
};

// ============================================================================
// Constants
// ============================================================================

const PARENTS_PATH = "/parents";

// ============================================================================
// Mutations
// ============================================================================

/**
 * Create a new parent
 * @param input - Parent data
 * @returns Action response with parent ID
 */
export async function createParent(
  input: z.infer<typeof parentCreateSchema>
): Promise<ActionResponse<{ id: string }>> {
  try {
    // Get tenant context
    const { schoolId } = await getTenantContext();
    if (!schoolId) {
      return { success: false, error: "Missing school context" };
    }

    // Parse and validate input
    const parsed = parentCreateSchema.parse(input);

    // Create parent
    const row = await (db as any).guardian.create({
      data: {
        schoolId,
        givenName: parsed.givenName,
        surname: parsed.surname,
        emailAddress: parsed.emailAddress || null,
        userId: parsed.userId || null,
      },
    });

    // Revalidate cache
    revalidatePath(PARENTS_PATH);

    return { success: true, data: { id: row.id } };
  } catch (error) {
    console.error("[createParent] Error:", error, {
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
      error: error instanceof Error ? error.message : "Failed to create parent"
    };
  }
}

/**
 * Update an existing parent
 * @param input - Parent update data
 * @returns Action response
 */
export async function updateParent(
  input: z.infer<typeof parentUpdateSchema>
): Promise<ActionResponse<void>> {
  try {
    // Get tenant context
    const { schoolId } = await getTenantContext();
    if (!schoolId) {
      return { success: false, error: "Missing school context" };
    }

    // Parse and validate input
    const parsed = parentUpdateSchema.parse(input);
    const { id, ...rest } = parsed;

    // Build update data object
    const data: Record<string, unknown> = {};
    if (typeof rest.givenName !== "undefined") data.givenName = rest.givenName;
    if (typeof rest.surname !== "undefined") data.surname = rest.surname;
    if (typeof rest.emailAddress !== "undefined") data.emailAddress = rest.emailAddress || null;
    if (typeof rest.userId !== "undefined") data.userId = rest.userId || null;

    // Update parent (using updateMany for tenant safety)
    await (db as any).guardian.updateMany({
      where: { id, schoolId },
      data
    });

    // Revalidate cache
    revalidatePath(PARENTS_PATH);

    return { success: true, data: undefined };
  } catch (error) {
    console.error("[updateParent] Error:", error, {
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
      error: error instanceof Error ? error.message : "Failed to update parent"
    };
  }
}

/**
 * Delete a parent
 * @param input - Parent ID
 * @returns Action response
 */
export async function deleteParent(
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

    // Delete parent (using deleteMany for tenant safety)
    await (db as any).guardian.deleteMany({
      where: { id, schoolId }
    });

    // Revalidate cache
    revalidatePath(PARENTS_PATH);

    return { success: true, data: undefined };
  } catch (error) {
    console.error("[deleteParent] Error:", error, {
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
      error: error instanceof Error ? error.message : "Failed to delete parent"
    };
  }
}

// ============================================================================
// Queries
// ============================================================================

/**
 * Get a single parent by ID
 * @param input - Parent ID
 * @returns Action response with parent data
 */
export async function getParent(
  input: { id: string }
): Promise<ActionResponse<ParentSelectResult | null>> {
  try {
    // Get tenant context
    const { schoolId } = await getTenantContext();
    if (!schoolId) {
      return { success: false, error: "Missing school context" };
    }

    // Parse and validate input
    const { id } = z.object({ id: z.string().min(1) }).parse(input);

    // Check if guardian model exists
    if (!(db as any).guardian) {
      return { success: true, data: null };
    }

    // Fetch parent
    const parent = await (db as any).guardian.findFirst({
      where: { id, schoolId },
      select: {
        id: true,
        schoolId: true,
        givenName: true,
        surname: true,
        emailAddress: true,
        teacherId: true,
        userId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return { success: true, data: parent };
  } catch (error) {
    console.error("[getParent] Error:", error, {
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
      error: error instanceof Error ? error.message : "Failed to fetch parent"
    };
  }
}

/**
 * Get parents list with filtering and pagination
 * @param input - Query parameters
 * @returns Action response with parents and total count
 */
export async function getParents(
  input: Partial<z.infer<typeof getParentsSchema>>
): Promise<ActionResponse<{ rows: ParentListResult[]; total: number }>> {
  try {
    // Get tenant context
    const { schoolId } = await getTenantContext();
    if (!schoolId) {
      return { success: false, error: "Missing school context" };
    }

    // Parse and validate input
    const sp = getParentsSchema.parse(input ?? {});

    // Check if guardian model exists
    if (!(db as any).guardian) {
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
      (db as any).guardian.findMany({ where, orderBy, skip, take }),
      (db as any).guardian.count({ where }),
    ]);

    // Map results
    const mapped: ParentListResult[] = (rows as Array<any>).map((p) => ({
      id: p.id as string,
      userId: p.userId as string | null,
      name: [p.givenName, p.surname].filter(Boolean).join(" "),
      emailAddress: p.emailAddress || "-",
      status: p.userId ? "active" : "inactive",
      createdAt: (p.createdAt as Date).toISOString(),
    }));

    return { success: true, data: { rows: mapped, total: count } };
  } catch (error) {
    console.error("[getParents] Error:", error, {
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
      error: error instanceof Error ? error.message : "Failed to fetch parents"
    };
  }
}

/**
 * Export parents to CSV format
 * @param input - Query parameters
 * @returns CSV string
 */
export async function getParentsCSV(
  input?: Partial<z.infer<typeof getParentsSchema>>
): Promise<ActionResponse<string>> {
  try {
    // Get tenant context
    const { schoolId } = await getTenantContext();
    if (!schoolId) {
      return { success: false, error: "Missing school context" };
    }

    // Parse and validate input
    const sp = getParentsSchema.parse(input ?? {});

    // Check if guardian model exists
    if (!(db as any).guardian) {
      return { success: true, data: "" };
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
      ...(sp.status
        ? sp.status === "active"
          ? { NOT: { userId: null } }
          : sp.status === "inactive"
            ? { userId: null }
            : {}
          : {}),
    };

    // Fetch all parents matching criteria
    const parents = await (db as any).guardian.findMany({
      where,
      orderBy: [{ createdAt: "desc" }],
    });

    // Generate CSV
    const headers = ["ID", "Given Name", "Surname", "Email", "Status", "Created"];
    const csvRows = (parents as Array<any>).map((p) =>
      [
        p.id,
        `"${(p.givenName || "").replace(/"/g, '""')}"`,
        `"${(p.surname || "").replace(/"/g, '""')}"`,
        `"${(p.emailAddress || "").replace(/"/g, '""')}"`,
        p.userId ? "Active" : "Inactive",
        new Date(p.createdAt).toISOString().split("T")[0],
      ].join(",")
    );

    const csv = [headers.join(","), ...csvRows].join("\n");

    return { success: true, data: csv };
  } catch (error) {
    console.error("[getParentsCSV] Error:", error, {
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
      error: error instanceof Error ? error.message : "Failed to generate CSV"
    };
  }
}

// ============================================================================
// Guardian Linking (StudentGuardian relationship management)
// ============================================================================

/**
 * Helper to get or create guardian type
 */
async function getOrCreateGuardianType(schoolId: string, typeName: string) {
  let guardianType = await (db as any).guardianType.findFirst({
    where: { schoolId, name: typeName },
  });

  if (!guardianType) {
    guardianType = await (db as any).guardianType.create({
      data: { schoolId, name: typeName },
    });
  }

  return guardianType;
}

/**
 * Link an existing guardian to a student
 */
export async function linkGuardian(
  input: z.infer<typeof linkGuardianSchema>
): Promise<ActionResponse<{ id: string }>> {
  try {
    const { schoolId } = await getTenantContext();
    if (!schoolId) {
      return { success: false, error: "Missing school context" };
    }

    const parsed = linkGuardianSchema.parse(input);

    // Verify guardian exists in this school
    const guardian = await (db as any).guardian.findFirst({
      where: { id: parsed.guardianId, schoolId },
    });

    if (!guardian) {
      return { success: false, error: "Guardian not found" };
    }

    // Verify student exists in this school
    const student = await (db as any).student.findFirst({
      where: { id: parsed.studentId, schoolId },
    });

    if (!student) {
      return { success: false, error: "Student not found" };
    }

    // Check if relationship already exists
    const existing = await (db as any).studentGuardian.findFirst({
      where: {
        schoolId,
        studentId: parsed.studentId,
        guardianId: parsed.guardianId,
      },
    });

    if (existing) {
      return { success: false, error: "Guardian is already linked to this student" };
    }

    // If setting as primary, unset other primaries
    if (parsed.isPrimary) {
      await (db as any).studentGuardian.updateMany({
        where: { schoolId, studentId: parsed.studentId, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    // Create the relationship
    const studentGuardian = await (db as any).studentGuardian.create({
      data: {
        schoolId,
        studentId: parsed.studentId,
        guardianId: parsed.guardianId,
        guardianTypeId: parsed.guardianTypeId,
        isPrimary: parsed.isPrimary,
        occupation: parsed.occupation || null,
        workplace: parsed.workplace || null,
        notes: parsed.notes || null,
      },
    });

    revalidatePath(`/students/${parsed.studentId}`);

    return { success: true, data: { id: studentGuardian.id } };
  } catch (error) {
    console.error("[linkGuardian] Error:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.issues.map(e => e.message).join(", ")}`,
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to link guardian",
    };
  }
}

/**
 * Create a new guardian and link to student in one operation
 */
export async function createGuardianAndLink(
  input: z.infer<typeof createGuardianAndLinkSchema>
): Promise<ActionResponse<{ guardianId: string; studentGuardianId: string }>> {
  try {
    const { schoolId } = await getTenantContext();
    if (!schoolId) {
      return { success: false, error: "Missing school context" };
    }

    const parsed = createGuardianAndLinkSchema.parse(input);

    // Verify student exists
    const student = await (db as any).student.findFirst({
      where: { id: parsed.studentId, schoolId },
    });

    if (!student) {
      return { success: false, error: "Student not found" };
    }

    // Get or create guardian type
    const guardianType = await getOrCreateGuardianType(schoolId, parsed.guardianType);

    // Check if guardian already exists by email (if provided)
    let guardian = null;
    if (parsed.emailAddress) {
      guardian = await (db as any).guardian.findFirst({
        where: { schoolId, emailAddress: parsed.emailAddress },
      });
    }

    // Create guardian if not found
    if (!guardian) {
      guardian = await (db as any).guardian.create({
        data: {
          schoolId,
          givenName: parsed.givenName,
          surname: parsed.surname,
          emailAddress: parsed.emailAddress || null,
        },
      });

      // Add phone number if provided
      if (parsed.phoneNumber) {
        await (db as any).guardianPhoneNumber.create({
          data: {
            schoolId,
            guardianId: guardian.id,
            phoneNumber: parsed.phoneNumber,
            phoneType: "mobile",
            isPrimary: true,
          },
        });
      }
    }

    // Check if relationship already exists
    const existingLink = await (db as any).studentGuardian.findFirst({
      where: {
        schoolId,
        studentId: parsed.studentId,
        guardianId: guardian.id,
      },
    });

    if (existingLink) {
      return { success: false, error: "Guardian is already linked to this student" };
    }

    // If setting as primary, unset other primaries
    if (parsed.isPrimary) {
      await (db as any).studentGuardian.updateMany({
        where: { schoolId, studentId: parsed.studentId, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    // Create the relationship
    const studentGuardian = await (db as any).studentGuardian.create({
      data: {
        schoolId,
        studentId: parsed.studentId,
        guardianId: guardian.id,
        guardianTypeId: guardianType.id,
        isPrimary: parsed.isPrimary,
        occupation: parsed.occupation || null,
        workplace: parsed.workplace || null,
        notes: parsed.notes || null,
      },
    });

    revalidatePath(`/students/${parsed.studentId}`);

    return {
      success: true,
      data: {
        guardianId: guardian.id,
        studentGuardianId: studentGuardian.id,
      },
    };
  } catch (error) {
    console.error("[createGuardianAndLink] Error:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.issues.map(e => e.message).join(", ")}`,
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create and link guardian",
    };
  }
}

/**
 * Update a guardian-student relationship
 */
export async function updateGuardianLink(
  input: z.infer<typeof updateGuardianLinkSchema>
): Promise<ActionResponse<void>> {
  try {
    const { schoolId } = await getTenantContext();
    if (!schoolId) {
      return { success: false, error: "Missing school context" };
    }

    const parsed = updateGuardianLinkSchema.parse(input);

    // Verify relationship exists
    const existing = await (db as any).studentGuardian.findFirst({
      where: { id: parsed.studentGuardianId, schoolId },
    });

    if (!existing) {
      return { success: false, error: "Guardian relationship not found" };
    }

    // If setting as primary, unset other primaries
    if (parsed.isPrimary) {
      await (db as any).studentGuardian.updateMany({
        where: {
          schoolId,
          studentId: existing.studentId,
          isPrimary: true,
          NOT: { id: parsed.studentGuardianId },
        },
        data: { isPrimary: false },
      });
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (typeof parsed.guardianTypeId !== "undefined") updateData.guardianTypeId = parsed.guardianTypeId;
    if (typeof parsed.isPrimary !== "undefined") updateData.isPrimary = parsed.isPrimary;
    if (typeof parsed.occupation !== "undefined") updateData.occupation = parsed.occupation || null;
    if (typeof parsed.workplace !== "undefined") updateData.workplace = parsed.workplace || null;
    if (typeof parsed.notes !== "undefined") updateData.notes = parsed.notes || null;

    await (db as any).studentGuardian.update({
      where: { id: parsed.studentGuardianId },
      data: updateData,
    });

    revalidatePath(`/students/${existing.studentId}`);

    return { success: true, data: undefined };
  } catch (error) {
    console.error("[updateGuardianLink] Error:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.issues.map(e => e.message).join(", ")}`,
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update guardian link",
    };
  }
}

/**
 * Remove a guardian-student relationship
 */
export async function unlinkGuardian(
  input: z.infer<typeof unlinkGuardianSchema>
): Promise<ActionResponse<void>> {
  try {
    const { schoolId } = await getTenantContext();
    if (!schoolId) {
      return { success: false, error: "Missing school context" };
    }

    const parsed = unlinkGuardianSchema.parse(input);

    // Verify relationship exists and get student ID for revalidation
    const existing = await (db as any).studentGuardian.findFirst({
      where: { id: parsed.studentGuardianId, schoolId },
    });

    if (!existing) {
      return { success: false, error: "Guardian relationship not found" };
    }

    // Delete the relationship
    await (db as any).studentGuardian.delete({
      where: { id: parsed.studentGuardianId },
    });

    revalidatePath(`/students/${existing.studentId}`);

    return { success: true, data: undefined };
  } catch (error) {
    console.error("[unlinkGuardian] Error:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.issues.map(e => e.message).join(", ")}`,
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to unlink guardian",
    };
  }
}

/**
 * Get guardian types for a school
 */
export async function getGuardianTypes(): Promise<ActionResponse<Array<{ id: string; name: string }>>> {
  try {
    const { schoolId } = await getTenantContext();
    if (!schoolId) {
      return { success: false, error: "Missing school context" };
    }

    const types = await (db as any).guardianType.findMany({
      where: { schoolId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });

    // If no types exist, create default ones
    if (types.length === 0) {
      const defaultTypes = ["father", "mother", "guardian", "other"];
      for (const typeName of defaultTypes) {
        await (db as any).guardianType.create({
          data: { schoolId, name: typeName },
        });
      }

      const newTypes = await (db as any).guardianType.findMany({
        where: { schoolId },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      });

      return { success: true, data: newTypes };
    }

    return { success: true, data: types };
  } catch (error) {
    console.error("[getGuardianTypes] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch guardian types",
    };
  }
}

/**
 * Search for existing guardians to link
 */
export async function searchGuardians(
  query: string
): Promise<ActionResponse<Array<{
  id: string;
  givenName: string;
  surname: string;
  emailAddress: string | null;
  phoneNumber: string | null;
}>>> {
  try {
    const { schoolId } = await getTenantContext();
    if (!schoolId) {
      return { success: false, error: "Missing school context" };
    }

    if (!query || query.length < 2) {
      return { success: true, data: [] };
    }

    const guardians = await (db as any).guardian.findMany({
      where: {
        schoolId,
        OR: [
          { givenName: { contains: query, mode: "insensitive" } },
          { surname: { contains: query, mode: "insensitive" } },
          { emailAddress: { contains: query, mode: "insensitive" } },
        ],
      },
      include: {
        phoneNumbers: {
          where: { isPrimary: true },
          take: 1,
        },
      },
      take: 10,
    });

    const mapped = guardians.map((g: any) => ({
      id: g.id,
      givenName: g.givenName,
      surname: g.surname,
      emailAddress: g.emailAddress,
      phoneNumber: g.phoneNumbers?.[0]?.phoneNumber || null,
    }));

    return { success: true, data: mapped };
  } catch (error) {
    console.error("[searchGuardians] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to search guardians",
    };
  }
}

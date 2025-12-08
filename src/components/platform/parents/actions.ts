"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getTenantContext } from "@/lib/tenant-context";
import { parentCreateSchema, parentUpdateSchema, getParentsSchema } from "@/components/platform/parents/validation";

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

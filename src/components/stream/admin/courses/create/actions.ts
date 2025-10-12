"use server";

import { auth } from "@/auth";
import { getTenantContext } from "@/lib/tenant-context";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { revalidatePath } from "next/cache";
import slugify from "slugify";
import type { CreateCourseData } from "../../../types";

export async function createCourseAction(
  subdomain: string,
  formData: FormData
) {
  const session = await auth();
  const { schoolId } = await getTenantContext();

  // Check authentication
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  // Check admin/teacher access
  if (
    session.user.role !== "ADMIN" &&
    session.user.role !== "TEACHER" &&
    session.user.role !== "DEVELOPER"
  ) {
    throw new Error("Insufficient permissions");
  }

  // Check school context
  if (!schoolId) {
    throw new Error("School context required");
  }

  try {
    // Parse form data
    const title = formData.get("title") as string;
    const description = formData.get("description") as string | null;
    const categoryId = formData.get("categoryId") as string | null;
    const price = formData.get("price") ? parseFloat(formData.get("price") as string) : null;

    // Validate required fields
    if (!title || title.trim().length === 0) {
      throw new Error("Course title is required");
    }

    // Generate slug
    const baseSlug = slugify(title, { lower: true, strict: true });

    // Check for existing slug in the same school
    let slug = baseSlug;
    let counter = 1;
    while (await db.streamCourse.findFirst({
      where: {
        slug,
        schoolId
      }
    })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Create Stripe product if price is set
    let stripePriceId: string | null = null;
    if (price && price > 0) {
      const stripeProduct = await stripe.products.create({
        name: title,
        description: description || undefined,
        metadata: {
          schoolId,
          userId: session.user.id,
        },
        default_price_data: {
          currency: "usd",
          unit_amount: Math.round(price * 100), // Convert to cents
        },
      });

      stripePriceId = stripeProduct.default_price as string;
    }

    // Create course in database
    const course = await db.streamCourse.create({
      data: {
        title,
        slug,
        description,
        categoryId,
        price,
        userId: session.user.id,
        schoolId,
        isPublished: false, // Courses start as draft
      },
    });

    // Revalidate paths
    revalidatePath(`/[lang]/s/[subdomain]/stream/admin/courses`);

    // Redirect to edit page
    return {
      success: true,
      courseId: course.id,
      slug: course.slug,
    };
  } catch (error) {
    console.error("Failed to create course:", error);
    throw error instanceof Error ? error : new Error("Failed to create course");
  }
}

export async function createCategoryAction(
  subdomain: string,
  name: string
) {
  const session = await auth();
  const { schoolId } = await getTenantContext();

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  if (
    session.user.role !== "ADMIN" &&
    session.user.role !== "DEVELOPER"
  ) {
    throw new Error("Only administrators can create categories");
  }

  if (!schoolId) {
    throw new Error("School context required");
  }

  try {
    // Check if category already exists
    const existing = await db.streamCategory.findFirst({
      where: {
        name,
        schoolId
      }
    });

    if (existing) {
      throw new Error("Category already exists");
    }

    const category = await db.streamCategory.create({
      data: {
        name,
        schoolId,
      },
    });

    revalidatePath(`/[lang]/s/[subdomain]/stream/admin/courses/create`);

    return {
      success: true,
      category,
    };
  } catch (error) {
    console.error("Failed to create category:", error);
    throw error instanceof Error ? error : new Error("Failed to create category");
  }
}
"use server";

import prisma from "@/components/kwizi/shared/db";

export async function getCategoriesAction() {
  try {
    // Get all categories
    const categories = await prisma.category.findMany({});

    return { success: true, data: categories };
  } catch (error) {
    console.log("There was an error getting Categories: ", error);
    return {
      success: false,
      error: "There was an error getting Categories",
    };
  }
}

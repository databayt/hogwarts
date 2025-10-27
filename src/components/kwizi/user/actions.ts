"use server";

import prisma from "@/components/kwizi/shared/db";
import { auth } from "@clerk/nextjs/server";

export async function getUserDataAction() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const user = await prisma.user.findUnique({
      where: {
        clerkId: userId,
      },
      include: {
        categoryStats: {
          include: {
            category: true,
          },
        },
      },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    return { success: true, data: user };
  } catch (error) {
    console.log("Error getting user data:", error);
    return { success: false, error: "Error getting user data" };
  }
}

export async function registerUserAction() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: {
        clerkId: userId,
      },
    });

    if (existingUser) {
      return { success: true, data: existingUser };
    }

    // Create new user
    const newUser = await prisma.user.create({
      data: {
        clerkId: userId,
      },
    });

    return { success: true, data: newUser };
  } catch (error) {
    console.log("Error registering user:", error);
    return { success: false, error: "Error registering user" };
  }
}

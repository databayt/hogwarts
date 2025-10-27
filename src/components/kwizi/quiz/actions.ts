"use server";

import prisma from "@/components/kwizi/shared/db";
import { auth } from "@clerk/nextjs/server";

export async function startQuizAction(categoryId: string) {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    const userId = user.id;

    // find or create a categoryStat entry

    let stat = await prisma.categoryStat.findUnique({
      where: {
        userId_categoryId: {
          categoryId,
          userId,
        },
      },
    });

    if (!stat) {
      stat = await prisma.categoryStat.create({
        data: {
          userId,
          categoryId,
          attempts: 1,
          lastAttempt: new Date(),
        },
      });
    } else {
      await prisma.categoryStat.update({
        where: {
          userId_categoryId: {
            userId,
            categoryId,
          },
        },
        data: {
          attempts: stat.attempts + 1,
          lastAttempt: new Date(),
        },
      });
    }

    return { success: true, data: stat };
  } catch (error) {
    console.log("Error starting quiz: ", error);
    return { success: false, error: "Error starting quiz" };
  }
}

export async function finishQuizAction(data: {
  categoryId: string;
  quizId: string;
  score: number;
  responses: any[];
}) {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return { success: false, error: "Unauthorized" };
    }

    const { categoryId, quizId, score, responses } = data;

    // validate the fields
    if (
      !categoryId ||
      !quizId ||
      typeof score !== "number" ||
      !Array.isArray(responses)
    ) {
      return { success: false, error: "Invalid request" };
    }

    const user = await prisma.user.findUnique({ where: { clerkId } });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    // fetch or create a categoryStat entry
    let stat = await prisma.categoryStat.findUnique({
      where: {
        userId_categoryId: {
          userId: user.id,
          categoryId,
        },
      },
    });

    if (stat) {
      // calculate the average score
      const totalScore = (stat.averageScore || 0) * stat.completed + score;
      const newAverageScore = totalScore / (stat.completed + 1);

      // update the categoryStat entry
      stat = await prisma.categoryStat.update({
        where: { id: stat.id },
        data: {
          completed: stat.completed + 1,
          averageScore: newAverageScore,
          lastAttempt: new Date(),
        },
      });
    } else {
      // create a new categoryStat entry
      stat = await prisma.categoryStat.create({
        data: {
          userId: user.id,
          categoryId,
          attempts: 1,
          completed: 1,
          averageScore: score,
          lastAttempt: new Date(),
        },
      });
    }

    return { success: true, data: stat };
  } catch (error) {
    console.log("Error finishing quiz: ", error);
    return { success: false, error: "Error finishing quiz" };
  }
}

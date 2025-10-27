"use server";

import { prisma } from "@/components/quiz/lib/db";
import { getAuthSession } from "@/components/quiz/lib/auth";

export async function getGameHistory(limit: number = 10, offset: number = 0) {
  const session = await getAuthSession();
  if (!session?.user) {
    return [];
  }

  const games = await prisma.game.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: {
      timeStarted: "desc",
    },
    take: limit,
    skip: offset,
    include: {
      questions: true,
    },
  });

  return games;
}

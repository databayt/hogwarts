"use server";

import { prisma } from "@/components/quiz/lib/db";
import { getAuthSession } from "@/components/quiz/lib/auth";

export async function getRecentGames(limit: number = 10) {
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
  });

  return games;
}

export async function getHotTopics(limit: number = 10) {
  const hotTopics = await prisma.topic_count.findMany({
    orderBy: {
      count: "desc",
    },
    take: limit,
  });

  return hotTopics;
}

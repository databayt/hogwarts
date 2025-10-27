"use server";

import { prisma } from "@/components/quiz/lib/db";
import { getAuthSession } from "@/components/quiz/lib/auth";

export async function getGameStatistics(gameId: string) {
  const session = await getAuthSession();
  if (!session?.user) {
    throw new Error("You must be logged in.");
  }

  const game = await prisma.game.findUnique({
    where: {
      id: gameId,
    },
    include: {
      questions: true,
    },
  });

  if (!game) {
    throw new Error("Game not found");
  }

  // Verify the game belongs to the user
  if (game.userId !== session.user.id) {
    throw new Error("Unauthorized");
  }

  return game;
}

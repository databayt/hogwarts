"use server";

import { prisma } from "@/components/quiz/lib/db";
import { checkAnswerSchema, endGameSchema } from "@/components/quiz/validation/questions";
import { z } from "zod";
import stringSimilarity from "string-similarity";

export async function checkAnswer(
  data: z.infer<typeof checkAnswerSchema>
) {
  const { questionId, userInput } = checkAnswerSchema.parse(data);

  const question = await prisma.question.findUnique({
    where: { id: questionId },
  });

  if (!question) {
    throw new Error("Question not found");
  }

  await prisma.question.update({
    where: { id: questionId },
    data: { userAnswer: userInput },
  });

  if (question.questionType === "mcq") {
    const isCorrect =
      question.answer.toLowerCase().trim() === userInput.toLowerCase().trim();
    await prisma.question.update({
      where: { id: questionId },
      data: { isCorrect },
    });
    return { isCorrect };
  } else if (question.questionType === "open_ended") {
    let percentageSimilar = stringSimilarity.compareTwoStrings(
      question.answer.toLowerCase().trim(),
      userInput.toLowerCase().trim()
    );
    percentageSimilar = Math.round(percentageSimilar * 100);
    await prisma.question.update({
      where: { id: questionId },
      data: { percentageCorrect: percentageSimilar },
    });
    return { percentageSimilar };
  }

  throw new Error("Invalid question type");
}

export async function endGame(data: z.infer<typeof endGameSchema>) {
  const { gameId } = endGameSchema.parse(data);

  const game = await prisma.game.findUnique({
    where: {
      id: gameId,
    },
  });

  if (!game) {
    throw new Error("Game not found");
  }

  await prisma.game.update({
    where: {
      id: gameId,
    },
    data: {
      timeEnded: new Date(),
    },
  });

  return { message: "Game ended" };
}

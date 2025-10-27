"use server";

import { prisma } from "@/components/quiz/lib/db";
import { getAuthSession } from "@/components/quiz/lib/auth";
import { strict_output } from "@/components/quiz/lib/ai";
import { quizCreationSchema, getQuestionsSchema } from "./validation";
import { z } from "zod";
import { redirect } from "next/navigation";

export async function createGame(data: z.infer<typeof quizCreationSchema>) {
  const session = await getAuthSession();
  if (!session?.user) {
    throw new Error("You must be logged in to create a game.");
  }

  const { topic, type, amount } = quizCreationSchema.parse(data);

  const game = await prisma.game.create({
    data: {
      gameType: type,
      timeStarted: new Date(),
      userId: session.user.id,
      topic,
    },
  });

  await prisma.topic_count.upsert({
    where: {
      topic,
    },
    create: {
      topic,
      count: 1,
    },
    update: {
      count: {
        increment: 1,
      },
    },
  });

  // Generate questions
  const questions = await generateQuestions({ amount, topic, type });

  if (type === "mcq") {
    type mcqQuestion = {
      question: string;
      answer: string;
      option1: string;
      option2: string;
      option3: string;
    };

    const manyData = questions.map((question: mcqQuestion) => {
      // mix up the options
      const options = [
        question.option1,
        question.option2,
        question.option3,
        question.answer,
      ].sort(() => Math.random() - 0.5);
      return {
        question: question.question,
        answer: question.answer,
        options: JSON.stringify(options),
        gameId: game.id,
        questionType: "mcq" as const,
      };
    });

    await prisma.question.createMany({
      data: manyData,
    });
  } else if (type === "open_ended") {
    type openQuestion = {
      question: string;
      answer: string;
    };
    await prisma.question.createMany({
      data: questions.map((question: openQuestion) => {
        return {
          question: question.question,
          answer: question.answer,
          gameId: game.id,
          questionType: "open_ended" as const,
        };
      }),
    });
  }

  return { gameId: game.id };
}

export async function generateQuestions(
  data: z.infer<typeof getQuestionsSchema>
) {
  const { amount, topic, type } = getQuestionsSchema.parse(data);
  let questions: any;

  if (type === "open_ended") {
    questions = await strict_output(
      "You are a helpful AI that is able to generate a pair of question and answers, the length of each answer should not be more than 15 words, store all the pairs of answers and questions in a JSON array",
      new Array(amount).fill(
        `You are to generate a random hard open-ended questions about ${topic}`
      ),
      {
        question: "question",
        answer: "answer with max length of 15 words",
      }
    );
  } else if (type === "mcq") {
    questions = await strict_output(
      "You are a helpful AI that is able to generate mcq questions and answers, the length of each answer should not be more than 15 words, store all answers and questions and options in a JSON array",
      new Array(amount).fill(
        `You are to generate a random hard mcq question about ${topic}`
      ),
      {
        question: "question",
        answer: "answer with max length of 15 words",
        option1: "option1 with max length of 15 words",
        option2: "option2 with max length of 15 words",
        option3: "option3 with max length of 15 words",
      }
    );
  }

  return questions;
}

export async function getGame(gameId: string) {
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
    throw new Error("Game not found.");
  }

  return game;
}

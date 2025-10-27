import QuestionsContent from "@/components/quiz-app/questions/content";
import { categoryOptions, difficultyOptions } from "@/components/quiz-app/config";
import type { Locale } from "@/components/internationalization/config";
import { redirect } from "next/navigation";
import type { Question } from "@/components/quiz-app/types";

export const fetchCache = "force-no-store";

async function getData(category: string, difficulty: string, limit: string): Promise<Question[]> {
  const res = await fetch(
    `https://the-trivia-api.com/api/questions?categories=${category}&limit=${limit}&type=multiple&difficulty=${difficulty}`,
    {
      method: "GET",
      headers: {
        "Cache-Control": "no-cache",
      },
    }
  );

  if (!res.ok) {
    throw new Error("Failed to fetch data!");
  }

  return res.json();
}

const validateCategory = (category: string) => {
  const validCategories = categoryOptions.map((option) => option.value);
  return validCategories.includes(category);
};

const validateDifficulty = (difficulty: string) => {
  const validDifficulties = difficultyOptions.map((option) => option.value);
  return validDifficulties.includes(difficulty);
};

const validateLimit = (limit: string) => {
  const parsedLimit = parseInt(limit, 10);
  return !isNaN(parsedLimit) && parsedLimit >= 5 && parsedLimit <= 50;
};

export default async function Questions({
  params,
  searchParams,
}: {
  params: Promise<{ lang: Locale }>;
  searchParams: Promise<{
    category: string;
    difficulty: string;
    limit: string;
  }>;
}) {
  const { lang } = await params;
  const { category, difficulty, limit } = await searchParams;

  if (
    !validateCategory(category) ||
    !validateDifficulty(difficulty) ||
    !validateLimit(limit)
  ) {
    return redirect(`/${lang}/quiz-app`);
  }

  const questions = await getData(category, difficulty, limit);

  return (
    <QuestionsContent
      questions={questions}
      limit={parseInt(limit, 10)}
      category={category}
      lang={lang}
    />
  );
}

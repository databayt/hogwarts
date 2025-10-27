"use client";
import { Button } from "@/components/ui/button";
import { useGlobalContext } from "@/components/kwizi/providers/global-context";
import { play } from "@/components/kwizi/shared/icons";
import { useRouter } from "next/navigation";
import React from "react";

function ResultsDisplay() {
  const router = useRouter();
  const { quizResponses, selectedQuiz } = useGlobalContext();

  if (!quizResponses || quizResponses.length === 0) {
    router.push("/kwizi"); /// redirect to home page
    return null;
  }

  // calculate the score
  const correctAnswers = quizResponses.filter(
    (res: { isCorrect: boolean }) => res.isCorrect
  ).length;

  const totalQuestions = quizResponses.length;
  const scorePercentage = (correctAnswers / totalQuestions) * 100;

  // Show message for the score
  let message = "";

  if (scorePercentage < 25) {
    message = "You need to try harder!";
  } else if (scorePercentage >= 25 && scorePercentage < 50) {
    message = "You're getting there! Keep practicing.";
  } else if (scorePercentage >= 50 && scorePercentage < 75) {
    message = "Good effort! You're above average.";
  } else if (scorePercentage >= 75 && scorePercentage < 100) {
    message = "Great job! You're so close to perfect!";
  } else if (scorePercentage === 100) {
    message = "Outstanding! You got everything right!";
  }

  return (
    <div className="py-20 flex flex-col gap-4">
      <h1 className="text-4xl font-bold text-center">Quiz Results</h1>

      <p className="text-2xl text-center mt-4">
        You scored <span className="font-bold">{correctAnswers}</span> out of{" "}
        {""}
        <span className="font-bold text-3xl">{totalQuestions}</span> {""}
      </p>

      <p className="text-blue-400 font-bold text-4xl text-center">
        {scorePercentage.toFixed()}%
      </p>

      <p className="text-2xl text-center mt-2 font-semibold">{message}</p>

      <div className="flex justify-center mt-8">
        <Button
          variant={"green"}
          className="px-10 py-6 font-bold text-white text-xl rounded-xl"
          onClick={() => selectedQuiz && router.push("/kwizi/quiz/setup/" + `${selectedQuiz.id}`)}
        >
          {play} Play Again
        </Button>
      </div>
    </div>
  );
}

export default ResultsDisplay;

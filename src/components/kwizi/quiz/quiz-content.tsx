"use client";
import { Button } from "@/components/ui/button";
import { useGlobalContext } from "@/components/kwizi/providers/global-context";
import { IOption, IQuestion } from "@/components/kwizi/shared/types";
import { IResponse } from "./types";
import { flag, next } from "@/components/kwizi/shared/icons";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";
import toast from "react-hot-toast";
import { finishQuizAction } from "./actions";

function QuizContent() {
  const {
    selectedQuiz,
    quizSetup,
    setQuizSetup,
    setQuizResponses,
    filteredQuestions,
  } = useGlobalContext();
  const router = useRouter();

  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [activeQuestion, setActiveQuestion] = React.useState(null) as any;
  const [responses, setResponses] = React.useState<IResponse[]>([]);
  const [shuffledOptions, setShuffledOptions] = React.useState<IOption[]>([]);
  const [shuffledQuestions, setShuffledQuestions] = React.useState<IQuestion[]>(
    []
  );

  if (!selectedQuiz) {
    router.push("/kwizi");
    return null;
  }

  // shuffle questions when the quiz is started
  useEffect(() => {
    const allQuestions = filteredQuestions.slice(0, quizSetup?.questionCount);

    setShuffledQuestions(shuffleArray([...allQuestions]));
  }, [selectedQuiz, quizSetup]);

  // suffle options when the active question changes
  useEffect(() => {
    if (shuffledQuestions[currentIndex]) {
      // shuffle options for the current question
      setShuffledOptions(
        shuffleArray([...shuffledQuestions[currentIndex].options])
      );
    }
  }, [shuffledQuestions, currentIndex]);

  // Fisher-Yates Shuffle Algorithm
  const shuffleArray = (array: any[]) => {
    for (let i = array.length - 1; i > 0; --i) {
      // generate a random index between 0 and i
      const j = Math.floor(Math.random() * (i + 1));

      // swap elements --> destructuring assignment
      [array[i], array[j]] = [array[j], array[i]];
    }

    return array;
  };

  const handleActiveQuestion = (option: any) => {
    if (!shuffledQuestions[currentIndex]) return;

    const response = {
      questionId: shuffledQuestions[currentIndex].id,
      optionId: option.id,
      isCorrect: option.isCorrect,
    };

    setResponses((prev) => {
      // check if the response already exists
      const existingIndex = prev.findIndex((res) => {
        return res.questionId === response.questionId;
      });

      // update the response if it exists

      if (existingIndex !== -1) {
        // update the response
        const updatedResponses = [...prev];
        updatedResponses[existingIndex] = response;

        return updatedResponses;
      } else {
        return [...prev, response];
      }
    });

    // set the active question
    setActiveQuestion(option);
  };

  const handleNextQuestion = () => {
    if (currentIndex < shuffledQuestions.length - 1) {
      setCurrentIndex((prev) => prev + 1);

      // reset the active question
      setActiveQuestion(null);
    } else {
      router.push("/kwizi/results");
    }
  };

  const handleFinishQuiz = async () => {
    setQuizResponses(responses);

    const score = responses.filter((res) => res.isCorrect).length;

    try {
      const result = await finishQuizAction({
        categoryId: selectedQuiz.categoryId,
        quizId: selectedQuiz.id,
        score,
        responses,
      });

      if (!result.success) {
        console.log("Error finishing quiz:", result.error);
      } else {
        console.log("Quiz finished:", result.data);
      }
    } catch (error) {
      console.log("Error finishing quiz:", error);
    }

    setQuizSetup({
      questionCount: 1,
      category: null,
      difficulty: null,
    });

    router.push("/kwizi/results");
  };

  return (
    <div className="py-[2.5rem]">
      {shuffledQuestions[currentIndex] ? (
        <div className="space-y-6">
          <div className="flex flex-col gap-6">
            <p className="py-3 px-6 border-2 text-xl font-bold self-end rounded-lg shadow-[0_.3rem_0_0_rgba(0,0,0,0.1)]">
              Question: <span>{currentIndex + 1}</span> /{" "}
              <span className="text-3xl">{shuffledQuestions.length}</span>
            </p>
            <h1 className="mt-4 px-10 text-5xl font-bold text-center">
              {shuffledQuestions[currentIndex].text}
            </h1>
          </div>

          <div className="pt-14 space-y-4">
            {shuffledOptions.map((option, index) => (
              <button
                key={index}
                className={`relative group py-3 w-full text-center border-2 text-lg font-semibold rounded-lg
                    hover:bg-[rgba(0,0,0,0.03)] transition-all duration-200 ease-in-out
                ${
                  option.text === activeQuestion?.text
                    ? "bg-green-100 border-green-500 shadow-[0_.3rem_0_0_#51bf22] hover:bg-green-100 hover:border-green-500"
                    : "shadow-[0_.3rem_0_0_rgba(0,0,0,0.1)]"
                }
                    `}
                onClick={() => handleActiveQuestion(option as IOption)}
              >
                {option.text}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-lg">No questions found for this quiz</p>
      )}

      <div className="w-full py-[4rem] fixed bottom-0 left-0 border-t-2 flex items-center justify-center">
        <Button
          className="px-10 py-6 font-bold text-white text-xl rounded-xl"
          variant={"green"}
          onClick={() => {
            if (currentIndex < shuffledQuestions.length - 1) {
              if (activeQuestion?.id) {
                handleNextQuestion();
              } else {
                const sound = new Audio("/sounds/error.mp3");
                sound.play();
                toast.error("Please select an option to continue");
              }
            } else {
              if (activeQuestion?.id) {
                handleFinishQuiz();
              } else {
                const sound = new Audio("/sounds/error.mp3");
                sound.play();
                toast.error("Please select an option to continue");
              }
            }
          }}
        >
          {currentIndex < shuffledQuestions.length - 1 ? (
            <span className="flex items-center gap-2">{next} Next</span>
          ) : (
            <span className="flex items-center gap-2">{flag} Finish</span>
          )}
        </Button>
      </div>
    </div>
  );
}

export default QuizContent;

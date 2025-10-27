"use client";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { alphabeticNumeral, showCategory } from "../utils";
import useModalStore from "../hooks/use-modal-store";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { CountdownCircleTimer } from "react-countdown-circle-timer";
import { toast } from "sonner";
import type { Question } from "../types";
import type { Locale } from "@/components/internationalization/config";
import "./questions.css";

interface Props {
  questions: Question[];
  limit: number;
  category: string;
  lang: Locale;
}

export default function QuestionsInteractive(props: Props) {
  const [curr, setCurr] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [progressValue, setProgressValue] = useState(0);
  const [score, setScore] = useState(0);
  const { onOpen } = useModalStore();
  const [key, setKey] = useState(0);

  const handleShuffle = (correctAnswer: string, incorrectAnswers: string[]) => {
    const shuffledAnswers = [...incorrectAnswers];

    shuffledAnswers.sort(() => Math.random() - 0.5);
    const randomIndex = Math.floor(
      Math.random() * (shuffledAnswers.length + 1)
    );
    shuffledAnswers.splice(randomIndex, 0, correctAnswer);

    return shuffledAnswers;
  };

  const handleCheck = (answer: string, isTimeUp: boolean = false) => {
    setSelected(answer);
    if (answer === props.questions[curr].correctAnswer && !isTimeUp)
      setScore(score + 1);
  };

  const handleSelect = (i: string) => {
    if (selected === i && selected === props.questions[curr].correctAnswer)
      return "correct";
    else if (selected === i && selected !== props.questions[curr].correctAnswer)
      return "incorrect";
    else if (i === props.questions[curr].correctAnswer) return "correct";
  };

  const handleNext = () => {
    setCurr((curr) => curr + 1);
    setSelected("");
    setKey((prevKey) => prevKey + 1);
  };

  const handleQuit = () => {
    onOpen("quitQuiz");
  };

  const handleShowResult = () => {
    onOpen("showResults", {
      score,
      limit: props.limit,
    });
  };

  const handleTimeUp = () => {
    handleCheck(props.questions[curr].correctAnswer, true);
    toast.info("You ran out of Time!");
  };

  useEffect(() => {
    if (props.questions?.length >= 5) {
      setAnswers(
        handleShuffle(
          props.questions[curr].correctAnswer,
          props.questions[curr].incorrectAnswers
        )
      );
    }
    setProgressValue((100 / props.limit) * (curr + 1));
  }, [curr, props.questions, props.limit]);

  if (!props.questions || !answers.length) {
    return <Loader2 className="size-10 text-white animate-spin" />;
  }

  return (
    <div className="bg-white px-3 py-5 md:p-6 shadow-md w-full md:w-[80%] lg:w-[70%] max-w-5xl sm:rounded-lg">
      <Progress value={progressValue} />
      <div className="flex justify-between items-center h-20 text-sm md:text-base">
        <div className="space-y-1">
          <p>Category: {showCategory(props.category)}</p>
          <p>Score: {score}</p>
        </div>
        <CountdownCircleTimer
          key={key}
          isPlaying={!selected}
          duration={15}
          size={45}
          strokeWidth={4}
          colors={["#004777", "#F7B801", "#A30000", "#A30000"]}
          colorsTime={[15, 8, 3, 0]}
          onComplete={handleTimeUp}
        >
          {({ remainingTime }) => (
            <div className="text-center">{remainingTime}</div>
          )}
        </CountdownCircleTimer>
      </div>
      <Separator />
      <div className="min-h-[50vh] py-4 xl:py-8 px-3 md:px-5 w-full">
        <h2 className="text-2xl text-center font-medium">{`Q${curr + 1}. ${
          props.questions[curr].question
        }`}</h2>
        <div className="py-4 md:py-5 xl:py-7 flex flex-col gap-y-3 md:gap-y-5">
          {answers.map((answer, i) => (
            <button
              key={i}
              className={`option ${selected && handleSelect(answer)}`}
              disabled={!!selected}
              onClick={() => handleCheck(answer)}
            >
              {alphabeticNumeral(i)}
              {answer}
            </button>
          ))}
        </div>
        <Separator />
        <div className="flex mt-5 md:justify-between md:flex-row flex-col gap-4 md:gap-0 mx-auto max-w-xs w-full">
          <Button
            disabled={!selected}
            onClick={() =>
              props.questions.length === curr + 1 ? handleShowResult() : handleNext()
            }
          >
            {props.questions.length - 1 != curr ? "Next Question" : "Show Results"}
          </Button>
          <Button variant={"destructive"} onClick={handleQuit}>
            Quit Quiz
          </Button>
        </div>
      </div>
    </div>
  );
}

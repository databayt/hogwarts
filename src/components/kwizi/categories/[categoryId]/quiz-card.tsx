"use client";
import { useGlobalContext } from "@/components/kwizi/providers/global-context";
import { IQuiz } from "@/components/kwizi/shared/types";
import { dots } from "@/components/kwizi/shared/icons";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React from "react";

interface Props {
  quiz: IQuiz;
}

function QuizCard({ quiz }: Props) {
  const router = useRouter();

  const { setSelectedQuiz } = useGlobalContext();

  const handleClick = () => {
    setSelectedQuiz(quiz);
    router.push(`/kwizi/quiz/setup/${quiz.id}`);
  };

  return (
    <div
      className="border-2 rounded-xl p-1 cursor-pointer shadow-[0_.3rem_0_0_rgba(0,0,0,0.1)]
        hover:-translate-y-1 transition-transform duration-300 ease-in-out"
      onClick={handleClick}
    >
      <div className="py-2 px-6 flex flex-col gap-4">
        <div className="rounded-xl h-[16rem] py-1 bg-[#97dbff]/20">
          <Image
            src={
              quiz.image
                ? quiz.image
                : `/categories/image--${quiz.title
                    .toLowerCase()
                    .split(" ")
                    .join("-")}.svg`
            }
            alt="quiz image"
            width={300}
            height={200}
            className="h-full rounded-xl"
          />
        </div>

        <div>
          <h2 className="text-xl font-bold">{quiz.title}</h2>
          <p className="text-gray-600 leading-none font-semibold">
            {quiz.description}
          </p>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-gray-400 semi-bold text-sm flex items-center gap-2 leading-none">
            <span className="text-xl">{dots}</span>
            <span>
              Total Questions:{" "}
              <span className="font-bold text-gray-600">
                {quiz.questions.length}
              </span>
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default QuizCard;

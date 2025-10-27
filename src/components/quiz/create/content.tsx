import React from "react";
import QuizForm from "./form";

interface Props {
  topic: string;
}

export default function QuizContent({ topic }: Props) {
  return <QuizForm topic={topic} />;
}

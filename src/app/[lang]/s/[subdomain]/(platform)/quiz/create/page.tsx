import QuizContent from "@/components/quiz/create/content";
import { getAuthSession } from "@/components/quiz/lib/auth";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Create Quiz | Quizzzy",
  description: "Quiz yourself on anything!",
};

interface Props {
  searchParams: {
    topic?: string;
  };
}

export default async function CreateQuiz({ searchParams }: Props) {
  const session = await getAuthSession();
  if (!session?.user) {
    redirect("/quiz");
  }
  return <QuizContent topic={searchParams.topic ?? ""} />;
}

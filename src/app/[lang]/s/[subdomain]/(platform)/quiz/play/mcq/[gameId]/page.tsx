import MCQContent from "@/components/quiz/play/mcq/content";
import { getAuthSession } from "@/components/quiz/lib/auth";
import { redirect } from "next/navigation";

interface Props {
  params: {
    gameId: string;
  };
}

export default async function MCQPage({ params: { gameId } }: Props) {
  const session = await getAuthSession();
  if (!session?.user) {
    return redirect("/quiz");
  }

  return <MCQContent gameId={gameId} />;
}

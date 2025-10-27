import StatisticsContent from "@/components/quiz/statistics/content";
import { getAuthSession } from "@/components/quiz/lib/auth";
import { redirect } from "next/navigation";

interface Props {
  params: {
    gameId: string;
  };
}

export default async function Statistics({ params: { gameId } }: Props) {
  const session = await getAuthSession();
  if (!session?.user) {
    return redirect("/quiz");
  }

  return <StatisticsContent gameId={gameId} />;
}

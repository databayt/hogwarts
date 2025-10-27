import OpenEndedContent from "@/components/quiz/play/open-ended/content";
import { getAuthSession } from "@/components/quiz/lib/auth";
import { redirect } from "next/navigation";

interface Props {
  params: {
    gameId: string;
  };
}

export default async function OpenEndedPage({ params: { gameId } }: Props) {
  const session = await getAuthSession();
  if (!session?.user) {
    return redirect("/quiz");
  }

  return <OpenEndedContent gameId={gameId} />;
}

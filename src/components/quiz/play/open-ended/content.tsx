import { prisma } from "@/components/quiz/lib/db";
import { redirect } from "next/navigation";
import OpenEndedGame from "./game";

interface Props {
  gameId: string;
}

export default async function OpenEndedContent({ gameId }: Props) {
  const game = await prisma.game.findUnique({
    where: {
      id: gameId,
    },
    include: {
      questions: {
        select: {
          id: true,
          question: true,
          answer: true,
        },
      },
    },
  });

  if (!game || game.gameType === "mcq") {
    return redirect("/quiz");
  }

  return <OpenEndedGame game={game} />;
}

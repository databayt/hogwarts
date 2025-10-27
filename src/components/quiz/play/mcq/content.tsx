import { prisma } from "@/components/quiz/lib/db";
import { redirect } from "next/navigation";
import MCQGame from "./game";

interface Props {
  gameId: string;
}

export default async function MCQContent({ gameId }: Props) {
  const game = await prisma.game.findUnique({
    where: {
      id: gameId,
    },
    include: {
      questions: {
        select: {
          id: true,
          question: true,
          options: true,
        },
      },
    },
  });

  if (!game || game.gameType === "open_ended") {
    return redirect("/quiz");
  }

  return <MCQGame game={game} />;
}

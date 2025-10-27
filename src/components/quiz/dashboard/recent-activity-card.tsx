import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { getAuthSession } from "@/components/quiz/lib/auth";
import { redirect } from "next/navigation";
import HistoryList from "@/components/quiz/history/history-list";
import { prisma } from "@/components/quiz/lib/db";

interface Props {}

export default async function RecentActivityCard(props: Props) {
  const session = await getAuthSession();
  if (!session?.user) {
    return redirect("/quiz");
  }
  const games_count = await prisma.game.count({
    where: {
      userId: session.user.id,
    },
  });
  return (
    <Card className="col-span-4 lg:col-span-3">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">
          <Link href="/quiz/history">Recent Activity</Link>
        </CardTitle>
        <CardDescription>
          You have played a total of {games_count} quizzes.
        </CardDescription>
      </CardHeader>
      <CardContent className="max-h-[580px] overflow-scroll">
        <HistoryList limit={10} userId={session.user.id} />
      </CardContent>
    </Card>
  );
}

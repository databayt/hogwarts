import HistoryContent from "@/components/quiz/history/content";
import { getAuthSession } from "@/components/quiz/lib/auth";
import { redirect } from "next/navigation";

export default async function History() {
  const session = await getAuthSession();
  if (!session?.user) {
    return redirect("/quiz");
  }
  return <HistoryContent userId={session.user.id} />;
}

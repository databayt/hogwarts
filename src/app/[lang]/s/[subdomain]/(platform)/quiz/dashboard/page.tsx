import DashboardContent from "@/components/quiz/dashboard/content";
import { getAuthSession } from "@/components/quiz/lib/auth";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Dashboard | Quizzzy",
  description: "Quiz yourself on anything!",
};

export default async function Dashboard() {
  const session = await getAuthSession();
  if (!session?.user) {
    redirect("/quiz");
  }

  return <DashboardContent />;
}

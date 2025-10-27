import React from "react";
import DetailsDialog from "./details-dialog";
import HistoryCard from "./history-card";
import HotTopicsCard from "./hot-topics-card";
import QuizMeCard from "./quiz-me-card";
import RecentActivityCard from "./recent-activity-card";

interface Props {}

export default function DashboardContent(props: Props) {
  return (
    <main className="p-8 mx-auto max-w-7xl">
      <div className="flex items-center">
        <h2 className="mr-2 text-3xl font-bold tracking-tight">Dashboard</h2>
        <DetailsDialog />
      </div>

      <div className="grid gap-4 mt-4 md:grid-cols-2">
        <QuizMeCard />
        <HistoryCard />
      </div>
      <div className="grid gap-4 mt-4 md:grid-cols-2 lg:grid-cols-7">
        <HotTopicsCard />
        <RecentActivityCard />
      </div>
    </main>
  );
}

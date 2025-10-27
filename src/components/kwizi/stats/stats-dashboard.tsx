import { auth } from "@clerk/nextjs/server";
import React from "react";
import prisma from "@/components/kwizi/shared/db";
import UserStats from "./user-stats";

async function StatsDashboard() {
  const { userId } = await auth();

  if (!userId) {
    return <div>You need to be logged in to view this page</div>;
  }

  // get user data --> populate the categoryStats using the category

  const user = await prisma.user.findUnique({
    where: {
      clerkId: userId,
    },
    include: {
      categoryStats: {
        include: {
          category: true, // populate the category
        },
      },
    },
  });

  console.log("User stats:", user);

  return (
    <div>
      <UserStats userStats={user} />
    </div>
  );
}

export default StatsDashboard;

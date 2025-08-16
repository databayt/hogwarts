"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export type DeleteCurrentUserResult =
  | { success: true }
  | { success: false; error: string };

export async function deleteCurrentUser(): Promise<DeleteCurrentUserResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    await db.user.delete({ where: { id: session.user.id } });
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}




"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";

const userNameSchema = z.object({ name: z.string().min(1).max(32) });
export type FormData = z.infer<typeof userNameSchema>;

export async function updateUserName(userId: string, data: FormData) {
  const parsed = userNameSchema.safeParse(data);
  if (!parsed.success) {
    return { status: "error" as const };
  }
  await db.user.update({ where: { id: userId }, data: { username: parsed.data.name } });
  revalidatePath("/dashboard/settings");
  return { status: "success" as const };
}


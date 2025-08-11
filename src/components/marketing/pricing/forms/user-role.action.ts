"use server";

import { UserRole } from "@prisma/client";

export type FormData = { role: UserRole };

export async function updateUserRole(_userId: string, _data: FormData) {
  return { status: "success" as const };
}


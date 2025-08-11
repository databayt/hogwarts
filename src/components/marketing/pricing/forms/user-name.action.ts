"use server";

export type FormData = { name: string };

export async function updateUserName(_userId: string, _data: FormData) {
  return { status: "success" as const };
}


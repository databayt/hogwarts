"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

import { db } from "@/lib/db"
import { userNameSchema } from "@/components/marketing/pricing/lib/validations/user"

export type FormData = {
  name: string
}

export async function updateUserName(userId: string, data: FormData) {
  try {
    const session = await auth()

    if (!session?.user || session?.user.id !== userId) {
      throw new Error("Unauthorized")
    }

    const { name } = userNameSchema.parse(data)

    // Update the user name.
    await db.user.update({
      where: {
        id: userId,
      },
      data: {
        username: name,
      },
    })

    revalidatePath("/lab/settings")
    return { status: "success" }
  } catch (error) {
    // console.log(error)
    return { status: "error" }
  }
}

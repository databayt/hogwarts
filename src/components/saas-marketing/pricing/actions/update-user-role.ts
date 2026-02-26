"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { UserRole } from "@prisma/client"

import { prisma } from "@/components/saas-marketing/pricing/lib/db"
import { userRoleSchema } from "@/components/saas-marketing/pricing/lib/validations/user"

export type FormData = {
  role: UserRole
}

export async function updateUserRole(userId: string, data: FormData) {
  try {
    const session = await auth()

    if (!session?.user || session?.user.id !== userId) {
      throw new Error("Unauthorized")
    }

    const { role } = userRoleSchema.parse(data)

    // Update the user role.
    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        role: role,
      },
    })

    revalidatePath("/lab/settings")
    return { status: "success" }
  } catch (error) {
    // console.log(error)
    return { status: "error" }
  }
}

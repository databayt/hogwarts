import { PrismaAdapter } from "@auth/prisma-adapter"

import { db } from "@/lib/db"

export const customPrismaAdapter = () => {
  const adapter = PrismaAdapter(db)

  return {
    ...adapter,
    // Override the getUserByEmail method to work with multi-tenant schema
    async getUserByEmail(email: string) {
      try {
        const users = await db.user.findMany({
          where: { email },
          orderBy: { createdAt: "desc" },
        })

        const user = users[0]
        if (!user) return null

        // Return user with non-nullable email to match AdapterUser type
        return {
          id: user.id,
          email: user.email || "",
          name: user.username || null,
          image: user.image || null,
          emailVerified: user.emailVerified,
        }
      } catch (error) {
        console.error("Error in custom getUserByEmail:", error)
        return null
      }
    },
    // Override createUser to handle multi-tenant setup
    async createUser(user: {
      id: string
      email: string
      name?: string | null
      image?: string | null
      emailVerified?: Date | null
    }) {
      try {
        const createdUser = await db.user.create({
          data: {
            email: user.email,
            username: user.name || null,
            image: user.image || null,
            role: "USER",
            emailVerified: user.emailVerified || new Date(),
          },
        })

        // Return user with all required properties for AdapterUser type
        return {
          id: createdUser.id,
          email: createdUser.email || "",
          name: createdUser.username || null,
          image: createdUser.image || null,
          emailVerified: createdUser.emailVerified,
        }
      } catch (error) {
        console.error("Error in custom createUser:", error)
        throw error
      }
    },
    // Override linkAccount to handle multi-tenant setup
    async linkAccount(data: {
      userId: string
      type: string
      provider: string
      providerAccountId: string
      refresh_token?: string
      access_token?: string
      expires_at?: number
      token_type?: string
      scope?: string
      id_token?: string
      session_state?: string
    }) {
      try {
        // Remove userId from the data object since it's not a field in the Account model
        const { userId, ...accountData } = data

        await db.account.create({
          data: {
            ...accountData,
            userId: userId, // This is the correct field name for the foreign key
          },
        })
      } catch (error) {
        console.error("Error in custom linkAccount:", error)
        throw error
      }
    },
  }
}

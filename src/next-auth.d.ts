import { type DefaultSession } from "next-auth"

export type ExtendedUser = DefaultSession["user"] & {
  id: string
  role: string
  schoolId?: string
  isTwoFactorEnabled: boolean
  isOAuth: boolean
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: string
      schoolId?: string
      isTwoFactorEnabled: boolean
      isOAuth: boolean
      /** User.tokenVersion at sign-in — compared to revoke stale sessions. */
      tv?: number
    } & DefaultSession["user"]
  }
}

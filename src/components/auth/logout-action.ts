"use server"

import { signOut } from "@/auth"

export const logout = async () => {
  console.log("🚪 LOGOUT ACTION TRIGGERED")

  // Sign out and redirect to home page
  await signOut({
    redirectTo: "/",
    redirect: true,
  })
}

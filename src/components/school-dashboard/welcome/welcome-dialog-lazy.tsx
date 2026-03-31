"use client"

import dynamic from "next/dynamic"

const WelcomeDialog = dynamic(
  () => import("./welcome-dialog").then((m) => m.WelcomeDialog),
  { ssr: false }
)

export { WelcomeDialog as WelcomeDialogLazy }

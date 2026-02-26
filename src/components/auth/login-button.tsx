"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useRouter } from "next/navigation"

import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { LoginForm } from "@/components/auth/login/form"

interface LoginButtonProps {
  children: React.ReactNode
  mode?: "modal" | "redirect"
  asChild?: boolean
}

export const LoginButton = ({
  children,
  mode = "redirect",
  asChild,
}: LoginButtonProps) => {
  const router = useRouter()

  const onClick = () => {
    router.push("/auth/login")
  }

  if (mode === "modal") {
    return (
      <Dialog>
        <DialogTrigger asChild={asChild}>{children}</DialogTrigger>
        <DialogContent className="w-auto border-none bg-transparent p-0">
          <LoginForm />
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <span onClick={onClick} className="cursor-pointer">
      {children}
    </span>
  )
}

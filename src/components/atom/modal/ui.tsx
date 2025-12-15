"use client"

import React from "react"
import { X } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"

import { useModal } from "./context"

interface Props {
  content: React.ReactNode
  big?: boolean
  full?: boolean // Add the 'full' prop here
}

function Modal({ content, big = false, full = false }: Props) {
  const { closeModal } = useModal()
  const { theme = "light" } = useTheme()

  return (
    <div
      className={`fixed inset-0 z-50 flex h-screen w-full ${theme === "dark" ? "bg-black" : "bg-white"} items-center justify-center`}
    >
      <div
        className="absolute inset-0 h-screen w-full"
        onClick={closeModal}
      ></div>
      <div
        className={`relative z-70 z-80 p-8 ${full ? "h-full w-full max-w-none" : big ? "h-[42rem] w-[35rem] max-w-4xl" : "h-[29rem] w-[24rem] max-w-2xl"} ${theme === "dark" ? "dark" : "light"} `}
      >
        {full && (
          <Button
            size="icon"
            variant="outline"
            onClick={closeModal}
            className="absolute end-0 top-0 m-4"
          >
            <X size={25} />
          </Button>
        )}
        {content}
      </div>
    </div>
  )
}
export default Modal

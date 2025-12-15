"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

import { useModal } from "./context"
import Modal from "./modal"

interface RouteModalProps {
  content: React.ReactNode
  returnTo: string
  sm?: boolean
}

export function RouteModal({ content, returnTo, sm = false }: RouteModalProps) {
  const { modal, openModal } = useModal()
  const router = useRouter()

  useEffect(() => {
    openModal()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!modal.open) {
      router.push(returnTo)
    }
  }, [modal.open, router, returnTo])

  return <Modal content={content} sm={sm} />
}

export default RouteModal

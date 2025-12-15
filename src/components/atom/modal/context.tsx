"use client"

import React, { createContext, useContext, useState } from "react"

import { ModalContextProps, ModalState } from "./types"

const ModalContext = createContext<ModalContextProps | undefined>(undefined)

export const useModal = () => {
  const context = useContext(ModalContext)
  if (!context) {
    throw new Error("useModal must be used within a ModalProvider")
  }
  return context
}

export const ModalProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [modal, setModal] = useState<ModalState>({ open: false, id: null })

  const openModal = (id?: string | null) => {
    setModal({ open: true, id: id || null })
  }

  const closeModal = () => {
    setModal({ open: false, id: null })
  }

  const handleCloseModal = () => {
    setModal({ open: false, id: null })
  }

  return (
    <ModalContext.Provider
      value={{ modal, openModal, closeModal, handleCloseModal }}
    >
      {children}
    </ModalContext.Provider>
  )
}

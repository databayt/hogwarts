"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { createContext, Dispatch, ReactNode, SetStateAction } from "react"

import { useSignInModal } from "@/components/saas-marketing/pricing/modals/sign-in-modal"

export const ModalContext = createContext<{
  setShowSignInModal: Dispatch<SetStateAction<boolean>>
}>({
  setShowSignInModal: () => {},
})

export default function ModalProvider({ children }: { children: ReactNode }) {
  const { SignInModal, setShowSignInModal } = useSignInModal()

  return (
    <ModalContext.Provider
      value={{
        setShowSignInModal,
      }}
    >
      <SignInModal />
      {children}
    </ModalContext.Provider>
  )
}

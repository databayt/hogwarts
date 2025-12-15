"use client"

import React, { useEffect, useState } from "react"

import { useModal } from "@/components/atom/modal/context"

// Custom hook for managing body scroll
function useBodyScroll(open: boolean) {
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [open])
}

interface Props {
  content: React.ReactNode
  sm?: boolean
}

function Modal({ content, sm = false }: Props) {
  const { modal, closeModal } = useModal()
  useBodyScroll(modal.open)
  const [isMobile, setIsMobile] = useState(false)

  // Check if screen is mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    // Initial check
    checkIfMobile()

    // Add event listener for window resize
    window.addEventListener("resize", checkIfMobile)

    // Cleanup event listener
    return () => window.removeEventListener("resize", checkIfMobile)
  }, [])

  return (
    <>
      {modal.open && (
        <>
          <div
            className="bg-opacity-70 fixed inset-0 h-screen w-full bg-black"
            onClick={closeModal}
          />
          <div className="fixed inset-0 z-50 h-screen w-full">
            <div
              className={`bg-background relative z-50 ${
                sm
                  ? isMobile
                    ? "flex h-screen w-full flex-col px-4 sm:px-8 md:px-12"
                    : "m-4 flex h-[24rem] w-[24rem] max-w-2xl items-center justify-center rounded-lg px-8 py-8"
                  : "flex h-screen w-full flex-col"
              }`}
            >
              {/* Main content area - vertically centered with footer spacing */}
              <main
                className={`${
                  sm && !isMobile
                    ? ""
                    : "flex flex-1 items-center justify-center px-4 pb-20 sm:px-8 md:px-12"
                }`}
              >
                <div className={`${sm && !isMobile ? "" : "w-full max-w-6xl"}`}>
                  {content}
                </div>
              </main>
            </div>
          </div>
        </>
      )}
    </>
  )
}

export default Modal

"use client";
import { useModal } from "@/components/atom/modal/context";
import React, { useState, useEffect } from "react";


// Custom hook for managing body scroll
function useBodyScroll(open: boolean) {
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [open]);
}

interface Props {
  content: React.ReactNode;
  sm?: boolean;
}

function Modal({ content, sm = false }: Props) {
  const { modal, closeModal } = useModal();
  useBodyScroll(modal.open);
  const [isMobile, setIsMobile] = useState(false);

  // Check if screen is mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Initial check
    checkIfMobile();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkIfMobile);
    
    // Cleanup event listener
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);



  return (
    <>
      {modal.open && (
        <>
          <div
            className="fixed inset-0 w-full h-screen bg-black bg-opacity-70"
            onClick={closeModal}
          />
          <div className="fixed inset-0 w-full h-screen z-50">
            <div
              className={`relative z-50 bg-background ${
                sm
                  ? isMobile
                    ? 'w-full h-screen px-4 sm:px-8 md:px-12 flex flex-col'
                    : 'm-4 px-8 py-8 max-w-2xl w-[24rem] h-[24rem] rounded-lg flex items-center justify-center'
                  : 'w-full h-screen flex flex-col'
              }`}
            >
              {/* Main content area - vertically centered with footer spacing */}
              <main className={`${
                sm && !isMobile
                  ? ''
                  : 'flex-1 flex items-center justify-center px-4 sm:px-8 md:px-12 pb-20'
              }`}>
                <div className={`${sm && !isMobile ? '' : 'w-full max-w-6xl'}`}>
                  {content}
                </div>
              </main>
            </div>
          </div>
        </>
      )}
    </>
  );
}

export default Modal;
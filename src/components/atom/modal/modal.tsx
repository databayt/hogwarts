"use client";
import { useModal } from "@/components/atom/modal/context";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X } from 'lucide-react';


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
          <div className="fixed inset-0 w-full h-screen z-50 flex justify-center items-center">
            <div 
              className={`relative z-50 bg-background ${
                sm 
                  ? isMobile
                    ? 'w-full h-screen px-20 py-4 overflow-auto'
                    : 'm-4 px-20 py-8 max-w-2xl w-[24rem] h-[24rem] sm:text-sm rounded-lg' 
                  : 'w-full h-screen overflow-hidden px-20 py-4 sm:pt-14'
              }`}
            >
              <Button 
                size='icon' 
                variant='outline' 
                className="rounded-full absolute top-4 right-4 z-10"
                onClick={closeModal}
              >
                <X className="h-5 w-5" />
              </Button>
              {content}
            </div>
          </div>
        </>
      )}
    </>
  );
}

export default Modal;
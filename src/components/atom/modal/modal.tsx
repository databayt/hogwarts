"use client";
import { useModal } from "@/components/atom/modal/context";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X } from 'lucide-react';
import { motion, AnimatePresence, Variants } from 'framer-motion';

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

  const modalVariants: Variants = {
    hidden: { 
      opacity: 0,
      scale: 0.8,
    },
    visible: { 
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.2,
        ease: 'easeOut'
      }
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      transition: {
        duration: 0.2,
        ease: 'easeIn'
      }
    }
  };

  const backdropVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  return (
    <AnimatePresence>
      {modal.open && (
        <>
          <motion.div
            className="fixed inset-0 w-full h-screen bg-black bg-opacity-70"
            onClick={closeModal}
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={backdropVariants}
          />
          <div className="fixed inset-0 w-full h-screen z-50 flex justify-center items-center">
            <motion.div 
              className={`relative z-50 bg-background ${
                sm 
                  ? isMobile
                    ? 'w-full h-screen p-4 overflow-auto'
                    : 'm-4 p-8 max-w-2xl w-[24rem] h-[29rem] sm:text-sm rounded-lg' 
                  : 'w-full h-screen overflow-hidden p-4 sm:p-8'
              }`}
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={modalVariants}
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
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

export default Modal;
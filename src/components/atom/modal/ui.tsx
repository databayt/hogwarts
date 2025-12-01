"use client";
import { Button } from "@/components/ui/button";
import { useModal } from "./context";
import React from "react";
import { X } from "lucide-react";
import { useTheme } from "next-themes";

interface Props {
  content: React.ReactNode;
  big?: boolean;
  full?: boolean; // Add the 'full' prop here
}

function Modal({ content, big = false, full = false }: Props) {
  const { closeModal } = useModal();
  const { theme = 'light' } = useTheme();

  return (
    <div className={`fixed inset-0 w-full h-screen z-50 flex  ${theme === 'dark' ? 'bg-black' : 'bg-white'}  justify-center items-center`}>
      <div className="absolute inset-0 w-full h-screen" onClick={closeModal}></div>
      <div className={`
        relative p-8 z-70 z-80
        ${full ? 'w-full h-full max-w-none' : big ? 'max-w-4xl w-[35rem] h-[42rem]' : 'max-w-2xl w-[24rem] h-[29rem]'} 
        ${theme === 'dark' ? 'dark' : 'light'}
        

      `}>
        {full && 
        <Button size='icon' variant='outline' onClick={closeModal} className="absolute top-0 end-0 m-4">
        <X size={25} />
        </Button>}
        {content}
      </div>
    </div>
  );
}
export default Modal;


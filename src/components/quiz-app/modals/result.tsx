"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import useModalStore from "../hooks/use-modal-store";
import { useRouter, usePathname } from "next/navigation";

export default function ResultModal() {
  const { isOpen, type, onClose, additionalData } = useModalStore();
  const open = isOpen && type === "showResults";
  const router = useRouter();
  const pathname = usePathname();

  const handlePlayAgain = () => {
    // Extract lang from pathname (e.g., /en/quiz-app/questions -> en)
    const lang = pathname.split("/")[1] || "en";
    router.push(`/${lang}/quiz-app`);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-center text-xl md:text-2xl">
            Quiz Result
          </DialogTitle>
        </DialogHeader>
        <Separator />
        <div className="flex flex-col items-center py-4 md:py-6">
          <p className="text-lg md:2xl text-primary font-semibold tracking-wide">
            You scored: {`${additionalData?.score}/${additionalData?.limit}`}
          </p>
          <Button onClick={handlePlayAgain} className="mt-3 md:mt-5">
            Play Again
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

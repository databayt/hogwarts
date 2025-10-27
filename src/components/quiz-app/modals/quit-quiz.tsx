"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import useModalStore from "../hooks/use-modal-store";
import { useRouter, usePathname } from "next/navigation";

export default function QuitQuizModal() {
  const { isOpen, type, onClose } = useModalStore();
  const open = isOpen && type === "quitQuiz";
  const router = useRouter();
  const pathname = usePathname();

  const handleConfirm = () => {
    // Extract lang from pathname (e.g., /en/quiz-app/questions -> en)
    const lang = pathname.split("/")[1] || "en";
    router.push(`/${lang}/quiz-app`);
  };

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            Your progress will be lost.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>
            Confirm
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

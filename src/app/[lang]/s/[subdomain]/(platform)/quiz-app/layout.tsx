import ModalProvider from "@/components/quiz-app/modals/provider";
import { Toaster } from "@/components/ui/sonner";

export default function QuizAppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <ModalProvider />
      {children}
      <Toaster position="top-center" duration={5000} richColors />
    </>
  );
}

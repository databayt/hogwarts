import { cn } from "@/components/quiz/lib/utils";
import type { Metadata } from "next";
import Providers from "@/components/quiz/template/providers";
import Navbar from "@/components/quiz/template/navbar";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "Quizmify",
  description: "Quiz yourself on anything!",
};

export default function QuizLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
      <div className={cn("antialiased min-h-screen pt-16")}>
        <Navbar />
        {children}
        <Toaster />
      </div>
    </Providers>
  );
}

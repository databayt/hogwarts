import type { Metadata } from "next";
import Header from "@/components/kwizi/shared/header/header";
import ContextProvider from "@/components/kwizi/providers/context-provider";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "Kwizi - Quiz Platform",
  description: "Interactive quiz platform for learning and testing knowledge",
};

export default function KwiziLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ContextProvider>
      <Toaster position="top-center" />
      <Header />
      <main className="py-8 mx-[15rem] xl:mx-[25rem] h-full">
        {children}
      </main>
    </ContextProvider>
  );
}

import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/atom/theme-provider";
import { Toaster } from "sonner";
import { SessionProvider } from "next-auth/react";
import { auth } from "@/auth";
import { NuqsAdapter } from "nuqs/adapters/next/app";



export const metadata: Metadata = {
  title: "Hogwarts",
  description: "School automation",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  
  return (
    <html lang="en">
      <body
        className={cn(
          "font-sans antialiased",
          GeistSans.className,
          GeistMono.variable
        )}
      >
        <SessionProvider session={session}>
          <NuqsAdapter>
            <ThemeProvider>
              <div className="layout-container">
                <Toaster position="bottom-right" />
                
                {children}
              </div>
            </ThemeProvider>
          </NuqsAdapter>
        </SessionProvider>
      </body>
    </html>
  );
}

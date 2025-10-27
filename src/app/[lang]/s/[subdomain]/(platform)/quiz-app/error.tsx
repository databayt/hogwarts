"use client";

import { buttonVariants } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Error() {
  const pathname = usePathname();
  // Extract lang from pathname (e.g., /en/quiz-app -> en)
  const lang = pathname.split("/")[1] || "en";

  return (
    <div className="h-[100dvh] w-full flex flex-col items-center justify-center space-y-4">
      <Image src="/error.webp" height="300" width="300" alt="Error" />
      <h2 className="text-xl font-medium">Something went wrong!</h2>
      <Link className={buttonVariants()} href={`/${lang}/quiz-app`}>
        Go Back
      </Link>
    </div>
  );
}

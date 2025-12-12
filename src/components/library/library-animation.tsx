"use client";

import { useEffect, useState } from "react";
import Lottie from "lottie-react";

interface LibraryAnimationProps {
  className?: string;
}

export function LibraryAnimation({ className }: LibraryAnimationProps) {
  const [animationData, setAnimationData] = useState<object | null>(null);

  useEffect(() => {
    fetch(
      "https://cdn.prod.website-files.com/6889473510b50328dbb70ae6/6931c5426a3fbb9a2be31b1e_Claude_for_Excel.json"
    )
      .then((res) => res.json())
      .then((data) => setAnimationData(data))
      .catch(console.error);
  }, []);

  if (!animationData) {
    return (
      <div className={`${className} flex items-center justify-center`}>
        <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className={className}>
      <Lottie
        animationData={animationData}
        loop={true}
        autoplay={true}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Lottie from "lottie-react";

// Same animation as Claude API page
const ANIMATION_URL = "https://cdn.prod.website-files.com/6889473510b50328dbb70ae6/68c00420bab94b062559518b_API.json";

export function AdmissionHeroIllustration() {
  const [animationData, setAnimationData] = useState<unknown>(null);

  useEffect(() => {
    fetch(ANIMATION_URL)
      .then((res) => res.json())
      .then(setAnimationData)
      .catch(console.error);
  }, []);

  if (!animationData) {
    return (
      <div className="relative w-[300px] h-[300px] sm:w-[350px] sm:h-[350px] lg:w-[450px] lg:h-[450px]">
        <div className="w-full h-full bg-muted/20 rounded-full animate-pulse" />
      </div>
    );
  }

  return (
    <div className="relative w-[300px] h-[300px] sm:w-[350px] sm:h-[350px] lg:w-[450px] lg:h-[450px]">
      <Lottie
        animationData={animationData}
        loop={true}
        autoplay={true}
        style={{
          width: "100%",
          height: "100%",
        }}
      />
    </div>
  );
}

export default AdmissionHeroIllustration;

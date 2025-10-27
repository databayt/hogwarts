"use client";

import React, { useEffect, useState } from "react";
import QuitQuizModal from "./quit-quiz";
import ResultModal from "./result";

export default function ModalProvider() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  return (
    <>
      <QuitQuizModal />
      <ResultModal />
    </>
  );
}

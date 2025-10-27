"use client";
import React, { useEffect } from "react";

interface Props {
  intitialTimeLeft: number;
}

function Countdown({ intitialTimeLeft }: Props) {
  const [timeLeft, setTimeLeft] = React.useState(intitialTimeLeft);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          window.location.reload();
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <p>
      Please try again in{" "}
      <span className="text-2xl text-blue-400 font-bold">{timeLeft}</span>{" "}
      seconds. This page will automatically refresh.
    </p>
  );
}

export default Countdown;

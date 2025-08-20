"use client";

import { useState } from "react";
import SectionHeading from "../atom/section-heading";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import Image from "next/image";

export default function Newsletter() {
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    // Handle newsletter subscription
    console.log("Subscribing email:", email);
    setEmail("");
  };

  return (
    <section className="py-14">
      <div className="flex justify-center pr-66">
        <Image
          src="/site/glass.png"
          alt="Hogwarts Glasses"
          width={80}
          height={80}
          className="object-contain -rotate-32 dark:invert"
        />
      </div>
      
      <SectionHeading
        title="Newsletter"
        description="Stay Updated with Hogwarts"
      />
      
    <div className="flex  items-center gap-2 py-6 max-w-xs mx-auto">
        <Input
          type="email"
          placeholder="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="flex-1"
        />
        <Button
          type="submit"
          onClick={handleSubmit}
          
        >
          Subscribe
        </Button>
      </div>
    </section>
  );
}

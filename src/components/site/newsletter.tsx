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
    <section className="py-16 md:py-24">
        <SectionHeading
          title="Newsletter"
          description="Stay Updated with Hogwarts"
        />

        <div className="max-w-xs mx-auto py-6">
          <div className="flex justify-start mb-2">
            <Image
              src="/site/glass.png"
              alt="Hogwarts Glasses"
              width={48}
              height={48}
              className="object-contain -rotate-12 dark:invert"
            />
          </div>
          <div className="flex items-center gap-2">
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
        </div>
    </section>
  );
}

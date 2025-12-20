"use client"

import { useState } from "react"
import Image from "next/image"

import { useDictionary } from "@/components/internationalization/use-dictionary"

import SectionHeading from "../atom/section-heading"
import { Button } from "../ui/button"
import { Input } from "../ui/input"

export default function Newsletter() {
  const [email, setEmail] = useState("")
  const { dictionary } = useDictionary()

  const newsletter = dictionary?.marketing?.site?.newsletter

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    // Handle newsletter subscription
    console.log("Subscribing email:", email)
    setEmail("")
  }

  return (
    <section className="py-16 md:py-24">
      <SectionHeading
        title={newsletter?.title || "Newsletter"}
        description={newsletter?.description || "Stay Updated with Hogwarts"}
      />

      <div className="mx-auto max-w-xs py-6">
        <div className="mb-2 flex justify-start">
          <Image
            src="/site/glass.png"
            alt="Hogwarts Glasses"
            width={48}
            height={48}
            className="-rotate-12 object-contain dark:invert"
          />
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="email"
            placeholder={newsletter?.emailPlaceholder || "Email Address"}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="flex-1"
          />
          <Button type="submit" onClick={handleSubmit}>
            {newsletter?.subscribe || "Subscribe"}
          </Button>
        </div>
      </div>
    </section>
  )
}

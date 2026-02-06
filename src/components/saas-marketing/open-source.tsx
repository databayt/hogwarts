import Image from "next/image"
import Link from "next/link"

import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

const GITHUB_URL = "https://github.com/databayt/hogwarts"

interface Contributor {
  id: number
  login: string
  avatar_url: string
  html_url: string
  contributions: number
}

interface OpenSourceProps {
  dictionary?: Dictionary
  lang?: Locale
}

async function getContributors(): Promise<Contributor[]> {
  try {
    const res = await fetch(
      "https://api.github.com/repos/databayt/hogwarts/contributors?per_page=12",
      { next: { revalidate: 3600 } } // Cache for 1 hour
    )
    if (!res.ok) return []
    return res.json()
  } catch {
    return []
  }
}

export default async function OpenSource({
  dictionary,
  lang,
}: OpenSourceProps) {
  const contributors = await getContributors()
  const isRTL = lang === "ar"

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dict = (dictionary?.marketing as any)?.openSource || {
    title: "Proudly Open Source",
    description: "Hogwarts is open source and powered by open source software.",
    github: "GitHub",
  }

  return (
    <section className="py-16 md:py-24" dir={isRTL ? "rtl" : "ltr"}>
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="font-heading mb-4 text-4xl font-extrabold md:text-5xl">
          {dict.title}
        </h2>
        <p className="text-muted-foreground mb-8 text-lg">
          {dict.description}{" "}
          <Link
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            className="text-foreground hover:text-foreground/80 underline underline-offset-4 transition-colors"
          >
            {dict.github}
          </Link>
          .
        </p>

        {/* GitHub contributors avatars */}
        <Link
          href={`${GITHUB_URL}/graphs/contributors`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex justify-center -space-x-2 transition-opacity hover:opacity-90 rtl:space-x-reverse"
        >
          {contributors.length > 0
            ? contributors.map((contributor) => (
                <Image
                  key={contributor.id}
                  src={contributor.avatar_url}
                  alt={contributor.login}
                  width={40}
                  height={40}
                  className="border-background rounded-full border-2"
                />
              ))
            : // Fallback placeholders if fetch fails
              [...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="bg-muted border-background h-10 w-10 rounded-full border-2"
                />
              ))}
        </Link>
      </div>
    </section>
  )
}

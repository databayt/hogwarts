import Link from 'next/link'
import type { Dictionary } from '@/components/internationalization/dictionaries'
import { Github } from 'lucide-react'

const GITHUB_URL = "https://github.com/databayt/hogwarts"

interface OpenSourceProps {
    dictionary?: Dictionary
}

export default function OpenSource({ dictionary }: OpenSourceProps) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dict = (dictionary?.marketing as any)?.openSource || {
        title: "Proudly Open Source",
        description: "Hogwarts is open source and powered by open source software. The code is available on",
        github: "GitHub",
        contributors: "Contributors",
    }

    return (
        <section className="py-16 md:py-24">
            <div className="text-center max-w-2xl mx-auto">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                    {dict.title}
                </h2>
                <p className="text-muted-foreground text-lg mb-8">
                    {dict.description}{" "}
                    <Link
                        href={GITHUB_URL}
                        target="_blank"
                        rel="noreferrer"
                        className="underline underline-offset-4 text-foreground hover:text-foreground/80 transition-colors"
                    >
                        {dict.github}
                    </Link>
                    .
                </p>

                {/* Contributors badge */}
                <div className="flex flex-col items-center">
                    <div className="flex h-10 items-center rounded-md border border-border bg-muted px-4 font-medium">
                        <Github className="w-4 h-4 me-2" />
                        {dict.contributors}
                    </div>
                    <div className="h-4 w-4 border-x-8 border-t-8 border-b-0 border-solid border-muted border-x-transparent" />
                </div>

                {/* GitHub contributors avatars */}
                <div className="flex justify-center -space-x-2 mt-2">
                    {[...Array(8)].map((_, i) => (
                        <div
                            key={i}
                            className="w-10 h-10 rounded-full bg-muted border-2 border-background"
                        />
                    ))}
                </div>

                <Link
                    href={GITHUB_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 mt-8 px-6 py-3 rounded-md bg-foreground text-background hover:bg-foreground/90 transition-colors font-medium"
                >
                    <Github className="w-5 h-5" />
                    Star on GitHub
                </Link>
            </div>
        </section>
    )
}

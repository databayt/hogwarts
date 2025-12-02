import Link from 'next/link'
import Image from 'next/image'
import type { Dictionary } from '@/components/internationalization/dictionaries'

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
}

async function getContributors(): Promise<Contributor[]> {
    try {
        const res = await fetch(
            'https://api.github.com/repos/databayt/hogwarts/contributors?per_page=12',
            { next: { revalidate: 3600 } } // Cache for 1 hour
        )
        if (!res.ok) return []
        return res.json()
    } catch {
        return []
    }
}

export default async function OpenSource({ dictionary }: OpenSourceProps) {
    const contributors = await getContributors()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dict = (dictionary?.marketing as any)?.openSource || {
        title: "Proudly Open Source",
        description: "Databayt is open source and powered by open source software.",
        github: "GitHub",
    }

    return (
        <section className="py-16 md:py-24">
            <div className="text-center max-w-2xl mx-auto">
                <h2 className="text-3xl md:text-4xl font-heading font-extrabold mb-4">
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

                {/* GitHub contributors avatars */}
                <Link
                    href={`${GITHUB_URL}/graphs/contributors`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex justify-center -space-x-2 hover:opacity-90 transition-opacity"
                >
                    {contributors.length > 0 ? (
                        contributors.map((contributor) => (
                            <Image
                                key={contributor.id}
                                src={contributor.avatar_url}
                                alt={contributor.login}
                                width={40}
                                height={40}
                                className="rounded-full border-2 border-background"
                            />
                        ))
                    ) : (
                        // Fallback placeholders if fetch fails
                        [...Array(8)].map((_, i) => (
                            <div
                                key={i}
                                className="w-10 h-10 rounded-full bg-muted border-2 border-background"
                            />
                        ))
                    )}
                </Link>
            </div>
        </section>
    )
}

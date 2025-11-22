"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import { Github, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

interface SiteHeaderProps {
    dictionary?: Dictionary
    lang?: string
}

export function SiteHeader({ dictionary, lang = 'en' }: SiteHeaderProps) {
    const pathname = usePathname()
    const { setTheme, theme } = useTheme()

    return (
        <header className="border-grid sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container-wrapper px-2">
                <div className="flex h-14 items-center gap-2 md:gap-4">
                    {/* Logo and Main Nav */}
                    <div className="me-4 hidden md:flex">
                        <Link href={`/${lang}`} className="me-4 flex items-center gap-2 text-foreground lg:me-6">
                            <Image src="/logo.png" alt="Hogwarts Logo" width={24} height={24} className="dark:invert" />
                            <h5 className="hidden lg:inline-block font-semibold">
                                {dictionary?.navigation?.brandName || "Hogwarts"}
                            </h5>
                        </Link>
                        <nav className="flex items-center gap-6 xl:gap-8">
                            <Link
                                href={`/${lang}/docs`}
                                className={cn(
                                    "text-sm font-medium transition-colors hover:text-primary",
                                    pathname?.includes("/docs")
                                        ? "text-foreground"
                                        : "text-muted-foreground"
                                )}
                            >
                                {dictionary?.navigation?.documentation || "Documentation"}
                            </Link>
                            <Link
                                href={`/${lang}/onboarding`}
                                className={cn(
                                    "text-sm font-medium transition-colors hover:text-primary",
                                    pathname?.includes("/onboarding")
                                        ? "text-foreground"
                                        : "text-muted-foreground"
                                )}
                            >
                                {dictionary?.navigation?.features || "Get Started"}
                            </Link>
                            <Link
                                href={`/${lang}/pricing`}
                                className={cn(
                                    "text-sm font-medium transition-colors hover:text-primary",
                                    pathname?.includes("/pricing")
                                        ? "text-foreground"
                                        : "text-muted-foreground"
                                )}
                            >
                                {dictionary?.navigation?.pricing || "Pricing"}
                            </Link>
                            <Link
                                href={`/${lang}/blog`}
                                className={cn(
                                    "text-sm font-medium transition-colors hover:text-primary",
                                    pathname?.includes("/blog")
                                        ? "text-foreground"
                                        : "text-muted-foreground"
                                )}
                            >
                                {dictionary?.navigation?.blog || "Blog"}
                            </Link>
                        </nav>
                    </div>

                    {/* Mobile Logo */}
                    <Link href={`/${lang}`} className="flex items-center gap-2 md:hidden">
                        <Image src="/logo.png" alt="Hogwarts Logo" width={24} height={24} className="dark:invert" />
                        <span className="font-semibold">{dictionary?.navigation?.brandName || "Hogwarts"}</span>
                    </Link>

                    {/* Right Actions */}
                    <div className="ms-auto flex items-center gap-2 md:flex-1 md:justify-end">
                        <nav className="flex items-center gap-0.5">
                            <Button
                                asChild
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 px-0"
                            >
                                <Link
                                    href="https://github.com/databayt/hogwarts"
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    <Github className="h-4 w-4" />
                                    <span className="sr-only">GitHub</span>
                                </Link>
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 px-0"
                                onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                            >
                                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                                <span className="sr-only">Toggle theme</span>
                            </Button>
                        </nav>
                    </div>
                </div>
            </div>
        </header>
    )
}
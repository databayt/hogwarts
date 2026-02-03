import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { env } from "@/env.mjs"
import { cn, nFormatter } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { Icons } from "@/components/icons"
import type { Locale } from "@/components/internationalization/config"

import { siteConfig } from "../config/site"

interface HeroLandingProps {
  lang?: Locale
}

export default async function HeroLanding({ lang }: HeroLandingProps) {
  const { stargazers_count: stars } = await fetch(
    "https://api.github.com/repos/mickasmt/next-saas-stripe-starter",
    {
      ...(env.GITHUB_OAUTH_TOKEN && {
        headers: {
          Authorization: `Bearer ${process.env.GITHUB_OAUTH_TOKEN}`,
          "Content-Type": "application/json",
        },
      }),
      // data will revalidate every hour
      next: { revalidate: 3600 },
    }
  )
    .then((res) => res.json())
    .catch((e) => console.log(e))

  return (
    <section className="space-y-6 py-12 sm:py-20 lg:py-20">
      <div className="container flex max-w-5xl flex-col items-center gap-5 text-center">
        <Link
          href="https://twitter.com/miickasmt/status/1810465801649938857"
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "rounded-full px-4"
          )}
          target="_blank"
        >
          <span className="me-3">🎉</span>
          <span className="hidden md:flex">Introducing&nbsp;</span> Next Auth
          Roles Template on <Icons.tweets className="ms-2 size-3.5" />
        </Link>

        <h1 className="tracking-tight text-balance">
          Kick off with a bang with{" "}
          <span className="text-gradient_indigo-purple">SaaS Starter</span>
        </h1>

        <p
          className="text-muted-foreground max-w-2xl leading-normal text-balance"
          style={{ animationDelay: "0.35s", animationFillMode: "forwards" }}
        >
          Build your next project using Next.js 14, Prisma, Neon, Auth.js v5,
          Resend, React Email, Shadcn/ui, Stripe.
        </p>

        <div
          className="flex justify-center space-x-2 md:space-x-4"
          style={{ animationDelay: "0.4s", animationFillMode: "forwards" }}
        >
          <Link
            href={`/${lang}/pricing`}
            prefetch={true}
            className={cn(buttonVariants({ size: "lg" }), "gap-2 rounded-full")}
          >
            <span>Go Pricing</span>
            <ArrowRight className="size-4" />
          </Link>
          <Link
            href={siteConfig.links.github}
            target="_blank"
            rel="noreferrer"
            className={cn(
              buttonVariants({
                variant: "outline",
                size: "lg",
              }),
              "rounded-full px-5"
            )}
          >
            <Icons.github className="me-2 size-4" />
            <p>
              <span className="hidden sm:inline-block">Star on</span> GitHub{" "}
              <span>{nFormatter(stars)}</span>
            </p>
          </Link>
        </div>
      </div>
    </section>
  )
}

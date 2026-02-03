import Link from "next/link"
import { AlertTriangle } from "lucide-react"

import { Button } from "../ui/button"

export function NewComers() {
  return (
    <section className="py-16 md:py-24">
      <div className="text-center">
        <p className="text-muted-foreground flex items-center justify-center gap-2">
          <AlertTriangle className="h-4 w-4" /> Internal
        </p>
        <h2 className="font-heading pb-4 text-4xl font-extrabold md:text-5xl">
          New Comers
        </h2>

        <p className="text-muted-foreground pb-8">Welcome on board</p>

        <Link href="/onboarding">
          <Button size="lg" className="rounded-full py-6">
            Onboarding
          </Button>
        </Link>
      </div>
    </section>
  )
}

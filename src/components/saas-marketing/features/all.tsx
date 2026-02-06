import Link from "next/link"
import { Search } from "lucide-react"

import { Input } from "@/components/ui/input"
import type { Locale } from "@/components/internationalization/config"
import type { getDictionary } from "@/components/internationalization/dictionaries"

import { features } from "./constants"

interface Props {
  dictionary: Awaited<ReturnType<typeof getDictionary>>
  lang: Locale
}

export default function AllFeatures(props: Props) {
  return (
    <div>
      <div className="flex flex-col items-center space-y-4 py-16 text-center">
        <h1 className="font-heading text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
          Features
        </h1>
        <p className="text-muted-foreground max-w-2xl text-lg text-balance md:text-xl">
          Feature-based pricing — pay only for what you need. Scale your school
          management with modules that grow with you.
        </p>
        <div className="relative w-full max-w-xs pt-4">
          <Search className="text-muted-foreground absolute start-3 top-1/2 h-4 w-4 translate-y-0.5" />
          <Input
            type="search"
            placeholder="Search features..."
            className="w-full ps-10"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 py-12 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {features.map((feature) => (
          <Link
            key={feature.id}
            href="#"
            className="bg-background hover:border-primary text-foreground hover:text-foreground relative overflow-hidden rounded-lg border p-2 transition-[border-color] duration-200"
          >
            <div className="flex h-[180px] flex-col justify-between rounded-sm p-6">
              {/* <div className="w-fit  p-2"> */}
              <div className="text-foreground">{feature.icon}</div>
              {/* </div> */}
              <div className="space-y-2">
                <h4 className="text-foreground">{feature.title}</h4>
                <small className="muted font-light">
                  {feature.description}
                </small>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

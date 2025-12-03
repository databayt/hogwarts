import Link from "next/link"
import { features } from "./constants"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import type { getDictionary } from "@/components/internationalization/dictionaries";
import type { Locale } from "@/components/internationalization/config";

interface Props {
  dictionary: Awaited<ReturnType<typeof getDictionary>>;
  lang: Locale;
}

export default function AllFeatures(props: Props) {
  return (
    <div>
        <div className="flex flex-col items-center text-center space-y-4 py-16">
          <h1 className="font-heading font-bold tracking-tight text-4xl md:text-5xl lg:text-6xl">
            Features
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl max-w-2xl text-balance">
            Feature-based pricing — pay only for what you need. Scale your school management with modules that grow with you.
          </p>
          <div className="relative w-full max-w-xs pt-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 translate-y-0.5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search features..."
              className="w-full pl-10"
            />
          </div>
        </div>
    
    <div className="grid grid-cols-1 gap-4 py-12 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {features.map((feature) => (
        <Link
          key={feature.id}
          href="#"
          className="relative overflow-hidden rounded-lg border bg-background p-2 hover:border-primary transition-[border-color] duration-200 text-foreground hover:text-foreground"
        >
          <div className="flex h-[180px] flex-col justify-between rounded-sm p-6">
            {/* <div className="w-fit  p-2"> */}
            <div className="text-foreground">
              {feature.icon}
            </div>
            {/* </div> */}
            <div className="space-y-2">
              <h4 className="text-foreground">
                {feature.title}
              </h4>
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
